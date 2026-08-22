"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ROLE_DEFINITIONS } from "@/lib/security/rbac-matrix";
import { UserRole, Permission } from "@/lib/security/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

const ACTIONS_LIST: { id: Permission; label: string; group: string }[] = [
  { id: "SEARCH_PUBLIC_PARCEL", label: "Search Public Parcel & Geometry", group: "Public GIS" },
  { id: "VIEW_PUBLIC_GIS", label: "View Public Basemap & Zoning", group: "Public GIS" },
  { id: "VIEW_ROR", label: "View Jamabandi RoR Record", group: "Revenue" },
  { id: "EDIT_ROR", label: "Modify / Update RoR Record", group: "Revenue" },
  { id: "VIEW_REGISTRATION", label: "View Registered Deeds & Liens", group: "Registration" },
  { id: "EDIT_REGISTRATION", label: "Register New Sale Deed / Charge", group: "Registration" },
  { id: "VIEW_PLANNING", label: "View Master Plan 2035 Zoning", group: "Planning" },
  { id: "EDIT_BUILDING_PERMISSION", label: "Approve Building Sanction", group: "Planning" },
  { id: "VIEW_TAX", label: "View Property Tax Assessments", group: "Municipal Tax" },
  { id: "RESOLVE_CONFLICT", label: "Resolve Cross-Dept Data Conflict", group: "Governance" },
  { id: "VIEW_AUDIT_LOGS", label: "Inspect Immutable Audit Trail", group: "Audit" },
  { id: "MANAGE_USERS", label: "Manage User Roles & Scopes", group: "Admin" },
];

