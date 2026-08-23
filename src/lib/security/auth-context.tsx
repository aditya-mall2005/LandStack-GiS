"use client";

import React, { createContext, useContext, useCallback, useSyncExternalStore } from "react";
import { UserRole, Permission } from "./types";
import { ROLE_PERMISSIONS } from "./rbac-matrix";
import * as Lucide from "lucide-react";

export const getLucideIcon = (iconName: string) => {
  switch (iconName) {
    case "User": return Lucide.User;
    case "Briefcase": return Lucide.Briefcase;
    case "FileSignature": return Lucide.FileSignature;
    case "Ruler": return Lucide.Ruler;
    case "Landmark": return Lucide.Landmark;
    case "Shield": return Lucide.Shield;
    case "Home": return Lucide.Home;
    case "Map": return Lucide.Map;
    case "LayoutDashboard": return Lucide.LayoutDashboard;
    case "Settings": return Lucide.Settings;
    case "Search": return Lucide.Search;
    default: return Lucide.User;
  }
};

export interface UserPersona {
  id: string;
  name: string;
  role: UserRole;
  title: string;
  department: string;
  icon: string;
  jurisdiction: string;
  stateCode: string;
  districtCode: string;
  circleCode: string;
  description: string;
  landingUrl: string;
  email: string;
  phone: string;
}

export const DEMO_PERSONAS: UserPersona[] = [
  {
    id: "CITIZEN_RAMESH",
    name: "Ramesh Kumar",
    role: "CITIZEN",
    title: "Citizen / Land Owner",
    department: "Public Citizen Portal",
    icon: "User",
    jurisdiction: "Basopatti, Madhubani (Bihar)",
    stateCode: "BR",
    districtCode: "BR-10",
    circleCode: "Basopatti",
    description: "Owns survey parcels #1420, #1894, #1648 in Mauza Arghawa (33). Can view own Jamabandi RoR, track mutations, apply for services.",
    landingUrl: "/",
    email: "ramesh.kumar@biharbhumi.bihar.gov.in",
    phone: "+91 98765 43210"
  },
  {
    id: "OFFICER_CO_VIKRAM",
    name: "Vikram Singh",
    role: "REVENUE_OFFICER",
    title: "Revenue Circle Officer (CO)",
    department: "Revenue",
    icon: "Briefcase",
    jurisdiction: "Basopatti Circle, Madhubani",
    stateCode: "BR",
    districtCode: "BR-10",
    circleCode: "Basopatti",
    description: "Statutory jurisdiction over Mauza Arghawa (33). Inspects Jamabandi RoR records, resolves boundary overlaps, approves/rejects mutations.",
    landingUrl: "/officer",
    email: "co.basopatti@bihar.gov.in",
    phone: "+91 94310 11111"
  },
  {
    id: "OFFICER_REG_PRIYA",
    name: "Priya Sharma",
    role: "REGISTRATION_OFFICER",
    title: "Sub-Registrar (DSR)",
    department: "Registration",
    icon: "FileSignature",
    jurisdiction: "Madhubani Registration District",
    stateCode: "BR",
    districtCode: "BR-10",
    circleCode: "ALL",
    description: "Registers sale deeds, mortgage deeds, issues Non-Encumbrance Certificates (NEC), logs stamp duty transactions.",
    landingUrl: "/officer?dept=Registration",
    email: "subreg.madhubani@bihar.gov.in",
    phone: "+91 94310 33333"
  },
  {
    id: "OFFICER_PLAN_ANAND",
    name: "Anand Verma",
    role: "PLANNING_OFFICER",
    title: "Town Planning Officer",
    department: "Planning",
    icon: "Ruler",
    jurisdiction: "Madhubani Planning Area",
    stateCode: "BR",
    districtCode: "BR-10",
    circleCode: "ALL",
    description: "Enforces Master Plan 2035 zoning regulations, evaluates FAR & building setbacks, inspects environmental buffer zones.",
    landingUrl: "/officer?dept=Planning",
    email: "tpo.madhubani@bihar.gov.in",
    phone: "+91 94310 44444"
  },
  {
    id: "OFFICER_TAX_SUNITA",
    name: "Sunita Rao",
    role: "TAX_OFFICER",
    title: "Executive Officer (Nagar Panchayat)",
    department: "Municipality",
    icon: "Landmark",
    jurisdiction: "Nagar Panchayat Basopatti",
    stateCode: "BR",
    districtCode: "BR-10",
    circleCode: "Basopatti",
    description: "Manages property tax assessments, GIS built-up footprint evaluations, demand notice issuance, and arrears collection.",
    landingUrl: "/officer?dept=Municipality",
    email: "eo.basopatti@bihar.gov.in",
    phone: "+91 94310 55555"
  },
  {
    id: "ADMIN_STATE_RAJESHWAR",
    name: "Rajeshwar Jha",
    role: "ADMIN",
    title: "State Nodal IT Administrator",
    department: "Revenue & Land Reforms Dept",
    icon: "Settings",
    jurisdiction: "State of Bihar (State-wide)",
    stateCode: "BR",
    districtCode: "ALL",
    circleCode: "ALL",
    description: "Configures heterogeneous State Adapters, oversees security policy ABAC rules, imports spatial shapefiles.",
    landingUrl: "/admin",
    email: "nodal.landstack@bihar.gov.in",
    phone: "+91 94310 00000"
  },
  {
    id: "AUDITOR_CAG_MEENAKSHI",
    name: "Meenakshi Sundaram",
    role: "AUDITOR",
    title: "Principal Auditor (C&AG / Vigilance)",
    department: "Audit & Vigilance Directorate",
    icon: "ShieldCheck",
    jurisdiction: "Union of India (National Scope)",
    stateCode: "ALL",
    districtCode: "ALL",
    circleCode: "ALL",
    description: "Inspects immutable tamper-evident SHA-256 audit logs, tracks DPDPA 2023 consent records, and verifies officer actions.",
    landingUrl: "/admin/security",
    email: "auditor.vigilance@cag.gov.in",
    phone: "+91 94310 22222"
  }
];

