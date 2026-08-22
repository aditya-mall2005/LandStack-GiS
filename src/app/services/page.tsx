"use client";

import Link from "next/link";

const SERVICES = [
  {
    id: "ownership-verification",
    icon: "✓",
    name: "Ownership Verification",
    desc: "Verify ownership records across Revenue and Registration departments",
    dept: "Revenue + Registration",
    time: "2-3 business days",
  },
  {
    id: "ror-extract",
    icon: "📜",
    name: "RoR Extract",
    desc: "Request a certified copy of Record of Rights",
    dept: "Revenue Department",
    time: "3-5 business days",
  },
  {
    id: "encumbrance-certificate",
    icon: "🔒",
    name: "Encumbrance Certificate",
    desc: "Check encumbrance status and get certificate",
    dept: "Registration Department",
    time: "2-3 business days",
  },
  {
    id: "building-permission",
    icon: "🏗️",
    name: "Building Permission",
    desc: "Apply for building permission or check existing status",
    dept: "Municipal Authority",
    time: "15-30 business days",
  },
  {
    id: "land-use-certificate",
    icon: "🌾",
    name: "Land Use Certificate",
    desc: "Get certified land use and zoning information",
    dept: "Planning Department",
    time: "5-7 business days",
  },
  {
    id: "property-tax",
    icon: "💰",
    name: "Property Tax Query",
    desc: "View property tax assessment and payment history",
    dept: "Municipal Authority",
    time: "Instant",
  },
  {
    id: "mutation",
    icon: "📋",
    name: "Property Mutation",
    desc: "Apply for mutation / name transfer in revenue records",
    dept: "Revenue Department",
    time: "15-45 business days",
  },
  {
    id: "restriction-check",
    icon: "⚠️",
    name: "Restriction Check",
    desc: "Check if parcel falls in restricted/protected zone",
    dept: "Environment + Planning",
    time: "Instant",
  },
];

export default function ServicesPage() {
  return (
    <div className="app-content animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Land Services</h1>
          <p className="page-subtitle">Access all land governance services from a single platform</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "var(--space-md)" }}>
        {SERVICES.map((s) => (
          <Link key={s.id} href={`/services/${s.id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="card card-clickable" style={{ height: "100%" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-md)" }}>
                <div style={{ fontSize: 28, flexShrink: 0, marginTop: 2 }}>{s.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{s.name}</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: "var(--space-sm)" }}>{s.desc}</div>
                  <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
                    <span className="badge badge-info">{s.dept}</span>
                    <span className="badge badge-neutral">⏱ {s.time}</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
