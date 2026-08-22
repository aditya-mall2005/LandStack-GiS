/**
 * GET /api/v1/admin/audit
 * Returns audit logs (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuditLogs } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  try {
    const logs = await getAuditLogs({
      limit: parseInt(searchParams.get("limit") || "50"),
      userId: searchParams.get("userId") || undefined,
      resourceType: searchParams.get("resourceType") || undefined,
      action: searchParams.get("action") || undefined,
    });

    return NextResponse.json({
      count: logs.length,
      logs,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
