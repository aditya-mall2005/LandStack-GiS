import { NextResponse } from "next/server";
import { processGovernanceAssistantQuery } from "@/lib/ai/assistant";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query: userQuery, role = "OFFICER", parcel_id, language = "en" } = body;

    if (!userQuery) {
      return NextResponse.json({ error: "query required" }, { status: 400 });
    }

    const result = await processGovernanceAssistantQuery(userQuery, role, parcel_id, language);
    return NextResponse.json({
      success: true,
      query: userQuery,
      reply: result.reply,
      tools_executed: result.toolsUsed,
      parcel: result.parcelData,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("AI Assistant error:", err);
    return NextResponse.json({ error: "Assistant execution failed", details: err.message }, { status: 500 });
  }
}
