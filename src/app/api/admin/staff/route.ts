import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// In-memory / Cookie / Store registry for Netlify Serverless environment
let approvedModerators: { email: string; name: string; picture?: string | null; approvedAt: string }[] = [];
let pendingRequests: { email: string; name: string; picture?: string | null; requestedAt: string }[] = [];

export function getApprovedModerators() {
  return approvedModerators;
}

export function getPendingRequests() {
  return pendingRequests;
}

export function addPendingRequest(user: { email: string; name: string; picture?: string | null }) {
  const existing = pendingRequests.find((r) => r.email === user.email);
  if (!existing && !approvedModerators.some((m) => m.email === user.email)) {
    pendingRequests.push({ ...user, requestedAt: new Date().toISOString() });
  }
}

export async function GET() {
  return NextResponse.json({
    approvedModerators,
    pendingRequests,
  });
}

export async function POST(request: Request) {
  try {
    const { action, email, name, picture } = await request.json();

    if (action === 'approve') {
      // Remove from pending
      pendingRequests = pendingRequests.filter((r) => r.email !== email);
      // Add to approved
      if (!approvedModerators.some((m) => m.email === email)) {
        approvedModerators.push({
          email,
          name: name || email,
          picture: picture || null,
          approvedAt: new Date().toISOString(),
        });
      }
      return NextResponse.json({ success: true, approvedModerators, pendingRequests });
    }

    if (action === 'reject') {
      pendingRequests = pendingRequests.filter((r) => r.email !== email);
      return NextResponse.json({ success: true, pendingRequests });
    }

    if (action === 'revoke') {
      approvedModerators = approvedModerators.filter((m) => m.email !== email);
      return NextResponse.json({ success: true, approvedModerators });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
