import { NextRequest, NextResponse } from 'next/server';
import { IngestPayload, IngestResponse } from '@/types/iotCloud';

// Rate Limiting Map for Ingestion Throttling (AGENTS.md Directive)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 60; // Max 1 request per second per device

function checkRateLimit(token: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(token);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(token, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }

  record.count += 1;
  return true;
}

// In-Memory state of actuators per device (shared for instant relay sync)
const activeActuators = new Map<string, Record<string, boolean>>();

export async function POST(request: NextRequest) {
  try {
    const tokenHeader = request.headers.get('x-device-token');
    const body: IngestPayload = await request.json();
    const token = tokenHeader || body.deviceToken;

    if (!token) {
      return NextResponse.json(
        { error: 'Missing device authentication token. Pass x-device-token header or deviceToken in body.' },
        { status: 401 }
      );
    }

    if (!checkRateLimit(token)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded: Telemetry interval should be at least 1-2 seconds.' },
        { status: 429 }
      );
    }

    // Default actuator state if not yet configured
    if (!activeActuators.has(token)) {
      activeActuators.set(token, {
        pin_2: false,
        pin_4: true,
        pin_15: false,
      });
    }

    const currentActuators = activeActuators.get(token) || {};

    const responseData: IngestResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Telemetry ingested successfully.',
      actuatorStates: currentActuators,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('IoT Ingestion error:', error);
    return NextResponse.json(
      { error: 'Failed to ingest telemetry packet.' },
      { status: 500 }
    );
  }
}

// Allow web dashboard to update actuator switch state
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceToken, pin, state } = body;

    if (!deviceToken || pin === undefined || state === undefined) {
      return NextResponse.json({ error: 'Missing deviceToken, pin, or state' }, { status: 400 });
    }

    if (!activeActuators.has(deviceToken)) {
      activeActuators.set(deviceToken, {});
    }

    const deviceMap = activeActuators.get(deviceToken)!;
    deviceMap[`pin_${pin}`] = Boolean(state);

    return NextResponse.json({
      success: true,
      actuatorStates: deviceMap,
      message: `Actuator pin_${pin} set to ${state ? 'ON' : 'OFF'}`,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update actuator state' }, { status: 500 });
  }
}
