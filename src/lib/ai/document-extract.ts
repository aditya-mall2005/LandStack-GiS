/**
 * LandStack — Document Intelligence & OCR Extraction (Step 14)
 * Extracts structured parameters from PDF deed / mutation scans and validates against DB
 */

export interface ExtractedField {
  field_name: string;
  extracted_value: string;
  confidence: number;
  source_page: number;
  db_match: boolean;
  db_value?: string;
  notes?: string;
}

export interface DocumentExtractionResult {
  document_id: string;
  document_name: string;
  document_type: "SALE_DEED" | "MUTATION_ORDER" | "ROR_KHATIYAN" | "ENCUMBRANCE_CERTIFICATE";
  file_size_kb: number;
  extracted_at: string;
  overall_confidence: number;
  fields: ExtractedField[];
  cross_validation_status: "MATCH" | "DISCREPANCY_FLAGGED" | "UNVERIFIED";
}

export const SAMPLE_DOCUMENTS: Record<string, DocumentExtractionResult> = {
  sale_deed_1420: {
    document_id: "DOC-2026-BR-0991",
    document_name: "Reg_SaleDeed_Basopatti_1420.pdf",
    document_type: "SALE_DEED",
    file_size_kb: 2450,
    extracted_at: new Date().toISOString(),
    overall_confidence: 0.96,
    fields: [
      { field_name: "Deed Number", extracted_value: "DEED/2026/8842", confidence: 0.99, source_page: 1, db_match: true, db_value: "DEED/2026/8842" },
      { field_name: "Survey / Khesra No.", extracted_value: "1420", confidence: 0.98, source_page: 2, db_match: true, db_value: "1420" },
      { field_name: "Khata Number", extracted_value: "45", confidence: 0.97, source_page: 2, db_match: true, db_value: "45" },
      { field_name: "Seller (Vendor)", extracted_value: "Late Jamun Yadav (Heirs)", confidence: 0.94, source_page: 1, db_match: true, db_value: "Rameshwar Yadav" },
      { field_name: "Buyer (Purchaser)", extracted_value: "Rameshwar Prasad Yadav", confidence: 0.98, source_page: 1, db_match: true, db_value: "Rameshwar Prasad Yadav" },
      { field_name: "Transferred Area", extracted_value: "1,350.00 sqm", confidence: 0.95, source_page: 2, db_match: false, db_value: "1,420.00 sqm", notes: "Deed mentions 1350 sqm; Cadastral GIS holds 1420 sqm (Difference: 70 sqm)" },
      { field_name: "Consideration Amount", extracted_value: "₹ 18,50,000", confidence: 0.99, source_page: 3, db_match: true, db_value: "₹ 18,50,000" },
      { field_name: "Stamp Duty Paid", extracted_value: "₹ 1,11,000 (6%)", confidence: 0.97, source_page: 3, db_match: true, db_value: "₹ 1,11,000" }
    ],
    cross_validation_status: "DISCREPANCY_FLAGGED"
  }
};

export function simulateDocumentExtraction(docType: string, customDocName?: string): DocumentExtractionResult {
  if (docType === "SALE_DEED" || !docType) {
    return {
      ...SAMPLE_DOCUMENTS.sale_deed_1420,
      document_name: customDocName || SAMPLE_DOCUMENTS.sale_deed_1420.document_name,
      extracted_at: new Date().toISOString()
    };
  }

  return {
    document_id: `DOC-EXT-${Date.now()}`,
    document_name: customDocName || "Uploaded_Land_Document.pdf",
    document_type: "MUTATION_ORDER",
    file_size_kb: 1820,
    extracted_at: new Date().toISOString(),
    overall_confidence: 0.94,
    fields: [
      { field_name: "Order Number", extracted_value: "MUT-BASO-2026-442", confidence: 0.98, source_page: 1, db_match: true, db_value: "MUT-BASO-2026-442" },
      { field_name: "Survey Number", extracted_value: "389", confidence: 0.96, source_page: 1, db_match: true, db_value: "389" },
      { field_name: "New Owner", extracted_value: "Sita Devi", confidence: 0.97, source_page: 1, db_match: true, db_value: "Sita Devi" },
      { field_name: "Mutation Type", extracted_value: "Varasat (Inheritance)", confidence: 0.92, source_page: 2, db_match: true, db_value: "Varasat" }
    ],
    cross_validation_status: "MATCH"
  };
}
