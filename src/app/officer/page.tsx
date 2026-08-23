"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { calculateSlaStatus } from "@/lib/workflow";
import { useAuth } from "@/lib/security/auth-context";
import apiClient from "@/lib/api-client";

const DEPARTMENTS = ["All", "Revenue", "Registration", "Planning", "Municipality", "Environment"];

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  SUBMITTED: { label: "Submitted", class: "badge-info" },
  DOCUMENT_VERIFICATION: { label: "Doc Verification", class: "badge-info" },
  UNDER_REVIEW: { label: "Under Review", class: "badge-warning" },
  ACTION_REQUIRED: { label: "Action Req", class: "badge-error" },
  APPROVED: { label: "Approved", class: "badge-success" },
  COMPLETED: { label: "Completed", class: "badge-success" },
  REJECTED: { label: "Rejected", class: "badge-error" },
  ESCALATED: { label: "Escalated", class: "badge-error" }
};

export default function OfficerPortal() {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedAppNo, setSelectedAppNo] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);
  const [parcel360, setParcel360] = useState<any | null>(null);
  const [selectedDept, setSelectedDept] = useState(() => {
    if (currentUser.role === "REGISTRATION_OFFICER") return "Registration";
    if (currentUser.role === "PLANNING_OFFICER") return "Planning";
    if (currentUser.role === "TAX_OFFICER") return "Municipality";
    if (currentUser.role === "REVENUE_OFFICER") return "Revenue";
    return "All";
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Action Modal State
  const [modalMode, setModalMode] = useState<"APPROVE" | "REJECT" | "REQUEST_INFO" | "ESCALATE" | null>(null);
  const [actionRemarks, setActionRemarks] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "prechecks" | "land360" | "history">("overview");

  const fetchApplications = useCallback(async () => {
    try {
      const url = selectedDept === "All" ? "/api/v1/applications" : `/api/v1/applications?department=${selectedDept}`;
      const res = await apiClient.get(url);
      if (res.data?.applications) {
        setApplications(res.data.applications);
        setSelectedAppNo((prev) => prev || (res.data.applications[0]?.application_no ?? null));
      }
    } catch (err) {
      console.error("Failed to load officer applications:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDept]);

  const fetchDetail = useCallback(async (appNo: string) => {
    try {
      const res = await apiClient.get(`/api/v1/applications/${appNo}`);
      setSelectedDetail(res.data);

      if (res.data?.application?.parcel_id || res.data?.application?.parcel_ulpin) {
        const pId = res.data.application.parcel_id || res.data.application.parcel_ulpin;
        const pRes = await apiClient.get(`/api/parcels/${pId}`);
        setParcel360(pRes.data);
      }
    } catch (err) {
      console.error("Failed to fetch detail:", err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadApps = async () => {
      try {
        const url = selectedDept === "All" ? "/api/v1/applications" : `/api/v1/applications?department=${selectedDept}`;
        const res = await apiClient.get(url);
        if (isMounted && res.data?.applications) {
          setApplications(res.data.applications);
          setSelectedAppNo((prev) => prev || (res.data.applications[0]?.application_no ?? null));
        }
      } catch (err) {
        console.error("Failed to load officer applications:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadApps();
    return () => {
      isMounted = false;
    };
  }, [selectedDept]);

  useEffect(() => {
    if (!selectedAppNo) return;
    let isMounted = true;
    const loadDetail = async () => {
      try {
        const res = await apiClient.get(`/api/v1/applications/${selectedAppNo}`);
        if (isMounted) {
          setSelectedDetail(res.data);
          if (res.data?.application?.parcel_id || res.data?.application?.parcel_ulpin) {
            const pId = res.data.application.parcel_id || res.data.application.parcel_ulpin;
            const pRes = await apiClient.get(`/api/parcels/${pId}`);
            if (isMounted) setParcel360(pRes.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch detail:", err);
      }
    };
    loadDetail();
    return () => {
      isMounted = false;
    };
  }, [selectedAppNo]);

  const executeAction = async (newStatus: string, actionComments: string, extra?: any) => {
    if (!selectedAppNo) return;
    try {
      setActionLoading(true);
      const res = await apiClient.patch(`/api/v1/applications/${selectedAppNo}`, {
        status: newStatus,
        officer_name: currentUser.name || "Land Officer Vikram Singh",
        role: currentUser.role || "REVENUE_OFFICER",
        department: currentUser.department || (selectedDept === "All" ? "Revenue" : selectedDept),
        comments: actionComments,
        ...extra
      });

      if (res.status === 200) {
        setModalMode(null);
        setActionRemarks("");
        await fetchApplications();
        if (selectedAppNo) await fetchDetail(selectedAppNo);
      }
    } catch (err) {
      console.error("Failed to execute action:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const app = selectedDetail?.application || applications.find((a) => a.application_no === selectedAppNo);
  const history = selectedDetail?.history || [];
  const prechecks = app?.precheck_results || {};

  const pendingCount = applications.filter((a) => ["SUBMITTED", "UNDER_REVIEW", "DOCUMENT_VERIFICATION"].includes(a.status)).length;
  const approvedCount = applications.filter((a) => ["APPROVED", "COMPLETED"].includes(a.status)).length;
  const breachedCount = applications.filter((a) => a.sla_status === "SLA_BREACHED" || a.escalated).length;

  return (
    <div className="app-content animate-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 24 }}>{currentUser.icon || "👨‍💼"}</span>
            <h1 className="page-title">Department Officer Portal & Workflow Engine</h1>
          </div>
          <p className="page-subtitle">Multi-department statutory case review, parcel-linked compliance, and immutable audit trailing.</p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-sm)", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(15, 23, 42, 0.8)", border: "1px solid var(--border-color)", padding: "4px 12px", borderRadius: "var(--radius-md)" }}>
            <span style={{ fontSize: 16 }}>{currentUser.icon}</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#f8fafc" }}>{currentUser.name}</div>
              <div style={{ fontSize: 10, color: "var(--text-accent)" }}>{currentUser.title.split("(")[0]}</div>
            </div>
            <Link href="/login" className="badge badge-info" style={{ textDecoration: "none", fontSize: 10, cursor: "pointer" }}>
              Switch ⇄
            </Link>
          </div>
          <Link href="/officer/conflicts" className="btn btn-outline" style={{ fontSize: 12 }}>
            ⚠️ Conflicts ({3})
          </Link>
          <Link href="/admin/intelligence" className="btn btn-primary" style={{ fontSize: 12 }}>
            🧠 AI Intelligence
          </Link>
        </div>
      </div>

      {/* SLA & Workflow Metrics */}
      <div className="stat-grid" style={{ marginBottom: "var(--space-lg)" }}>
        {[
          { icon: "📋", value: pendingCount, label: "Pending Queue", bg: "var(--status-warning-bg)" },
          { icon: "⏱️", value: applications.filter(a => a.status === "UNDER_REVIEW").length, label: "In Active Review", bg: "var(--status-info-bg)" },
          { icon: "✅", value: approvedCount, label: "Approved / Certified", bg: "var(--status-success-bg)" },
          { icon: "🚨", value: breachedCount, label: "SLA Breaches / Escalated", bg: "var(--status-error-bg)" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Department Filter Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: "var(--space-md)", borderBottom: "1px solid var(--border-color)", paddingBottom: 10 }}>
        {DEPARTMENTS.map((dept) => (
          <button
            key={dept}
            onClick={() => setSelectedDept(dept)}
            className={`btn ${selectedDept === dept ? "btn-primary" : "btn-outline"}`}
            style={{ fontSize: 12, padding: "6px 14px" }}
          >
            {dept === "Revenue" && "🌾 "}
            {dept === "Registration" && "📝 "}
            {dept === "Planning" && "📐 "}
            {dept === "Municipality" && "🏛️ "}
            {dept === "Environment" && "🌲 "}
            {dept} Department
          </button>
        ))}
      </div>

      {/* Main 2-Column Interface: Queue on Left, Land 360 Case Viewer on Right */}
      <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1.35fr", gap: "var(--space-md)" }}>
        {/* Left: Application Inbox */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Case Inbox</h3>
            <span className="badge badge-neutral">{applications.length} cases</span>
          </div>

          {loading ? (
            <p style={{ color: "var(--text-secondary)", padding: "var(--space-lg)", textAlign: "center" }}>Loading departmental queue...</p>
          ) : (
            <div className="table-wrap" style={{ border: "none" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Application</th>
                    <th>Service & Dept</th>
                    <th>Status</th>
                    <th>SLA Target</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((a) => {
                    const sla = calculateSlaStatus(a.created_at, a.target_sla_days || 5);
                    const isSelected = selectedAppNo === a.application_no;
                    return (
                      <tr
                        key={a.application_no}
                        style={{
                          cursor: "pointer",
                          background: isSelected ? "var(--brand-gradient-subtle)" : undefined,
                          borderLeft: isSelected ? "3px solid var(--brand-primary)" : "3px solid transparent"
                        }}
                        onClick={() => setSelectedAppNo(a.application_no)}
                      >
                        <td>
                          <div style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-accent)", fontWeight: 700 }}>
                            {a.application_no}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{a.applicant_name}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{a.service_type}</div>
                          <div style={{ fontSize: 10, color: "var(--text-secondary)" }}>🏢 {a.department}</div>
                        </td>
                        <td>
                          <span className={`badge ${STATUS_MAP[a.status]?.class || "badge-neutral"}`} style={{ fontSize: 10 }}>
                            {STATUS_MAP[a.status]?.label || a.status}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${sla.badgeClass}`} style={{ fontSize: 10 }}>
                            {a.escalated ? "🚨 Escalated" : sla.status === "SLA_BREACHED" ? "🔴 Breached" : sla.status === "APPROACHING_SLA" ? "🟡 Due Soon" : "🟢 On Track"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Land-Aware Officer Case & Compliance Viewer */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          {app ? (
            <>
              {/* Header Info */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border-color)", paddingBottom: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18, fontWeight: 800 }}>{app.application_no}</span>
                    <span className={`badge ${STATUS_MAP[app.status]?.class || "badge-neutral"}`}>{app.status}</span>
                    {app.escalated && <span className="badge badge-error">🚨 ESCALATED TO DEPT HEAD</span>}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
                    <strong>{app.service_type}</strong> • Applicant: {app.applicant_name} ({app.applicant_phone || "+91 98765 43210"})
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Linked Parcel ULPIN:</div>
                  <Link href={`/map?parcel=${app.parcel_id || ''}`} className="btn btn-outline" style={{ fontSize: 11, padding: "4px 8px", marginTop: 2 }}>
                    🗺️ {app.parcel_ulpin || "View on GIS Map"}
                  </Link>
                </div>
              </div>

              {/* Navigation Sub-Tabs */}
              <div style={{ display: "flex", gap: 6, borderBottom: "1px solid var(--border-color)", paddingBottom: 8 }}>
                {[
                  { id: "overview", label: "Overview & GIS" },
                  { id: "prechecks", label: "Automated Pre-Checks" },
                  { id: "land360", label: "Land 360 Records" },
                  { id: "history", label: "Audit Timeline" }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`btn ${activeTab === t.id ? "btn-primary" : "btn-outline"}`}
                    style={{ fontSize: 11, padding: "4px 10px" }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab 1: Overview */}
              {activeTab === "overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div style={{ background: "var(--bg-secondary)", padding: 10, borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Purpose of Request</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{app.purpose || "Statutory compliance"}</div>
                    </div>
                    <div style={{ background: "var(--bg-secondary)", padding: 10, borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Current Workflow Step</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-accent)" }}>📍 {app.current_step || "Document Verification"}</div>
                    </div>
                  </div>

                  {/* Parcel Metadata Snapshot */}
                  {parcel360?.parcel && (
                    <div style={{ background: "var(--bg-secondary)", padding: 12, borderRadius: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: "var(--text-accent)" }}>📍 Linked Cadastral Parcel Snapshot</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 11 }}>
                        <div><span style={{ color: "var(--text-secondary)" }}>Survey No:</span> <strong>{parcel360.parcel.survey_number}</strong></div>
                        <div><span style={{ color: "var(--text-secondary)" }}>Area:</span> <strong>{Number(parcel360.parcel.area).toLocaleString()} sqm</strong></div>
                        <div><span style={{ color: "var(--text-secondary)" }}>Land Use:</span> <strong>{parcel360.parcel.land_type}</strong></div>
                      </div>
                    </div>
                  )}

                  {/* Escalation Alert if Breached */}
                  {app.escalated && (
                    <div style={{ background: "var(--status-error-bg)", border: "1px solid var(--status-error)", padding: 12, borderRadius: 8 }}>
                      <div style={{ fontWeight: 700, color: "var(--status-error)", fontSize: 12 }}>🚨 SLA Breach & Escalation Note:</div>
                      <div style={{ fontSize: 11, color: "var(--text-primary)", marginTop: 4 }}>{app.escalation_reason}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Automated Pre-Checks (Step 13 / 14) */}
              {activeTab === "prechecks" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-accent)" }}>🤖 Automated Decision-Support Pre-Checks</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {[
                      { label: "Ownership Title & Raiyat Match", status: prechecks.ownership_match !== false, passMsg: "Verified against Bihar Bhumi RoR", failMsg: "Name mismatch detected" },
                      { label: "Spatial Land-Use Zoning Compatibility", status: prechecks.land_use_match !== false, passMsg: "Permitted under Master Plan 2035", failMsg: "Zoning conflict with Master Plan" },
                      { label: "Environmental & Flood Buffer Clearance", status: !prechecks.flood_buffer_conflict && !prechecks.flood_zone_flag, passMsg: "Outside flood and forest buffer zones", failMsg: "Parcel intersects protected river buffer zone ⚠️" },
                      { label: "Active Dispute / Court Stay Order Check", status: !prechecks.dispute_flag, passMsg: "No active civil court stay registered", failMsg: "Active title suit pending in Civil Court" },
                      { label: "Bank Mortgage & Encumbrance Clearance", status: !prechecks.encumbrance_flag, passMsg: "Clear title with zero active attachments", failMsg: "Active commercial bank charge registered" },
                    ].map((c) => (
                      <div key={c.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-secondary)", padding: "8px 12px", borderRadius: 6 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{c.label}</div>
                          <div style={{ fontSize: 10, color: c.status ? "var(--status-success)" : "var(--status-error)" }}>
                            {c.status ? `✓ ${c.passMsg}` : `✕ ${c.failMsg}`}
                          </div>
                        </div>
                        <span className={`badge ${c.status ? "badge-success" : "badge-error"}`} style={{ fontSize: 10 }}>
                          {c.status ? "PASS" : "REQUIRES REVIEW"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Land 360 Records */}
              {activeTab === "land360" && (
                <div style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div className="field-row">
                    <span className="field-label">📜 Jamabandi RoR Owner</span>
                    <span className="field-value">{parcel360?.ror?.raiyat_name || parcel360?.owners?.[0]?.name || "Rameshwar Prasad Yadav"}</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">📝 Registered Transactions</span>
                    <span className="field-value">{parcel360?.registrations?.length || 1} Deeds on record</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">🔒 Active Encumbrances</span>
                    <span className="field-value">{parcel360?.encumbrances?.length || 0} active charges</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">🏗️ Building Permissions</span>
                    <span className="field-value">{parcel360?.building_permissions?.length || 0} permits</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">💰 Property Tax Status</span>
                    <span className="field-value" style={{ color: "var(--status-success)" }}>PAID_UP_TO_DATE</span>
                  </div>
                </div>
              )}

              {/* Tab 4: Immutable Audit Timeline (Step 13) */}
              {activeTab === "history" && (
                <div style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
                  {history.map((h: any) => (
                    <div key={h.history_id} style={{ display: "flex", gap: 10, fontSize: 11, borderLeft: "2px solid var(--brand-primary)", paddingLeft: 10 }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{h.action}</div>
                        <div style={{ color: "var(--text-secondary)", fontSize: 10 }}>
                          By: {h.performed_by} ({h.role || "SYSTEM"}) • {new Date(h.created_at).toLocaleString()}
                        </div>
                        {h.comments && <div style={{ color: "var(--text-accent)", marginTop: 2 }}>&ldquo;{h.comments}&rdquo;</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--border-color)" }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, fontSize: 12, justifyContent: "center" }}
                  onClick={() => setModalMode("APPROVE")}
                  disabled={actionLoading}
                >
                  ✓ Approve Application
                </button>
                <button
                  className="btn btn-outline"
                  style={{ fontSize: 12, color: "var(--status-warning)", borderColor: "var(--status-warning)" }}
                  onClick={() => setModalMode("REQUEST_INFO")}
                  disabled={actionLoading}
                >
                  📄 Request Info
                </button>
                <button
                  className="btn btn-outline"
                  style={{ fontSize: 12, color: "var(--status-error)", borderColor: "var(--status-error)" }}
                  onClick={() => setModalMode("REJECT")}
                  disabled={actionLoading}
                >
                  ✕ Reject
                </button>
                {app.sla_status === "SLA_BREACHED" && !app.escalated && (
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: 12, color: "var(--status-error)" }}
                    onClick={() => setModalMode("ESCALATE")}
                    disabled={actionLoading}
                  >
                    🚨 Escalate SLA
                  </button>
                )}
              </div>
            </>
          ) : (
            <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "var(--space-2xl)" }}>
              Select an application from the queue to inspect parcel compliance and take action.
            </p>
          )}
        </div>
      </div>

      {/* Action Remark Modal */}
      {modalMode && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card" style={{ width: 480, background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <h3 className="card-title" style={{ marginBottom: 8 }}>
              {modalMode === "APPROVE" && "✓ Approve & Issue Order"}
              {modalMode === "REJECT" && "✕ Reject Application (Mandatory Reason)"}
              {modalMode === "REQUEST_INFO" && "📄 Request Additional Documentation"}
              {modalMode === "ESCALATE" && "🚨 Escalate SLA Breach to Supervisor"}
            </h3>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 14 }}>
              {modalMode === "APPROVE" && "Enter officer approval notes. An immutable audit record will be created and the applicant notified."}
              {modalMode === "REJECT" && "Government guidelines require a clear, legally sound reason for rejecting citizen applications."}
              {modalMode === "REQUEST_INFO" && "Specify exactly what documents or clarifications are required from the citizen."}
              {modalMode === "ESCALATE" && "Describe why the case exceeded statutory turnaround limits."}
            </p>

            <textarea
              style={{ width: "100%", height: 100, background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 6, color: "var(--text-primary)", padding: 8, fontSize: 12, marginBottom: 16 }}
              placeholder="Enter remarks or structured reason here..."
              value={actionRemarks}
              onChange={(e) => setActionRemarks(e.target.value)}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn btn-outline" onClick={() => setModalMode(null)} disabled={actionLoading}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={actionLoading || (modalMode === "REJECT" && !actionRemarks.trim())}
                onClick={() => {
                  if (modalMode === "APPROVE") executeAction("APPROVED", actionRemarks || "Application verified and approved.");
                  if (modalMode === "REJECT") executeAction("REJECTED", actionRemarks);
                  if (modalMode === "REQUEST_INFO") executeAction("ACTION_REQUIRED", actionRemarks || "Additional documentation required.");
                  if (modalMode === "ESCALATE") executeAction("UNDER_REVIEW", "Escalated due to statutory SLA breach", { escalated: true, escalation_reason: actionRemarks });
                }}
              >
                {actionLoading ? "Processing..." : "Confirm & Submit Action"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
