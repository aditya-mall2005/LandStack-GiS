/**
 * POST /api/v1/auth/login
 * Demo authentication — returns JWT-like token with role/permissions
 * 
 * Body: { email: string, password: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { DEMO_USERS, ROLE_PERMISSIONS } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Find demo user
    const user = DEMO_USERS.find(u => u.email === email);
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Generate demo token (in production use proper JWT)
    const token = Buffer.from(JSON.stringify({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      jurisdiction: user.jurisdiction,
      permissions: ROLE_PERMISSIONS[user.role],
      iat: Date.now(),
      exp: Date.now() + 24 * 60 * 60 * 1000,
    })).toString('base64');

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        jurisdiction: user.jurisdiction,
      },
      permissions: ROLE_PERMISSIONS[user.role],
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * GET /api/v1/auth/login
 * Returns available demo accounts
 */
export async function GET() {
  return NextResponse.json({
    demo_accounts: DEMO_USERS.map(u => ({
      email: u.email,
      name: u.name,
      role: u.role,
      department: u.department,
    })),
    note: "Demo authentication for SIH 2026 prototype. Use any email above with any password.",
  });
}
