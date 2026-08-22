/**
 * LandStack — Role-Permission Matrix (Step 16.4)
 * Strict, non-hardcoded authorization matrix across all government and citizen personas
 */

import { UserRole, Permission } from "./types";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  CITIZEN: [
    "SEARCH_PUBLIC_PARCEL",
    "VIEW_PUBLIC_GIS",
    "VIEW_ROR",           // Limited public projection
    "VIEW_REGISTRATION",  // Limited public projection
    "VIEW_PLANNING",      // Limited public projection
    "VIEW_TAX"            // Limited to own assessments
  ],
  REVENUE_OFFICER: [
    "SEARCH_PUBLIC_PARCEL",
    "VIEW_PUBLIC_GIS",
    "VIEW_ROR",
    "EDIT_ROR",
    "VIEW_REGISTRATION",
    "VIEW_PLANNING",
    "VIEW_TAX",
    "RESOLVE_CONFLICT",
    "DOWNLOAD_SIGNED_DOCS"
  ],
  REGISTRATION_OFFICER: [
    "SEARCH_PUBLIC_PARCEL",
    "VIEW_PUBLIC_GIS",
    "VIEW_ROR",
    "VIEW_REGISTRATION",
    "EDIT_REGISTRATION",
    "VIEW_PLANNING",
    "RESOLVE_CONFLICT",
    "DOWNLOAD_SIGNED_DOCS"
  ],
  PLANNING_OFFICER: [
    "SEARCH_PUBLIC_PARCEL",
    "VIEW_PUBLIC_GIS",
    "VIEW_ROR",
    "VIEW_PLANNING",
    "EDIT_BUILDING_PERMISSION",
    "RESOLVE_CONFLICT",
    "DOWNLOAD_SIGNED_DOCS"
  ],
  TAX_OFFICER: [
    "SEARCH_PUBLIC_PARCEL",
    "VIEW_PUBLIC_GIS",
    "VIEW_TAX",
    "RESOLVE_CONFLICT"
  ],
  AUDITOR: [
    "SEARCH_PUBLIC_PARCEL",
    "VIEW_PUBLIC_GIS",
    "VIEW_ROR",
    "VIEW_REGISTRATION",
    "VIEW_PLANNING",
    "VIEW_TAX",
    "VIEW_AUDIT_LOGS"
  ],
  ADMIN: [
    "SEARCH_PUBLIC_PARCEL",
    "VIEW_PUBLIC_GIS",
    "VIEW_ROR",
    "EDIT_ROR",
    "VIEW_REGISTRATION",
    "EDIT_REGISTRATION",
    "VIEW_PLANNING",
    "EDIT_BUILDING_PERMISSION",
    "VIEW_TAX",
    "RESOLVE_CONFLICT",
    "MANAGE_USERS",
    "VIEW_AUDIT_LOGS",
    "DOWNLOAD_SIGNED_DOCS"
  ]
};

export const ROLE_DEFINITIONS: Record<UserRole, { title: string; department: string; level: string; icon: string }> = {
  CITIZEN: { title: "Citizen / Land Owner", department: "Public / Citizen Services", level: "Public", icon: "👨‍🌾" },
  REVENUE_OFFICER: { title: "Revenue Circle Officer", department: "Revenue & Land Records", level: "Circle / Anchal", icon: "👨‍💼" },
  REGISTRATION_OFFICER: { title: "Sub-Registrar (DSR)", department: "Registration & Stamps", level: "District Registry", icon: "📝" },
  PLANNING_OFFICER: { title: "Town Planning Officer", department: "Urban Planning & Housing", level: "Planning Area", icon: "📐" },
  TAX_OFFICER: { title: "Municipal Tax Officer", department: "Municipal Administration", level: "Nagar Panchayat / Ward", icon: "🏛️" },
  AUDITOR: { title: "State Land Governance Auditor", department: "Audit & Oversight Directorate", level: "State / UT", icon: "🔍" },
  ADMIN: { title: "System Administrator", department: "Digital Land Governance Mission", level: "National / State", icon: "⚙️" }
};
