import { NextResponse } from "next/server";
import { normalizeStatePayload, STATE_ADAPTER_REGISTRY } from "@/lib/adapters";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { state_code = "BR", payload } = body;

    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ error: "Missing or invalid payload object" }, { status: 400 });
    }

    const result = normalizeStatePayload(state_code, payload);
    return NextResponse.json({
      success: true,
      state: state_code,
      adapter: result.config.state_name,
      system: result.config.ror_system_name,
      canonical: result.canonical,
      data_quality: result.quality
    });
  } catch (err: any) {
    console.error("Adapter normalization failed:", err);
    return NextResponse.json({ error: "Adapter normalization error", details: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    available_adapters: Object.values(STATE_ADAPTER_REGISTRY).map((a) => ({
      code: a.state_code,
      name: a.state_name,
      system: a.ror_system_name,
      unit: a.measurement_unit,
      admin_hierarchy: a.admin_hierarchy,
      sample_payload: a.sample_payload
    }))
  });
}
