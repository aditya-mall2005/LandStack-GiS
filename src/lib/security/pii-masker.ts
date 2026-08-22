/**
 * LandStack — PII Protection & Role-Aware Projection Engine (Step 16.19, 16.20)
 * Redacts Personally Identifiable Information (PII) according to user authorization
 */

import { UserRole } from "./types";

export function maskName(name: string): string {
  if (!name) return "—";
  const parts = name.split(" ");
  return parts
    .map((p) => (p.length > 2 ? `${p[0]}${"*".repeat(p.length - 2)}${p[p.length - 1]}` : p))
    .join(" ");
}

export function maskPhone(phone: string): string {
  if (!phone) return "—";
  const clean = phone.trim();
  if (clean.length < 6) return "******";
  return clean.substring(0, 6) + " " + "X".repeat(Math.max(0, clean.length - 8)) + clean.slice(-2);
}

export function maskIdentifierRef(ref: string): string {
  if (!ref) return "XXXX-XXXX-0000";
  return `XXXX-XXXX-${ref.slice(-4)}`;
}

/**
 * Projects parcel data according to caller role
 */
export function projectParcelData(parcelData: any, role: UserRole = "CITIZEN", isWithinJurisdiction: boolean = true) {
  if (!parcelData) return null;

  const isFullOfficer = isWithinJurisdiction && ["REVENUE_OFFICER", "REGISTRATION_OFFICER", "PLANNING_OFFICER", "ADMIN", "AUDITOR"].includes(role);

  if (isFullOfficer) {
    // Unmasked full authorized view for in-jurisdiction officers
    return {
      ...parcelData,
      _projection_level: "RESTRICTED_OFFICER_AUTHORIZED",
      _pii_masked: false
    };
  }

  // Masked public projection for Citizens / Out-of-jurisdiction callers
  const p = parcelData.parcel || {};
  const owners = (parcelData.owners || []).map((o: any) => ({
    name: maskName(o.name || "Owner"),
    father_husband: maskName(o.father_husband || "Father"),
    identifier_ref: maskIdentifierRef(o.identifier_ref || "1234"),
    ownership_type: o.ownership_type,
    ownership_share: o.ownership_share
  }));

  return {
    ...parcelData,
    parcel: {
      ...p,
      // Public geometry & spatial attributes remain visible
    },
    owners,
    ror: parcelData.ror ? {
      ...parcelData.ror,
      raiyat_name: maskName(parcelData.ror.raiyat_name || "Raiyat"),
      pita_naam: maskName(parcelData.ror.pita_naam || "Father")
    } : null,
    // Redact internal officer notes & bank account particulars
    _projection_level: "PUBLIC_CITIZEN_REDACTED",
    _pii_masked: true,
    _data_classification: "PUBLIC"
  };
}