export interface AuthContextType {
  currentUser: UserPersona;
  allPersonas: UserPersona[];
  isMounted: boolean;
  loginAs: (roleOrId: string) => void;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  getInitials: (name: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "landstack_active_user";
const AUTH_EVENT_NAME = "landstack_auth_change";

function subscribeToAuth(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(AUTH_EVENT_NAME, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(AUTH_EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
}

let cachedUserJson = "";
let cachedUserPersona: UserPersona = DEMO_PERSONAS[0];

function getAuthSnapshot(): UserPersona {
  if (typeof window === "undefined") return DEMO_PERSONAS[0];
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem("landstack_user");
    if (raw && raw !== cachedUserJson) {
      cachedUserJson = raw;
      const parsed = JSON.parse(raw);
      const match = DEMO_PERSONAS.find((p) => p.id === parsed.id || p.role === parsed.role);
      if (match) {
        cachedUserPersona = match;
      }
    } else if (!raw) {
      cachedUserPersona = DEMO_PERSONAS[0];
    }
  } catch {}
  return cachedUserPersona;
}

function getAuthServerSnapshot(): UserPersona {
  return DEMO_PERSONAS[0];
}

function subscribeToMounted() {
  return () => {};
}
function getMountedSnapshot() {
  return true;
}
function getMountedServerSnapshot() {
  return false;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const currentUser = useSyncExternalStore(subscribeToAuth, getAuthSnapshot, getAuthServerSnapshot);
  const isMounted = useSyncExternalStore(subscribeToMounted, getMountedSnapshot, getMountedServerSnapshot);

  const loginAs = useCallback((roleOrId: string) => {
    const match = DEMO_PERSONAS.find(
      (p) => p.id === roleOrId || p.role === roleOrId
    ) || DEMO_PERSONAS[0];

    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(match));
      localStorage.setItem("landstack_user", JSON.stringify(match));
      document.cookie = `landstack_role=${match.role}; path=/; max-age=86400; SameSite=Lax`;
      cachedUserJson = JSON.stringify(match);
      cachedUserPersona = match;

      // Broadcast event to other listeners
      window.dispatchEvent(new CustomEvent(AUTH_EVENT_NAME, { detail: match }));
    } catch (e) {
      console.warn("Auth save error:", e);
    }
  }, []);

  const logout = useCallback(() => {
    const citizen = DEMO_PERSONAS[0];
    loginAs(citizen.id);
  }, [loginAs]);

  const hasPermission = useCallback((permission: Permission): boolean => {
    const allowed = (ROLE_PERMISSIONS as Record<string, Permission[]>)[currentUser.role] || [];
    return allowed.includes(permission);
  }, [currentUser.role]);

  const getInitials = useCallback((name: string): string => {
    if (!name) return "US";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allPersonas: DEMO_PERSONAS,
        isMounted,
        loginAs,
        logout,
        hasPermission,
        getInitials,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