export default function SecurityAuditConsole() {
  const [activeTab, setActiveTab] = useState<"audit" | "threats" | "simulator" | "consents" | "pii">("audit");

  // Audit State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [resultFilter, setResultFilter] = useState("ALL");
  const [selectedAuditLog, setSelectedAuditLog] = useState<any | null>(null);

  // Threat Radar State
  const [threats, setThreats] = useState<any[]>([]);

  // Policy Simulator State
  const [simRole, setSimRole] = useState<UserRole>("REVENUE_OFFICER");
  const [simState, setSimState] = useState("BR");
  const [simDistrict, setSimDistrict] = useState("Madhubani");
  const [simAction, setSimAction] = useState<Permission>("EDIT_ROR");
  const [targetState, setTargetState] = useState("BR");
  const [targetDistrict, setTargetDistrict] = useState("Madhubani");
  const [simResult, setSimResult] = useState<any | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  // Consents State
  const [consents, setConsents] = useState<any[]>([]);

  // PII Preview State
  const [piiData, setPiiData] = useState<any | null>(null);

  const fetchAuditLogs = useCallback(async () => {
    try {
      let url = "/api/v1/security/audit-logs?";
      if (roleFilter !== "ALL") url += `role=${roleFilter}&`;
      if (resultFilter !== "ALL") url += `result=${resultFilter}&`;
      const res = await fetch(url);
      const data = await res.json();
      setAuditLogs(data.logs || []);
    } catch (err) {
      console.error(err);
    }
  }, [roleFilter, resultFilter]);

  const fetchThreats = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/security/threats");
      const data = await res.json();
      setThreats(data.threats || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchConsents = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/security/consents");
      const data = await res.json();
      setConsents(data.consents || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchPiiPreview = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/security/mask-preview?id=1420");
      const data = await res.json();
      setPiiData(data.projections);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchAuditLogs();
    fetchThreats();
    fetchConsents();
    fetchPiiPreview();
  }, [fetchAuditLogs, fetchThreats, fetchConsents, fetchPiiPreview]);

  const handleEvaluateSimulator = async () => {
    setEvaluating(true);
    try {
      const res = await fetch("/api/v1/security/policy-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          principal: {
            user_id: `USR-${simRole.slice(0, 3)}-01`,
            name: `${ROLE_DEFINITIONS[simRole]?.title} (${simState})`,
            role: simRole,
            department: ROLE_DEFINITIONS[simRole]?.department,
            scope: { state_code: simState, district_code: simDistrict }
          },
          action: simAction,
          resource_type: "PARCEL",
          resource_id: "IN-BR-10-00000001-62",
          target_scope: { state_code: targetState, district_code: targetDistrict }
        })
      });
      const data = await res.json();
      setSimResult(data);
      await fetchAuditLogs(); // Refresh audit table with the newly logged check
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleRevokeConsent = async (consentNo: string) => {
    try {
      await fetch("/api/v1/security/consents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent_no: consentNo, status: "REVOKED" })
      });
      await fetchConsents();
    } catch (err) {
      console.error(err);
    }
  };

  const deniedAuditCount = auditLogs.filter((l) => l.result === "DENIED").length;
  const openThreatsCount = threats.filter((t) => t.status === "OPEN").length;

  return (
    <div className="app-content animate-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 24 }}>🛡️</span>
            <h1 className="page-title">Security, RBAC, Consent & Audit Architecture</h1>
          </div>
          <p className="page-subtitle">End-to-end zero-trust security: ABAC geographic authorization, immutable audit trail, DPDPA 2023 consent, and PII masking.</p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-sm)" }}>
          <Link href="/login" className="btn btn-outline" style={{ fontSize: 12 }}>
            ⇄ Switch Role
          </Link>
          <Link href="/admin/intelligence" className="btn btn-primary" style={{ fontSize: 12 }}>
            🧠 AI Intelligence
          </Link>
        </div>
      </div>

      {/* Security Architecture KPI Strip */}
      <div className="stat-grid" style={{ marginBottom: "var(--space-lg)" }}>
        {[
          { icon: "📜", value: auditLogs.length, label: "Audit Events Logged", bg: "var(--status-info-bg)" },
          { icon: "🚫", value: deniedAuditCount, label: "Unauthorized Access Denials", bg: "var(--status-error-bg)" },
          { icon: "🚨", value: openThreatsCount, label: "Active Threat Alerts", bg: "var(--status-warning-bg)" },
          { icon: "🤝", value: consents.filter(c => c.status === "ACTIVE").length, label: "Active Citizen Consents", bg: "var(--status-success-bg)" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main Security Console Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: "var(--space-lg)", borderBottom: "1px solid var(--border-color)", paddingBottom: 10 }}>
        {[
          { id: "audit", label: "📜 Immutable Audit Trail", count: auditLogs.length },
          { id: "simulator", label: "⚡ RBAC + ABAC Policy Simulator", count: "Live" },
          { id: "threats", label: "🚨 Security Threat Radar", count: openThreatsCount },
          { id: "consents", label: "🤝 Citizen Consent Registry (DPDPA)", count: consents.length },
          { id: "pii", label: "🛡️ PII Masking & Data Projection", count: "Preview" }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`btn ${activeTab === t.id ? "btn-primary" : "btn-outline"}`}
            style={{ fontSize: 12, padding: "6px 14px" }}
          >
            {t.label} <span className="badge badge-neutral" style={{ fontSize: 10, marginLeft: 6 }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Immutable Audit Trail Explorer */}
      {activeTab === "audit" && (
        <div style={{ display: "grid", gridTemplateColumns: selectedAuditLog ? "1.2fr 0.9fr" : "1fr", gap: "var(--space-md)" }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Append-Only Audit Log Records</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <select
                  className="btn btn-outline"
                  style={{ fontSize: 11, padding: "4px 8px" }}
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="ALL">All Roles</option>
                  {Object.keys(ROLE_DEFINITIONS).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <select
                  className="btn btn-outline"
                  style={{ fontSize: 11, padding: "4px 8px" }}
                  value={resultFilter}
                  onChange={(e) => setResultFilter(e.target.value)}
                >
                  <option value="ALL">All Results</option>
                  <option value="SUCCESS">SUCCESS</option>
                  <option value="DENIED">DENIED</option>
                </select>
              </div>
            </div>

            <div className="table-wrap" style={{ border: "none", maxHeight: 420, overflowY: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Actor & Role</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>Jurisdiction</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => {
                    const isDenied = log.result === "DENIED";
                    const isSelected = selectedAuditLog?.audit_id === log.audit_id;
                    return (
                      <tr
                        key={log.audit_id}
                        style={{
                          cursor: "pointer",
                          background: isSelected ? "var(--brand-gradient-subtle)" : undefined,
                          borderLeft: isDenied ? "3px solid var(--status-error)" : "3px solid var(--status-success)"
                        }}
                        onClick={() => setSelectedAuditLog(log)}
                      >
                        <td style={{ fontSize: 10, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td>
                          <div style={{ fontSize: 11, fontWeight: 700 }}>{log.actor_name}</div>
                          <div style={{ fontSize: 10, color: "var(--text-accent)" }}>{log.actor_role}</div>
                        </td>
                        <td>
                          <code style={{ fontSize: 11, color: "var(--text-primary)" }}>{log.action}</code>
                        </td>
                        <td>
                          <div style={{ fontSize: 11 }}>{log.resource_type}</div>
                          <div style={{ fontSize: 10, color: "var(--text-secondary)" }}>{log.resource_id}</div>
                        </td>
                        <td style={{ fontSize: 11 }}>
                          {log.target_state}/{log.target_district || "—"}
                        </td>
                        <td>
                          <span className={`badge ${isDenied ? "badge-error" : "badge-success"}`} style={{ fontSize: 9 }}>
                            {log.result}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Event Detail Inspector */}
          {selectedAuditLog && (
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="card-header" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: 8 }}>
                <h3 className="card-title">Audit Event Inspector</h3>
                <button className="btn btn-outline" style={{ fontSize: 10, padding: "2px 6px" }} onClick={() => setSelectedAuditLog(null)}>
                  ✕ Close
                </button>
              </div>

              <div className="field-row">
                <span className="field-label">Actor Identity</span>
                <span className="field-value">{selectedAuditLog.actor_name} ({selectedAuditLog.actor_id})</span>
              </div>
              <div className="field-row">
                <span className="field-label">IP Address</span>
                <span className="field-value"><code>{selectedAuditLog.ip_address}</code></span>
              </div>
              <div className="field-row">
                <span className="field-label">Target Jurisdiction</span>
                <span className="field-value">{selectedAuditLog.target_state} / {selectedAuditLog.target_district}</span>
              </div>

              {selectedAuditLog.denial_reason && (
                <div style={{ background: "var(--status-error-bg)", border: "1px solid var(--status-error)", padding: 10, borderRadius: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--status-error)" }}>Denial Reason:</div>
                  <div style={{ fontSize: 11, color: "var(--text-primary)", marginTop: 2 }}>{selectedAuditLog.denial_reason}</div>
                </div>
              )}

              {selectedAuditLog.metadata && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, color: "var(--text-accent)" }}>Event Metadata & Provenance:</div>
                  <pre style={{ maxHeight: 160, overflowY: "auto", fontSize: 10, background: "#0d1117", color: "#a5d6ff", padding: 8, borderRadius: 6, margin: 0 }}>
                    {JSON.stringify(selectedAuditLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Interactive RBAC + ABAC Policy Simulator */}
      {activeTab === "simulator" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.2fr", gap: "var(--space-md)" }}>
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 8 }}>Policy Evaluation Test Bench</h3>
            <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 14 }}>
              Configure caller attributes, action, and target parcel geography to test real-time RBAC + ABAC boundary enforcement.
            </p>

            {/* Principal Configuration */}
            <div style={{ background: "var(--bg-secondary)", padding: 12, borderRadius: 8, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-accent)", marginBottom: 8 }}>1. Caller Identity & Scope (ABAC Subject)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Role</label>
                  <select
                    className="btn btn-outline"
                    style={{ width: "100%", fontSize: 12, padding: "6px" }}
                    value={simRole}
                    onChange={(e) => setSimRole(e.target.value as any)}
                  >
                    {Object.keys(ROLE_DEFINITIONS).map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Jurisdiction State</label>
                  <select
                    className="btn btn-outline"
                    style={{ width: "100%", fontSize: 12, padding: "6px" }}
                    value={simState}
                    onChange={(e) => setSimState(e.target.value)}
                  >
                    <option value="BR">Bihar (BR)</option>
                    <option value="TN">Tamil Nadu (TN)</option>
                    <option value="CH">Chandigarh (CH)</option>
                    <option value="*">All States (*)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Configuration */}
            <div style={{ background: "var(--bg-secondary)", padding: 12, borderRadius: 8, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-accent)", marginBottom: 8 }}>2. Target Action (RBAC Permission)</div>
              <select
                className="btn btn-outline"
                style={{ width: "100%", fontSize: 12, padding: "6px" }}
                value={simAction}
                onChange={(e) => setSimAction(e.target.value as any)}
              >
                {ACTIONS_LIST.map((a) => (
                  <option key={a.id} value={a.id}>[{a.group}] {a.label}</option>
                ))}
              </select>
            </div>

            {/* Target Parcel Geography Configuration */}
            <div style={{ background: "var(--bg-secondary)", padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-accent)", marginBottom: 8 }}>3. Target Parcel Scope (ABAC Object)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Parcel State</label>
                  <select
                    className="btn btn-outline"
                    style={{ width: "100%", fontSize: 12, padding: "6px" }}
                    value={targetState}
                    onChange={(e) => setTargetState(e.target.value)}
                  >
                    <option value="BR">Bihar (BR)</option>
                    <option value="TN">Tamil Nadu (TN)</option>
                    <option value="CH">Chandigarh (CH)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Parcel District</label>
                  <input
                    type="text"
                    style={{ width: "100%", background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)", borderRadius: 6, padding: "6px 8px", fontSize: 12 }}
                    value={targetDistrict}
                    onChange={(e) => setTargetDistrict(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={handleEvaluateSimulator}
              disabled={evaluating}
            >
              {evaluating ? "Evaluating Policy..." : "⚡ Evaluate Access Policy & Log Audit"}
            </button>
          </div>

          {/* Simulation Output Card */}
          <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div className="card-header">
                <h3 className="card-title">Policy Evaluation Decision</h3>
                {simResult && (
                  <span className={`badge ${simResult.decision === "ALLOW" ? "badge-success" : "badge-error"}`}>
                    {simResult.decision === "ALLOW" ? "✓ ACCESS GRANTED" : "✕ ACCESS DENIED"}
                  </span>
                )}
              </div>

              {simResult ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ background: simResult.decision === "ALLOW" ? "var(--status-success-bg)" : "var(--status-error-bg)", border: `1px solid ${simResult.decision === "ALLOW" ? "var(--status-success)" : "var(--status-error)"}`, padding: 12, borderRadius: 8 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: simResult.decision === "ALLOW" ? "var(--status-success)" : "var(--status-error)" }}>
                      Decision Code: {simResult.evaluation.decision_code}
                    </div>
                    <div style={{ fontSize: 12, marginTop: 4, color: "var(--text-primary)" }}>
                      {simResult.evaluation.reason}
                    </div>
                  </div>

                  <div style={{ background: "var(--bg-secondary)", padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6, color: "var(--text-accent)" }}>Evaluation Breakdown:</div>
                    <div style={{ fontSize: 11, display: "flex", flexDirection: "column", gap: 4 }}>
                      <div>1. <strong>RBAC Role Check:</strong> {simResult.evaluation.decision_code !== "DENIED_INSUFFICIENT_ROLE" ? "✓ Role possesses permission" : "✕ Permission not mapped to role"}</div>
                      <div>2. <strong>ABAC Geographic Check:</strong> {simResult.evaluation.decision_code !== "DENIED_OUT_OF_JURISDICTION" ? "✓ Within authorized jurisdiction" : "✕ Boundary mismatch detected"}</div>
                      <div>3. <strong>Audit Trail Status:</strong> ✓ Immutable event logged in <code>audit.audit_logs</code></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", color: "var(--text-secondary)", padding: "var(--space-2xl)", fontSize: 12 }}>
                  Configure the parameters on the left and click "Evaluate Access Policy" to see the zero-trust engine in action.
                </div>
              )}
            </div>

            <div style={{ fontSize: 10, color: "var(--text-secondary)", borderTop: "1px solid var(--border-color)", paddingTop: 8 }}>
              💡 Rule: Officers from one state (e.g. Tamil Nadu) are strictly forbidden from altering revenue records in another state (e.g. Bihar).
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Security Threat Radar */}
      {activeTab === "threats" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "var(--space-md)" }}>
          {threats.map((t) => (
            <div key={t.event_id} className="card" style={{ borderLeft: `4px solid ${t.severity === "CRITICAL" ? "var(--status-error)" : "var(--status-warning)"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>{t.event_type.replace(/_/g, " ")}</div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Target: <code>{t.endpoint}</code></div>
                </div>
                <span className={`badge ${t.severity === "CRITICAL" ? "badge-error" : "badge-warning"}`} style={{ fontSize: 10 }}>
                  {t.severity}
                </span>
              </div>

              <p style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.5, marginBottom: 10 }}>
                {t.description}
              </p>

              <div style={{ background: "var(--bg-secondary)", padding: 8, borderRadius: 6, fontSize: 11, marginBottom: 10 }}>
                <span style={{ color: "var(--text-secondary)" }}>Actor / IP:</span> <strong>{t.actor_identity}</strong> ({t.ip_address})
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: 8 }}>
                <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>{new Date(t.detected_at).toLocaleString()}</span>
                <span className={`badge ${t.status === "BLOCKED" ? "badge-error" : "badge-success"}`} style={{ fontSize: 9 }}>
                  ● {t.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Citizen Consent Registry (DPDPA 2023) */}
      {activeTab === "consents" && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Citizen Data Sharing & Statutory Consent Registry</h3>
              <p className="card-subtitle">Digital Personal Data Protection Act (DPDPA 2023) compliant consent ledger</p>
            </div>
            <span className="badge badge-success">DPDPA 2023 Ready</span>
          </div>

          <div className="table-wrap" style={{ border: "none" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Consent ID</th>
                  <th>Citizen</th>
                  <th>Purpose & Requesting Entity</th>
                  <th>Shared Data Fields</th>
                  <th>Statutory Basis</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {consents.map((c) => (
                  <tr key={c.consent_no}>
                    <td style={{ fontFamily: "monospace", fontSize: 11, color: "var(--text-accent)" }}>{c.consent_no}</td>
                    <td>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{c.citizen_name}</div>
                      <div style={{ fontSize: 10, color: "var(--text-secondary)" }}>{c.citizen_ref}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 11, fontWeight: 600 }}>{c.purpose}</div>
                      <div style={{ fontSize: 10, color: "var(--text-secondary)" }}>🏢 {c.requesting_entity}</div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {(c.data_fields_shared || []).map((f: string) => (
                          <span key={f} className="badge badge-neutral" style={{ fontSize: 9 }}>{f}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontSize: 10, color: "var(--text-secondary)", maxWidth: 160 }}>
                      {c.legal_statutory_basis}
                    </td>
                    <td>
                      <span className={`badge ${c.status === "ACTIVE" ? "badge-success" : "badge-error"}`} style={{ fontSize: 9 }}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      {c.status === "ACTIVE" ? (
                        <button
                          className="btn btn-outline"
                          style={{ fontSize: 10, color: "var(--status-error)", borderColor: "var(--status-error)", padding: "2px 6px" }}
                          onClick={() => handleRevokeConsent(c.consent_no)}
                        >
                          Revoke
                        </button>
                      ) : (
                        <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>Revoked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: PII Protection & Data Projection */}
      {activeTab === "pii" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">1. Public Citizen View (PII Masked)</h3>
              <span className="badge badge-info">PUBLIC PROJECTION</span>
            </div>
            <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 10 }}>
              Citizens & third parties only see redacted names, masked identifier hashes, and public zoning.
            </p>

            <pre style={{ maxHeight: 320, overflowY: "auto", fontSize: 11, background: "#0d1117", color: "#e6edf3", padding: 12, borderRadius: 6, margin: 0 }}>
              {JSON.stringify(piiData?.citizen_public_view, null, 2)}
            </pre>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">2. Authorized Officer View (Unredacted)</h3>
              <span className="badge badge-success">OFFICER AUTHORIZED</span>
            </div>
            <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 10 }}>
              Revenue Officers within their official jurisdiction have access to complete unredacted Jamabandi titles.
            </p>

            <pre style={{ maxHeight: 320, overflowY: "auto", fontSize: 11, background: "#0d1117", color: "#38bdf8", padding: 12, borderRadius: 6, margin: 0 }}>
              {JSON.stringify(piiData?.officer_authorized_view, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
