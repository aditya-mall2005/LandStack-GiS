import { NextResponse } from "next/server";
import { simulateDocumentExtraction } from "@/lib/ai/document-extract";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { document_type = "SALE_DEED", document_name } = body;

    const result = simulateDocumentExtraction(document_type, document_name);
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (err: any) {
    console.error("Document extraction error:", err);
    return NextResponse.json({ error: "Extraction failed", details: err.message }, { status: 500 });
  }
}
