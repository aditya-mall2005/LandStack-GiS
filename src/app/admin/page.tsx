"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats).catch(console.error);
  }, []);

  return (
    <div className="app-content animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ Admin Dashboard</h1>
          <p className="page-subtitle">System overview, data quality, and integration management</p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-sm)" }}>
          <Link href="/admin/import" className="btn btn-primary">📥 Import Data</Link>
          <span className="badge badge-info">Role: ADMIN</span>
        </div>
      </div>

      {stats && (
        <>
          {/* Overview Stats */}
          <div className="stat-grid" style={{ marginBottom: "var(--space-lg)" }}>
            {[
              { icon: "📍", value: stats.overview.total_parcels, label: "Total Parcels", bg: "var(--status-info-bg)" },
              { icon: "🆔", value: stats.overview.total_identifiers, label: "Identifiers", bg: "rgba(139,92,246,0.12)" },
              { icon: "👤", value: stats.overview.total_owners, label: "Owners", bg: "var(--status-success-bg)" },
              { icon: "📜", value: stats.overview.total_ror_records, label: "RoR Records", bg: "var(--status-warning-bg)" },
              { icon: "🏛️", value: stats.data_sources?.total || 0, label: "Data Sources", bg: "rgba(236,72,153,0.12)" },
              { icon: "⚠️", value: stats.conflicts?.total_conflicts || 0, label: "Data Conflicts", bg: "var(--status-error-bg)" },
            ].map((s) => (
              <div key={s.label} className="stat-card">
                <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
                <div className="stat-value">{Number(s.value).toLocaleString()}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)", marginBottom: "var(--space-lg)" }}>
            {/* Governance Layers */}
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: "var(--space-md)" }}>Governance Layers</h3>
              {[
                ["Registrations", stats.governance?.registrations, "📝"],
                ["Encumbrances", stats.governance?.encumbrances, "🔒"],
                ["Building Permissions", stats.governance?.building_permissions, "🏗️"],
                ["Disputes", stats.governance?.disputes, "⚖️"],
                ["Property Tax", stats.governance?.property_tax, "💰"],
                ["Circle Rates", stats.governance?.circle_rates, "📊"],
              ].map(([label, count, icon]) => (
                <div key={label as string} className="field-row">
                  <span className="field-label">{icon} {label as string}</span>
                  <span className="field-value">{Number(count || 0).toLocaleString()} records</span>
                </div>
              ))}
            </div>

            {/* Spatial Layers */}
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: "var(--space-md)" }}>Spatial Layers</h3>
              {[
                ["Land Use Zones", stats.spatial?.land_use_zones, "🌾"],
                ["Master Plan Zones", stats.spatial?.master_plan_zones, "📐"],
                ["Restriction Zones", stats.spatial?.restriction_zones, "⚠️"],
              ].map(([label, count, icon]) => (
                <div key={label as string} className="field-row">
                  <span className="field-label">{icon} {label as string}</span>
                  <span className="field-value">{Number(count || 0).toLocaleString()} zones</span>
                </div>
              ))}

              <h4 className="section-title" style={{ marginTop: "var(--space-lg)" }}>Land Type Distribution</h4>
              {stats.land_types?.map((lt: any) => (
                <div key={lt.type} className="field-row">
                  <span className="field-label">{lt.type}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                    <div className="progress-bar" style={{ width: 100 }}>
                      <div className="progress-fill" style={{ width: `${(lt.count / stats.overview.total_parcels) * 100}%` }} />
                    </div>
                    <span className="field-value">{lt.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Integration Quality */}
          <div className="card" style={{ marginBottom: "var(--space-lg)" }}>
            <div className="card-header">
              <h3 className="card-title">Data Integration Quality</h3>
              <span className="badge badge-success">Match Rate: {stats.integration?.match_rate || 100}%</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-lg)" }}>
              <div>
                <div className="section-title">Match Methods</div>
                {stats.integration?.match_methods?.map((m: any) => (
                  <div key={m.method} className="field-row">
                    <span className="field-label">{m.method}</span>
                    <span className="field-value">{m.count} ({m.avg_score}%)</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="section-title">Match Status</div>
                {stats.integration?.match_summary?.map((s: any) => (
                  <div key={s.status} className="field-row">
                    <span className="field-label">{s.status}</span>
                    <span className="field-value">{s.count}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="section-title">Department Sources</div>
                {stats.data_sources?.departments?.map((d: string) => (
                  <div key={d} className="field-row">
                    <span className="badge badge-success" style={{ marginRight: 4 }}>✓</span>
                    <span className="field-label">{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
