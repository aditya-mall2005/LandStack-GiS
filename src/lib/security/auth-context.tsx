"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UserRole, Permission } from "./types";
import { ROLE_PERMISSIONS } from "./rbac-matrix";

export interface UserPersona {
  id: string;
  role: UserRole;
  name: string;
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
    id: "user_citizen_01",
    role: "CITIZEN",
    name: "Ramesh Kumar",
    title: "Citizen / Land Owner",
    department: "Citizen Services",
    icon: "👨‍🌾",
    jurisdiction: "Basopatti, Madhubani (Bihar)",
    stateCode: "BR",
    districtCode: "BR-10",
    circleCode: "BASOPATTI",
    description: "View owned parcels, download digital RoR/Khatiyan, track applications, and submit mutation requests.",
    landingUrl: "/services",
    email: "ramesh.kumar@bihar.gov.in",
    phone: "+91 98765 43210"
  },
  {
    id: "user_revenue_01",
    role: "REVENUE_OFFICER",
    name: "Vikram Singh",
    title: "Revenue Circle Officer (CO)",
    department: "Revenue & Land Records",
    icon: "👨‍💼",
    jurisdiction: "Basopatti Circle, Madhubani",
    stateCode: "BR",
    districtCode: "BR-10",
    circleCode: "BASOPATTI",
    description: "Verify land titles, inspect Jamabandi records, approve mutations, and resolve cross-department data conflicts.",
    landingUrl: "/officer",
    email: "co.basopatti@bihar.gov.in",
    phone: "+91 94310 12345"
  },
  {
    id: "user_reg_01",
    role: "REGISTRATION_OFFICER",
    name: "Priya Sharma",
    title: "Sub-Registrar (DSR)",
    department: "Registration & Stamps",
    icon: "📝",
    jurisdiction: "Madhubani Registration District",
    stateCode: "BR",
    districtCode: "BR-10",
    circleCode: "MADHUBANI_REG",
    description: "Review registered sale deeds, verify bank mortgage charges, and issue non-encumbrance certificates.",
    landingUrl: "/officer?dept=Registration",
    email: "dsr.madhubani@bihar.gov.in",
    phone: "+91 94310 67890"
  },
  {
    id: "user_plan_01",
    role: "PLANNING_OFFICER",
    name: "Anand Verma",
    title: "Town Planning Officer",
    department: "Urban Planning & Development",
    icon: "📐",
    jurisdiction: "Madhubani Planning Area 2035",
    stateCode: "BR",
    districtCode: "BR-10",
    circleCode: "MADHUBANI_PLAN",
    description: "Enforce Master Plan 2035 zoning, check Floor Area Ratio (FAR), and evaluate environmental buffer compliance.",
    landingUrl: "/officer?dept=Planning",
    email: "tpo.madhubani@bihar.gov.in",
    phone: "+91 94310 54321"
  },
  {
    id: "user_tax_01",
    role: "TAX_OFFICER",
    name: "Sunita Rao",
    title: "Executive Officer (Nagar Panchayat)",
    department: "Municipal Administration & Tax",
    icon: "🏛️",
    jurisdiction: "Basopatti Nagar Panchayat",
    stateCode: "BR",
    districtCode: "BR-10",
    circleCode: "BASOPATTI_MUNI",
    description: "Sanction residential/commercial building permits and review property tax assessments & arrears.",
    landingUrl: "/officer?dept=Taxation",
    email: "eo.basopatti@bihar.gov.in",
    phone: "+91 94310 98765"
  },
  {
    id: "user_admin_01",
    role: "ADMIN",
    name: "Rajeshwar Jha",
    title: "State Nodal Officer / Admin",
    department: "Digital Land Governance Mission",
    icon: "⚙️",
    jurisdiction: "Pan-India Interoperability Hub",
    stateCode: "BR",
    districtCode: "ALL",
    circleCode: "ALL",
    description: "Configure State Adapters, manage RBAC security, and audit system-wide data quality & threat radars.",
    landingUrl: "/admin/security",
    email: "nodal.landstack@bihar.gov.in",
    phone: "+91 94310 11111"
  },
  {
    id: "user_auditor_01",
    role: "AUDITOR",
    name: "Meenakshi Sundaram",
    title: "Principal Auditor (C&AG / Vigilance)",
    department: "Auditing & Vigilance",
    icon: "🛡️",
    jurisdiction: "State-Wide Audit Jurisdiction",
    stateCode: "BR",
    districtCode: "ALL",
    circleCode: "ALL",
    description: "Inspect immutable tamper-evident SHA-256 audit logs, track DPDPA 2023 consent records, and verify officer actions.",
    landingUrl: "/admin/security",
    email: "auditor.vigilance@cag.gov.in",
    phone: "+91 94310 22222"
  }
];

interface AuthContextType {
  currentUser: UserPersona;
  allPersonas: UserPersona[];
  loginAs: (roleOrId: string) => void;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  getInitials: (name: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "landstack_active_user";
const AUTH_EVENT_NAME = "landstack_auth_change";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize from localStorage or default to Revenue Officer Vikram Singh
  const [currentUser, setCurrentUser] = useState<UserPersona>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const match = DEMO_PERSONAS.find((p) => p.id === parsed.id || p.role === parsed.role);
          if (match) return match;
        }
      } catch (e) {
        console.warn("Auth initialization note:", e);
      }
    }
    return DEMO_PERSONAS[1];
  });

  useEffect(() => {
    const handleAuthEvent = (e: any) => {
      if (e.detail) {
        setCurrentUser(e.detail);
      }
    };

    window.addEventListener(AUTH_EVENT_NAME, handleAuthEvent);
    return () => window.removeEventListener(AUTH_EVENT_NAME, handleAuthEvent);
  }, []);

  const loginAs = useCallback((roleOrId: string) => {
    const match = DEMO_PERSONAS.find(
      (p) => p.id === roleOrId || p.role === roleOrId
    ) || DEMO_PERSONAS[0];

    setCurrentUser(match);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(match));
      localStorage.setItem("landstack_user", JSON.stringify(match));
      document.cookie = `landstack_role=${match.role}; path=/; max-age=86400; SameSite=Lax`;

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
    const allowed = ROLE_PERMISSIONS[currentUser.role] || [];
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
