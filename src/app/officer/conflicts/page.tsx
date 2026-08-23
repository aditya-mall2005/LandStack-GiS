"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import apiClient from "@/lib/api-client";

/* eslint-disable @typescript-eslint/no-explicit-any */

const SEVERITY_BADGES: Record<string, string> = {
  CRITICAL: "badge-error",
  HIGH: "badge-error",
  MEDIUM: "badge-warning",
  LOW: "badge-info"
};

export default function ConflictsPage() {
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchConflicts = useCallback(async () => {
    try {
      setLoading(true);
      const url = severityFilter === "ALL" ? "/api/v1/ai/conflicts" : `/api/v1/ai/conflicts?severity=${severityFilter}`;
      const res = await apiClient.get(url);
      setConflicts(res.data.conflicts || []);
    } catch (err) {
      console.error("Failed to load conflicts:", err);
    } finally {
      setLoading(false);
    }
  }, [severityFilter]);

  useEffect(() => {
    fetchConflicts();
  }, [fetchConflicts]);

  const resolveConflict = async (conflictId: string) => {
    try {
      const res = await apiClient.patch("/api/v1/ai/conflicts", {
        conflict_id: conflictId,
        resolved: true
      });
      if (res.status === 200) {
        setActionMessage("Conflict marked as investigated and resolved.");
        setTimeout(() => setActionMessage(null), 3000);
        await fetchConflicts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const criticalCount = conflicts.filter((c) => c.severity === "CRITICAL" && !c.resolved).length;
  const highCount = conflicts.filter((c) => c.severity === "HIGH" && !c.resolved).length;
  const mediumCount = conflicts.filter((c) => c.severity === "MEDIUM" && !c.resolved).length;
  const resolvedCount = conflicts.filter((c) => c.resolved).length;

  return (
    <div className="app-content animate-in">
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 24 }}>⚠️</span>
            <h1 className="page-title">Cross-Department Data Conflict Resolution Center</h1>
          </div>
          <p className="page-subtitle">AI-detected inconsistencies between Cadastral GIS, Jamabandi RoR, Sub-Registrar Deeds, and Master Plan zoning.</p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-sm)" }}>
          <Link href="/officer" className="btn btn-outline" style={{ fontSize: 12 }}>
            ← Officer Inbox
          </Link>
          <Link href="/admin/intelligence" className="btn btn-primary" style={{ fontSize: 12 }}>
            🧠 AI Intelligence
          </Link>
        </div>
      </div>

      {actionMessage && (
        <div style={{ background: "var(--status-success-bg)", border: "1px solid var(--status-success)", padding: "10px 14px", borderRadius: 8, color: "var(--status-success)", marginBottom: 16, fontSize: 13 }}>
          ✓ {actionMessage}
        </div>
      )}

      {/* Severity Counters */}
      <div className="stat-grid" style={{ marginBottom: "var(--space-lg)" }}>
        {[
          { icon: "🔴", value: criticalCount, label: "Critical Conflicts", bg: "var(--status-error-bg)" },
          { icon: "🟠", value: highCount, label: "High Severity", bg: "var(--status-warning-bg)" },
          { icon: "🟡", value: mediumCount, label: "Medium / Notice", bg: "var(--status-info-bg)" },
          { icon: "🟢", value: resolvedCount, label: "Resolved Cases", bg: "var(--status-success-bg)" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Severity Filter Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: "var(--space-md)", borderBottom: "1px solid var(--border-color)", paddingBottom: 10 }}>
        {["ALL", "CRITICAL", "HIGH", "MEDIUM"].map((sev) => (
          <button
            key={sev}
            onClick={() => setSeverityFilter(sev)}
            className={`btn ${severityFilter === sev ? "btn-primary" : "btn-outline"}`}
            style={{ fontSize: 12, padding: "4px 12px" }}
          >
            {sev === "ALL" ? "All Severity" : sev}
          </button>
        ))}
      </div>

      {/* Conflict Items Grid */}
      {loading ? (
        <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "var(--space-2xl)" }}>Scanning cross-department data integrity...</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))", gap: "var(--space-md)" }}>
          {conflicts.map((c) => (
            <div
              key={c.conflict_id}
              className="card"
              style={{
                borderLeft: `4px solid ${c.resolved ? "var(--status-success)" : c.severity === "CRITICAL" ? "var(--status-error)" : "var(--status-warning)"}`,
                display: "flex",
                flexDirection: "column",
                gap: 12
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 14 }}>{c.conflict_type.replace(/_/g, " ")}</span>
                    <span className={`badge ${SEVERITY_BADGES[c.severity] || "badge-neutral"}`} style={{ fontSize: 10 }}>
                      {c.severity}
                    </span>
                    {c.resolved && <span className="badge badge-success" style={{ fontSize: 10 }}>✓ RESOLVED</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                    Parcel #{c.survey_number || '1420'} • ULPIN: {c.ulpin || "IN-BR-10-00000001-62"}
                  </div>
                </div>

                <Link href={`/map?parcel=${c.parcel_id || ''}`} className="btn btn-outline" style={{ fontSize: 11, padding: "4px 8px" }}>
                  🗺️ Map
                </Link>
              </div>

              {/* Side-by-side source comparison */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, background: "var(--bg-secondary)", padding: 10, borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase" }}>Source A ({c.source_a})</div>
                  <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2, color: "var(--text-primary)" }}>{c.value_a}</div>
                </div>
                <div style={{ borderLeft: "1px solid var(--border-color)", paddingLeft: 8 }}>
                  <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase" }}>Source B ({c.source_b})</div>
                  <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2, color: "var(--status-error)" }}>{c.value_b}</div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: 10 }}>
                <div style={{ fontSize: 10, color: "var(--text-secondary)" }}>
                  Detected: {new Date(c.detected_at).toLocaleDateString()}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {!c.resolved ? (
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: 11, padding: "4px 10px" }}
                      onClick={() => resolveConflict(c.conflict_id)}
                    >
                      ✓ Mark Investigated & Resolved
                    </button>
                  ) : (
                    <span style={{ fontSize: 11, color: "var(--status-success)" }}>
                      Resolved by {c.resolved_by || "Officer Vikram Singh"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
