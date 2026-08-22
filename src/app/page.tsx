"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface StatsData {
  overview: {
    total_parcels: number;
    total_identifiers: number;
    total_owners: number;
    total_ror_records: number;
  };
  governance: {
    registrations: number;
    encumbrances: number;
    building_permissions: number;
    disputes: number;
    property_tax: number;
  };
  spatial: {
    land_use_zones: number;
    master_plan_zones: number;
    restriction_zones: number;
  };
  data_sources: {
    total: number;
    departments: string[];
  };
}

const SERVICES = [
  { icon: "🗺️", name: "Find Land", desc: "Search & view parcels on map", href: "/map" },
  { icon: "✓", name: "Verify Ownership", desc: "Check ownership records", href: "/services/ownership-verification" },
  { icon: "📄", name: "View RoR", desc: "Record of Rights extract", href: "/services/ror-extract" },
  { icon: "📋", name: "Track Application", desc: "Check application status", href: "/applications" },
  { icon: "🏗️", name: "Building Permission", desc: "Apply or check status", href: "/services/building-permission" },
  { icon: "💰", name: "Property Tax", desc: "View tax & make payments", href: "/services/property-tax" },
  { icon: "🔒", name: "Encumbrance", desc: "Check encumbrance status", href: "/services/encumbrance-certificate" },
  { icon: "📊", name: "Land Use", desc: "View land use & zoning", href: "/services/land-use-certificate" },
];

const RECENT_ACTIVITY = [
  { id: "LS-2026-00123", type: "Ownership Verification", status: "Under Review", time: "2 hours ago", color: "var(--status-warning)" },
  { id: "LS-2026-00119", type: "RoR Extract", status: "Completed", time: "1 day ago", color: "var(--status-success)" },
  { id: "LS-2026-00115", type: "Building Permission", status: "Document Verification", time: "3 days ago", color: "var(--status-info)" },
];

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim().length >= 2) {
        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      }
    },
    [searchQuery, router]
  );

  return (
    <div className="app-content animate-in">
      {/* Hero Search */}
      <div className="hero">
        <h1 className="hero-title">Land 360°</h1>
        <p className="hero-subtitle">
          Search any parcel to view unified land records from all departments —
          ownership, registration, encumbrance, planning & more.
        </p>
        <form className="hero-search" onSubmit={handleSearch}>
          <span className="hero-search-icon">🔍</span>
          <input
            className="input"
            placeholder="Search by ULPIN, Survey No., Khesra, or Owner Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 48 }}
          />
        </form>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stat-grid" style={{ marginBottom: "var(--space-lg)" }}>
          {[
            { icon: "📍", value: stats.overview.total_parcels, label: "Cadastral Parcels", bg: "var(--status-info-bg)" },
            { icon: "👤", value: stats.overview.total_owners, label: "Owners Mapped", bg: "var(--status-success-bg)" },
            { icon: "📋", value: stats.governance.registrations, label: "Registrations", bg: "var(--status-warning-bg)" },
            { icon: "🏛️", value: stats.data_sources.total, label: "Data Sources", bg: "rgba(139,92,246,0.12)" },
            { icon: "🗺️", value: (Number(stats.spatial.land_use_zones || 0) + Number(stats.spatial.master_plan_zones || 0) + Number(stats.spatial.restriction_zones || 0)), label: "GIS Layers", bg: "rgba(236,72,153,0.12)" },
            { icon: "⚠️", value: stats.governance.disputes, label: "Active Disputes", bg: "var(--status-error-bg)" },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
              <div className="stat-value">{Number(s.value).toLocaleString()}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Services */}
      <h3 className="section-title" style={{ marginBottom: "var(--space-md)" }}>Quick Services</h3>
      <div className="service-grid" style={{ marginBottom: "var(--space-lg)" }}>
        {SERVICES.map((s) => (
          <Link key={s.name} href={s.href} className="service-card">
            <div className="service-icon">{s.icon}</div>
            <div className="service-name">{s.name}</div>
            <div className="service-desc">{s.desc}</div>
          </Link>
        ))}
      </div>

      {/* Two-column: Recent Activity + Department Integration */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Activity</h3>
            <Link href="/applications" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          {RECENT_ACTIVITY.map((a) => (
            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{a.id}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{a.type}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span className="badge" style={{ background: a.color + "22", color: a.color }}>{a.status}</span>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>{a.time}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Department Integration */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Department Integration</h3>
            <span className="badge badge-success">All Connected</span>
          </div>
          {stats && [
            { dept: "Revenue (RoR)", count: stats.overview.total_ror_records, status: "✓" },
            { dept: "Registration", count: stats.governance.registrations, status: "✓" },
            { dept: "Planning & Zoning", count: stats.spatial.master_plan_zones, status: "✓" },
            { dept: "Municipal (Tax)", count: stats.governance.property_tax, status: "✓" },
            { dept: "Building Authority", count: stats.governance.building_permissions, status: "✓" },
            { dept: "Environment", count: stats.spatial.restriction_zones, status: "✓" },
          ].map((d) => (
            <div key={d.dept} className="field-row">
              <span className="field-label">{d.dept}</span>
              <span className="field-value">
                <span className="badge badge-success" style={{ marginRight: 8 }}>{d.status}</span>
                {Number(d.count).toLocaleString()} records
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="alert alert-info" style={{ marginTop: "var(--space-lg)" }}>
        ⚠️ This is a prototype for SIH 2026 (PS #26014). All data is synthetic and generated for demonstration purposes.
        This system does not represent official government records.
      </div>
    </div>
  );
}
