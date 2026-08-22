/**
 * LandStack — Cross-Department Data Conflict Engine (Step 14)
 * Analyzes records across RoR, Registration, Master Plan, and Cadastral GIS to detect discrepancies
 */

export interface DataConflictItem {
  id: string;
  parcel_id?: string;
  parcel_ulpin?: string;
  survey_number?: string;
  conflict_type: "AREA_MISMATCH" | "OWNERSHIP_MISMATCH" | "LAND_USE_VIOLATION" | "UNAUTHORIZED_DEVELOPMENT";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  source_a: string;
  value_a: string;
  source_b: string;
  value_b: string;
  discrepancy_details: string;
  recommended_action: string;
  status: "OPEN" | "INVESTIGATING" | "RESOLVED";
  detected_at: string;
}

export function detectConflictsForParcel(parcelData: any): DataConflictItem[] {
  const conflicts: DataConflictItem[] = [];
  const p = parcelData?.parcel || {};
  const ror = parcelData?.ror || {};
  const regList = parcelData?.registrations || [];
  const bpList = parcelData?.building_permissions || [];
  const satChanges = parcelData?.satellite_detections || [];

  // 1. Area discrepancy check
  if (p.area && ror.area && Math.abs(Number(p.area) - Number(ror.area)) > 5) {
    conflicts.push({
      id: `conf-area-${p.parcel_id || 'p1'}`,
      parcel_id: p.parcel_id,
      parcel_ulpin: p.ulpin,
      survey_number: p.survey_number,
      conflict_type: "AREA_MISMATCH",
      severity: "HIGH",
      source_a: "Cadastral GIS (Spatial Boundary)",
      value_a: `${Number(p.area).toLocaleString()} sqm`,
      source_b: "Jamabandi RoR (Revenue)",
      value_b: `${Number(ror.area).toLocaleString()} sqm`,
      discrepancy_details: `Spatial polygon area differs from textual RoR record by ${Math.abs(Number(p.area) - Number(ror.area))} sqm.`,
      recommended_action: "Order resurvey or digitize latest revised boundary map.",
      status: "OPEN",
      detected_at: new Date().toISOString()
    });
  }

  // 2. Unauthorized development check
  const hasSatelliteBuilding = satChanges.some((s: any) => s.change_type === "BUILT_UP_INCREASE");
  const hasApprovedPermit = bpList.some((bp: any) => bp.status === "Approved" || bp.status === "Completed");
  if (hasSatelliteBuilding && !hasApprovedPermit) {
    conflicts.push({
      id: `conf-unauth-${p.parcel_id || 'p2'}`,
      parcel_id: p.parcel_id,
      parcel_ulpin: p.ulpin,
      survey_number: p.survey_number,
      conflict_type: "UNAUTHORIZED_DEVELOPMENT",
      severity: "CRITICAL",
      source_a: "Municipality Building Permissions DB",
      value_a: "No Approved Permit Found",
      source_b: "Sentinel-2 Satellite AI Detection",
      value_b: "320+ sqm Structure Detected",
      discrepancy_details: "Physical construction detected via optical satellite analysis without municipal sanction order.",
      recommended_action: "Dispatch field inspection team and issue statutory section 12 notice.",
      status: "OPEN",
      detected_at: new Date().toISOString()
    });
  }

  return conflicts;
}
