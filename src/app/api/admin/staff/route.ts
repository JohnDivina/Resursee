import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface StaffUser {
  email: string;
  name: string;
  picture?: string | null;
  approvedAt?: string;
  requestedAt?: string;
}

interface StaffRegistry {
  approvedModerators: StaffUser[];
  pendingRequests: StaffUser[];
}

let inMemoryRegistry: StaffRegistry = {
  approvedModerators: [],
  pendingRequests: [],
};

const dataFilePath = path.join(process.cwd(), 'src/data/staff_registry.json');

function loadRegistry(): StaffRegistry {
  try {
    if (fs.existsSync(dataFilePath)) {
      const raw = fs.readFileSync(dataFilePath, 'utf-8');
      const parsed = JSON.parse(raw);
      inMemoryRegistry = {
        approvedModerators: parsed.approvedModerators || [],
        pendingRequests: parsed.pendingRequests || [],
      };
    }
  } catch {
    // Fallback to in-memory
  }
  return inMemoryRegistry;
}

function saveRegistry(data: StaffRegistry) {
  inMemoryRegistry = data;
  try {
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // ignore in read-only environments
  }
}

export function getApprovedModerators(): StaffUser[] {
  const reg = loadRegistry();
  return reg.approvedModerators;
}

export function getPendingRequests(): StaffUser[] {
  const reg = loadRegistry();
  return reg.pendingRequests;
}

export function addPendingRequest(user: { email: string; name: string; picture?: string | null }) {
  const reg = loadRegistry();
  const normalizedEmail = user.email.toLowerCase().trim();

  const isAlreadyApproved = reg.approvedModerators.some((m) => m.email.toLowerCase() === normalizedEmail);
  const isAlreadyPending = reg.pendingRequests.some((r) => r.email.toLowerCase() === normalizedEmail);

  if (!isAlreadyApproved && !isAlreadyPending) {
    reg.pendingRequests.unshift({
      email: normalizedEmail,
      name: user.name || normalizedEmail,
      picture: user.picture || null,
      requestedAt: new Date().toISOString(),
    });
    saveRegistry(reg);
  }
}

export async function GET() {
  const reg = loadRegistry();
  return NextResponse.json(reg);
}

export async function POST(request: Request) {
  try {
    const { action, email, name, picture } = await request.json();
    const reg = loadRegistry();
    const normalizedEmail = (email || '').toLowerCase().trim();

    if (action === 'approve') {
      // Remove from pending
      reg.pendingRequests = reg.pendingRequests.filter((r) => r.email.toLowerCase() !== normalizedEmail);
      // Add to approved
      if (!reg.approvedModerators.some((m) => m.email.toLowerCase() === normalizedEmail)) {
        reg.approvedModerators.unshift({
          email: normalizedEmail,
          name: name || normalizedEmail,
          picture: picture || null,
          approvedAt: new Date().toISOString(),
        });
      }
      saveRegistry(reg);
      return NextResponse.json({ success: true, ...reg });
    }

    if (action === 'reject') {
      reg.pendingRequests = reg.pendingRequests.filter((r) => r.email.toLowerCase() !== normalizedEmail);
      saveRegistry(reg);
      return NextResponse.json({ success: true, ...reg });
    }

    if (action === 'revoke') {
      reg.approvedModerators = reg.approvedModerators.filter((m) => m.email.toLowerCase() !== normalizedEmail);
      saveRegistry(reg);
      return NextResponse.json({ success: true, ...reg });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
