"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEMO_ROLES = [
  {
    role: "CITIZEN",
    name: "Ramesh Kumar",
    title: "Citizen / Land Owner",
    department: "Citizen Services",
    icon: "👨‍🌾",
    jurisdiction: "Basopatti, Madhubani (Bihar)",
    description: "View owned parcels, download digital RoR/Khatiyan, track applications, and submit mutation requests.",
    landingUrl: "/services"
  },
  {
    role: "LAND_OFFICER",
    name: "Vikram Singh",
    title: "Revenue Circle Officer (CO)",
    department: "Revenue & Land Records",
    icon: "👨‍💼",
    jurisdiction: "Basopatti Circle, Madhubani",
    description: "Verify land titles, inspect Jamabandi records, approve mutations, and resolve cross-department data conflicts.",
    landingUrl: "/officer"
  },
  {
    role: "REGISTRATION_OFFICER",
    name: "Priya Sharma",
    title: "Sub-Registrar (DSR)",
    department: "Registration & Stamps",
    icon: "📝",
    jurisdiction: "Madhubani Registration District",
    description: "Review registered sale deeds, verify bank mortgage charges, and issue non-encumbrance certificates.",
    landingUrl: "/officer"
  },
  {
    role: "PLANNING_OFFICER",
    name: "Anand Verma",
    title: "Town Planning Officer",
    department: "Urban Planning & Development",
    icon: "📐",
    jurisdiction: "Madhubani Planning Area 2035",
    description: "Enforce Master Plan 2035 zoning, check Floor Area Ratio (FAR), and evaluate environmental buffer compliance.",
    landingUrl: "/officer"
  },
  {
    role: "MUNICIPALITY_OFFICER",
    name: "Sunita Rao",
    title: "Executive Officer (Nagar Panchayat)",
    department: "Municipal Administration",
    icon: "🏛️",
    jurisdiction: "Basopatti Nagar Panchayat",
    description: "Sanction residential/commercial building permits and review property tax assessments & arrears.",
    landingUrl: "/officer"
  },
  {
    role: "ADMIN",
    name: "System Administrator",
    title: "State Nodal Officer / Admin",
    department: "Digital Land Governance Mission",
    icon: "⚙️",
    jurisdiction: "Pan-India Interoperability Hub",
    description: "Configure State Adapters, monitor AI geospatial change detection, and audit system-wide data quality scores.",
    landingUrl: "/admin/intelligence"
  }
];

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState(DEMO_ROLES[1]);
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = (account: typeof DEMO_ROLES[0]) => {
    setSelectedRole(account);
    setLoggingIn(true);

    // Save to localStorage / cookie for demo sessions
    localStorage.setItem("landstack_user", JSON.stringify(account));
    document.cookie = `landstack_role=${account.role}; path=/; max-age=86400`;

    setTimeout(() => {
      router.push(account.landingUrl);
    }, 600);
  };

  return (
    <div className="app-content animate-in" style={{ maxWidth: 1100, margin: "0 auto", padding: "var(--space-2xl) var(--space-lg)" }}>
      <div style={{ textAlign: "center", marginBottom: "var(--space-2xl)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--brand-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
            🏛️
          </div>
          <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>LANDSTACK</span>
          <span className="badge badge-info" style={{ fontSize: 11 }}>RBAC v2.0</span>
        </div>
        <h1 className="page-title" style={{ fontSize: 32 }}>Select Demo Persona / Role</h1>
        <p className="page-subtitle" style={{ maxWidth: 640, margin: "8px auto 0" }}>
          Experience LandStack's role-based access control (RBAC). Each persona unlocks specialized land governance workflows, GIS tools, and decision-support engines.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-lg)" }}>
        {DEMO_ROLES.map((account) => {
          const isSelected = selectedRole.role === account.role;
          return (
            <div
              key={account.role}
              className="card"
              style={{
                cursor: "pointer",
                border: isSelected ? "2px solid var(--brand-primary)" : "1px solid var(--border-color)",
                background: isSelected ? "var(--brand-gradient-subtle)" : "var(--bg-secondary)",
                transition: "all 0.2s ease",
                transform: isSelected ? "translateY(-3px)" : "none",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
              onClick={() => handleLogin(account)}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ fontSize: 32, width: 50, height: 50, borderRadius: 12, background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {account.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{account.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-accent)" }}>{account.title}</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  <span className="badge badge-neutral" style={{ fontSize: 10 }}>🏢 {account.department}</span>
                  <span className="badge badge-info" style={{ fontSize: 10 }}>📍 {account.jurisdiction.split(",")[0]}</span>
                </div>

                <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
                  {account.description}
                </p>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
                disabled={loggingIn}
              >
                {loggingIn && isSelected ? "Logging in..." : `Sign in as ${account.title.split(" ")[0]}`} →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
