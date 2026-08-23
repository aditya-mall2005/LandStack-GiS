"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/security/auth-context";
import apiClient from "@/lib/api-client";

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

export default function Dashboard() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [citizenApps, setCitizenApps] = useState<any[]>([]);

  useEffect(() => {
    apiClient
      .get("/api/stats")
      .then((res) => setStats(res.data))
      .catch(console.error);

    apiClient
      .get("/api/v1/applications")
      .then((res) => {
        if (res.data?.applications) setCitizenApps(res.data.applications);
      })
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

  const role = currentUser.role;

  return (
    <div className="app-content animate-in">
      {/* Role-Aware Welcome Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-lg) var(--space-xl)",
          marginBottom: "var(--space-lg)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "var(--radius-md)",
              background: "var(--brand-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              boxShadow: "0 4px 14px rgba(59, 130, 246, 0.35)",
            }}
          >
            {currentUser.icon}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f8fafc", margin: 0 }}>
                Welcome, {currentUser.name}
              </h1>
              <span className="badge badge-info" style={{ fontSize: 11 }}>
                {currentUser.role}
              </span>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-accent)", marginTop: 4, margin: 0 }}>
              {currentUser.title} • {currentUser.jurisdiction}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/login" className="btn btn-outline" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <span>⇄</span> Switch Role
          </Link>
          {role === "CITIZEN" ? (
            <Link href="/services" className="btn btn-primary" style={{ fontSize: 12 }}>
              + Apply Service
            </Link>
          ) : role === "ADMIN" || role === "AUDITOR" ? (
            <Link href="/admin/security" className="btn btn-primary" style={{ fontSize: 12 }}>
              🛡️ Security & Audit
            </Link>
          ) : (
            <Link href="/officer" className="btn btn-primary" style={{ fontSize: 12 }}>
              👨‍💼 Officer Desk
            </Link>
          )}
        </div>
      </div>

      {/* Hero Universal Search */}
      <div className="hero" style={{ padding: "var(--space-lg) var(--space-xl)", marginBottom: "var(--space-lg)" }}>
        <h2 className="hero-title" style={{ fontSize: 24, marginBottom: 4 }}>Land 360° Unified Registry</h2>
        <p className="hero-subtitle" style={{ fontSize: 13, maxWidth: 650, margin: "0 auto 16px" }}>
          Search any parcel to view unified land records across departments — RoR Khatiyan, deeds, encumbrance, cadastral GIS & tax.
        </p>
        <form className="hero-search" onSubmit={handleSearch} style={{ maxWidth: 640 }}>
          <span className="hero-search-icon">🔍</span>
          <input
            className="input"
            placeholder="Search by ULPIN (e.g. IN-BR-10-00000001-62), Survey/Khesra No., or Raiyat Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 48, fontSize: 13 }}
          />
        </form>
      </div>

      {/* ROLE SPECIFIC STATS GRID */}
      {role === "CITIZEN" && (
        <div className="stat-grid" style={{ marginBottom: "var(--space-lg)" }}>
          {[
            { icon: "📍", value: "3", label: "My Recorded Parcels", bg: "var(--status-info-bg)", desc: "Khesra #1420, #1894, #1648" },
            { icon: "📐", value: "12.4 Ac", label: "Total Landholding", bg: "var(--status-success-bg)", desc: "Mauza Arghawa (33)" },
            { icon: "📋", value: citizenApps.length || "2", label: "Active Applications", bg: "var(--status-warning-bg)", desc: "1 Approved, 1 In Review" },
            { icon: "💰", value: "₹ 45.00", label: "Annual Lagan / Revenue", bg: "rgba(139,92,246,0.12)", desc: "Jamabandi #45 (Paid)" },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      )}

      {role === "REVENUE_OFFICER" && (
        <div className="stat-grid" style={{ marginBottom: "var(--space-lg)" }}>
          {[
            { icon: "📍", value: stats?.overview.total_parcels || 300, label: "Jurisdiction Parcels", bg: "var(--status-info-bg)", desc: "Basopatti Circle" },
            { icon: "📋", value: "4", label: "Pending Mutation Queue", bg: "var(--status-warning-bg)", desc: "SLA: 21 Days Target" },
            { icon: "⚠️", value: "3", label: "Active Boundary Conflicts", bg: "var(--status-error-bg)", desc: "Overlaps on #1420, #1648, #1881" },
            { icon: "📜", value: stats?.overview.total_ror_records || 300, label: "Jamabandi RoR Records", bg: "var(--status-success-bg)", desc: "Bihar Digital Khatiyan" },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      )}

      {role === "REGISTRATION_OFFICER" && (
        <div className="stat-grid" style={{ marginBottom: "var(--space-lg)" }}>
          {[
            { icon: "📝", value: stats?.governance.registrations || 7, label: "Registered Deeds", bg: "var(--status-info-bg)", desc: "Madhubani District DSR" },
            { icon: "🔒", value: stats?.governance.encumbrances || 3, label: "Encumbrance Requests", bg: "var(--status-warning-bg)", desc: "Bank & Citizen NOCs" },
            { icon: "🏦", value: "2", label: "Active Bank Mortgages", bg: "rgba(139,92,246,0.12)", desc: "SBI & PNB Charges Registered" },
            { icon: "💵", value: "₹ 4.85 L", label: "Stamp Duty Realized", bg: "var(--status-success-bg)", desc: "Current Fiscal Quarter" },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      )}

      {role === "PLANNING_OFFICER" && (
        <div className="stat-grid" style={{ marginBottom: "var(--space-lg)" }}>
          {[
            { icon: "📐", value: stats?.spatial.master_plan_zones || 12, label: "Master Plan 2035 Zones", bg: "var(--status-info-bg)", desc: "Madhubani Planning Area" },
            { icon: "🏗️", value: stats?.governance.building_permissions || 3, label: "Building Permissions", bg: "var(--status-warning-bg)", desc: "Residential & Commercial" },
            { icon: "🌲", value: stats?.spatial.restriction_zones || 2, label: "Buffer Restriction Zones", bg: "rgba(236,72,153,0.12)", desc: "Kamla Nadi & Forest Setbacks" },
            { icon: "✅", value: "100%", label: "FAR Compliance Rate", bg: "var(--status-success-bg)", desc: "Automated Geospatial Rules" },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      )}

      {role === "TAX_OFFICER" && (
        <div className="stat-grid" style={{ marginBottom: "var(--space-lg)" }}>
          {[
            { icon: "🏛️", value: stats?.governance.property_tax || 300, label: "Assessed Properties", bg: "var(--status-info-bg)", desc: "Nagar Panchayat Basopatti" },
            { icon: "💰", value: "₹ 18.4 L", label: "Annual Tax Demand", bg: "var(--status-warning-bg)", desc: "GIS-Linked Assessment" },
            { icon: "✅", value: "₹ 14.2 L", label: "Total Tax Collected", bg: "var(--status-success-bg)", desc: "77.2% Collection Efficiency" },
            { icon: "⚠️", value: "12", label: "Defaulter Notices Pending", bg: "var(--status-error-bg)", desc: "Arrears > ₹10,000" },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      )}

      {(role === "ADMIN" || role === "AUDITOR") && (
        <div className="stat-grid" style={{ marginBottom: "var(--space-lg)" }}>
          {[
            { icon: "🛡️", value: "7", label: "SHA-256 Audit Logs", bg: "var(--status-info-bg)", desc: "Tamper-Evident Chain" },
            { icon: "🚫", value: "2", label: "Unauthorized Denials", bg: "var(--status-error-bg)", desc: "Cross-State ABAC Blocks" },
            { icon: "🤝", value: "3", label: "DPDPA 2023 Consents", bg: "var(--status-success-bg)", desc: "Active Purpose Registries" },
            { icon: "🔌", value: "4", label: "State Adapters Live", bg: "rgba(139,92,246,0.12)", desc: "Bihar, UP, MH, KA" },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      )}

      {/* ROLE SPECIFIC QUICK ACTIONS HUB */}
      <h3 className="section-title" style={{ marginBottom: "var(--space-md)", fontSize: 16 }}>
        {role === "CITIZEN" ? "Citizen Self-Service Workflows" : role === "ADMIN" || role === "AUDITOR" ? "System Governance & Security Hub" : "Department Operational Actions"}
      </h3>

      <div className="service-grid" style={{ marginBottom: "var(--space-lg)" }}>
        {role === "CITIZEN" && [
          { icon: "🗺️", name: "My Parcels on Cadastre", desc: "Interactive Cadastral GIS with Survey #", href: "/map" },
          { icon: "📄", name: "RoR / Khatiyan Extract", desc: "Download certified digital Jamabandi copy", href: "/services/ror-extract" },
          { icon: "📝", name: "Apply for Mutation", desc: "Initiate title transfer after deed purchase", href: "/services/mutation" },
          { icon: "📋", name: "Track My Applications", desc: "Live SLA tracking with step progress", href: "/applications" },
          { icon: "🔒", name: "Encumbrance Certificate", desc: "Verify non-encumbrance & bank charges", href: "/services/encumbrance-certificate" },
          { icon: "🏗️", name: "Building Plan Sanction", desc: "Apply for municipal building permit", href: "/services/building-permission" },
        ].map((s) => (
          <Link key={s.name} href={s.href} className="service-card">
            <div className="service-icon">{s.icon}</div>
            <div className="service-name">{s.name}</div>
            <div className="service-desc">{s.desc}</div>
          </Link>
        ))}

        {role === "REVENUE_OFFICER" && [
          { icon: "👨‍💼", name: "Mutation Approval Desk", desc: "Inspect Jamabandi & approve title transfer", href: "/officer" },
          { icon: "⚠️", name: "Boundary Dispute Resolver", desc: "Resolve 3 active spatial parcel overlaps", href: "/officer/conflicts" },
          { icon: "🗺️", name: "Cadastral Survey Map", desc: "Inspect 300 organic agricultural parcels", href: "/map" },
          { icon: "📜", name: "Jamabandi RoR Audit", desc: "Verify revenue khata & lagan records", href: "/services/ror-extract" },
        ].map((s) => (
          <Link key={s.name} href={s.href} className="service-card">
            <div className="service-icon">{s.icon}</div>
            <div className="service-name">{s.name}</div>
            <div className="service-desc">{s.desc}</div>
          </Link>
        ))}

        {role === "REGISTRATION_OFFICER" && [
          { icon: "📝", name: "Registration Queue", desc: "Verify registered sale deeds & stamps", href: "/officer?dept=Registration" },
          { icon: "🔒", name: "Issue Non-Encumbrance", desc: "Generate certified search certificate", href: "/services/encumbrance-certificate" },
          { icon: "🏦", name: "Bank Mortgage Registry", desc: "Review bank collateral charge filings", href: "/officer" },
          { icon: "🗺️", name: "Cadastral Verification", desc: "Cross-check deed geometry on GIS", href: "/map" },
        ].map((s) => (
          <Link key={s.name} href={s.href} className="service-card">
            <div className="service-icon">{s.icon}</div>
            <div className="service-name">{s.name}</div>
            <div className="service-desc">{s.desc}</div>
          </Link>
        ))}

        {role === "PLANNING_OFFICER" && [
          { icon: "📐", name: "Building Plan Desk", desc: "Sanction residential & commercial plans", href: "/officer?dept=Planning" },
          { icon: "🗺️", name: "Master Plan 2035 GIS", desc: "Evaluate zoning and land-use compliance", href: "/map" },
          { icon: "🌲", name: "Environmental Buffer Audit", desc: "Verify river & canal setback zones", href: "/map" },
          { icon: "🧠", name: "AI Geospatial Change", desc: "Satellite change detection radar", href: "/admin/intelligence" },
        ].map((s) => (
          <Link key={s.name} href={s.href} className="service-card">
            <div className="service-icon">{s.icon}</div>
            <div className="service-name">{s.name}</div>
            <div className="service-desc">{s.desc}</div>
          </Link>
        ))}

        {role === "TAX_OFFICER" && [
          { icon: "🏛️", name: "Municipal Tax Desk", desc: "Review property tax assessments", href: "/officer?dept=Taxation" },
          { icon: "💰", name: "Issue Demand Notices", desc: "Generate payment challans & receipts", href: "/services/property-tax" },
          { icon: "🗺️", name: "GIS Property Mapping", desc: "Audit built-up footprint vs tax slab", href: "/map" },
          { icon: "⚠️", name: "Arrears & Defaulters", desc: "Track high-value municipal arrears", href: "/officer" },
        ].map((s) => (
          <Link key={s.name} href={s.href} className="service-card">
            <div className="service-icon">{s.icon}</div>
            <div className="service-name">{s.name}</div>
            <div className="service-desc">{s.desc}</div>
          </Link>
        ))}

        {(role === "ADMIN" || role === "AUDITOR") && [
          { icon: "🛡️", name: "Security & Audit Engine", desc: "Immutable SHA-256 logs & ABAC simulator", href: "/admin/security" },
          { icon: "🔌", name: "State Adapter Hub", desc: "Unified national schema transformers", href: "/admin/adapters" },
          { icon: "🧠", name: "AI Satellite Intelligence", desc: "NDVI change & water body encroachment", href: "/admin/intelligence" },
          { icon: "📥", name: "Spatial Data Import", desc: "ETL pipeline for Shapefile/GeoJSON", href: "/admin/import" },
        ].map((s) => (
          <Link key={s.name} href={s.href} className="service-card">
            <div className="service-icon">{s.icon}</div>
            <div className="service-name">{s.name}</div>
            <div className="service-desc">{s.desc}</div>
          </Link>
        ))}
      </div>

      {/* TWO-COLUMN ROLE-AWARE ACTIVITY & QUEUE */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "var(--space-md)" }}>
        {/* Left Column: Role-Tailored Activity Queue */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              {role === "CITIZEN" ? "My Active Land Applications" : role === "ADMIN" || role === "AUDITOR" ? "Recent System Audit Trail" : "Department Action Queue"}
            </h3>
            <Link
              href={role === "CITIZEN" ? "/applications" : role === "ADMIN" || role === "AUDITOR" ? "/admin/security" : "/officer"}
              className="btn btn-ghost btn-sm"
            >
              View Full Queue →
            </Link>
          </div>

          {role === "CITIZEN" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {citizenApps.slice(0, 3).map((a) => (
                <div
                  key={a.application_no}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    background: "rgba(255, 255, 255, 0.02)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#38bdf8" }}>{a.application_no}</div>
                    <div style={{ fontSize: 12, color: "var(--text-primary)", marginTop: 2 }}>{a.service_type}</div>
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Parcel: {a.parcel_ulpin || "IN-BR-10-00000001-62"}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className={`badge ${a.status === "APPROVED" ? "badge-success" : a.status === "UNDER_REVIEW" ? "badge-warning" : "badge-info"}`}>
                      {a.status}
                    </span>
                    <div style={{ fontSize: 11, color: "#34d399", marginTop: 4 }}>● SLA on Track</div>
                  </div>
                </div>
              ))}
            </div>
          ) : role === "ADMIN" || role === "AUDITOR" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { actor: "Revenue Officer (TN)", action: "EDIT_ROR (Out of Scope)", res: "DENIED", time: "11:56 PM" },
                { actor: "Vikram Singh (BR)", action: "APPROVE_MUTATION", res: "SUCCESS", time: "09:51 PM" },
                { actor: "Priya Sharma (DSR)", action: "GENERATE_ENCUMBRANCE_CERT", res: "SUCCESS", time: "07:51 PM" },
              ].map((log, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    background: "rgba(255, 255, 255, 0.02)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>{log.actor}</div>
                    <div style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-secondary)" }}>{log.action}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className={`badge ${log.res === "SUCCESS" ? "badge-success" : "badge-error"}`}>{log.res}</span>
                    <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 2 }}>{log.time}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {citizenApps.slice(0, 3).map((a) => (
                <div
                  key={a.application_no}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    background: "rgba(255, 255, 255, 0.02)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#38bdf8" }}>{a.application_no}</div>
                    <div style={{ fontSize: 12, color: "var(--text-primary)" }}>{a.service_type} ({a.department})</div>
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Applicant: {a.applicant_name}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className={`badge ${a.status === "APPROVED" ? "badge-success" : "badge-warning"}`}>{a.status}</span>
                    <div style={{ fontSize: 11, color: "var(--text-accent)", marginTop: 4 }}>
                      <Link href={`/officer?app=${a.application_no}`} style={{ textDecoration: "none", color: "inherit", fontWeight: 700 }}>
                        Review Case →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Multi-Department Interoperability Status */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Interoperability Bridge</h3>
            <span className="badge badge-success">API Live</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { dept: "Revenue (Jamabandi RoR)", count: stats?.overview.total_ror_records || 300, status: "Connected", code: "BR-REV" },
              { dept: "Registration & Stamps", count: stats?.governance.registrations || 7, status: "Connected", code: "BR-DSR" },
              { dept: "Town Planning (Master Plan 2035)", count: stats?.spatial.master_plan_zones || 12, status: "Connected", code: "BR-TPO" },
              { dept: "Municipal Taxation", count: stats?.governance.property_tax || 300, status: "Connected", code: "BR-NP" },
              { dept: "C&AG / Security Audit", count: 7, status: "Active Chain", code: "AUDIT-256" },
            ].map((d) => (
              <div
                key={d.dept}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{d.dept}</div>
                  <div style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text-tertiary)" }}>{d.code}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="badge badge-neutral" style={{ fontSize: 10 }}>{d.count} records</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
