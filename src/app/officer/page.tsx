"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

/* eslint-disable @typescript-eslint/no-explicit-any */

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  SUBMITTED: { label: "Submitted", class: "badge-info" },
  DOCUMENT_VERIFICATION: { label: "Doc Verification", class: "badge-info" },
  UNDER_REVIEW: { label: "Under Review", class: "badge-warning" },
  ACTION_REQUIRED: { label: "Action Req", class: "badge-error" },
  APPROVED: { label: "Approved", class: "badge-success" },
  COMPLETED: { label: "Completed", class: "badge-success" },
  REJECTED: { label: "Rejected", class: "badge-error" },
};

export default function OfficerDashboard() {
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedAppNo, setSelectedAppNo] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/applications");
      const data = await res.json();
      if (data.applications?.length > 0) {
        setApplications(data.applications);
        setSelectedAppNo((prev) => prev || data.applications[0].application_no);
      }
    } catch (err) {
      console.error("Failed to load officer applications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDetail = useCallback(async (appNo: string) => {
    try {
      const res = await fetch(`/api/v1/applications/${appNo}`);
      const data = await res.json();
      setSelectedDetail(data);
    } catch (err) {
      console.error("Failed to fetch detail:", err);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    if (selectedAppNo) {
      fetchDetail(selectedAppNo);
    }
  }, [selectedAppNo, fetchDetail]);

  const handleAction = async (appNo: string, newStatus: string, comments?: string) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/v1/applications/${appNo}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          officer_name: "Land Officer Vikram Singh",
          comments: comments || `Action ${newStatus} applied by Officer`,
        }),
      });

      if (res.ok) {
        await fetchApplications();
        if (selectedAppNo) await fetchDetail(selectedAppNo);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = applications.filter((a) => a.status === "SUBMITTED" || a.status === "UNDER_REVIEW" || a.status === "DOCUMENT_VERIFICATION").length;
  const approvedCount = applications.filter((a) => a.status === "APPROVED" || a.status === "COMPLETED").length;
  const rejectedCount = applications.filter((a) => a.status === "REJECTED").length;

  const app = selectedDetail?.application || applications.find((a) => a.application_no === selectedAppNo);
  const history = selectedDetail?.history || [];

  return (
    <div className="app-content animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">👨‍💼 Officer Dashboard</h1>
          <p className="page-subtitle">Revenue Department — Land Officer Vikram Singh, Madhubani District</p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-sm)" }}>
          <span className="badge badge-success">● Online</span>
          <span className="badge badge-info">Role: LAND_OFFICER</span>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: "var(--space-lg)" }}>
        {[
          { icon: "📋", value: pendingCount, label: "Pending Review", bg: "var(--status-warning-bg)" },
          { icon: "✅", value: approvedCount, label: "Approved / Completed", bg: "var(--status-success-bg)" },
          { icon: "❌", value: rejectedCount, label: "Rejected", bg: "var(--status-error-bg)" },
          { icon: "📊", value: applications.length, label: "Total Applications", bg: "var(--status-info-bg)" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "var(--space-md)" }}>
        {/* Pending Queue */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Application Queue</h3>
            <span className="badge badge-warning">{pendingCount} active</span>
          </div>

          {loading ? (
            <p style={{ color: "var(--text-secondary)", padding: "var(--space-lg)", textAlign: "center" }}>Loading applications...</p>
          ) : (
            <div className="table-wrap" style={{ border: "none" }}>
              <table className="table">
                <thead>
                  <tr><th>ID</th><th>Service</th><th>Citizen</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {applications.map((a) => (
                    <tr
                      key={a.application_no}
                      style={{ cursor: "pointer", background: selectedAppNo === a.application_no ? "var(--brand-gradient-subtle)" : undefined }}
                      onClick={() => setSelectedAppNo(a.application_no)}
                    >
                      <td style={{ fontFamily: "monospace", fontSize: 11, color: "var(--text-accent)", fontWeight: 600 }}>
                        {a.application_no}
                      </td>
                      <td style={{ fontSize: 12 }}>{a.service_type}</td>
                      <td style={{ fontSize: 12 }}>{a.applicant_name}</td>
                      <td>
                        <span className={`badge ${STATUS_MAP[a.status]?.class || "badge-neutral"}`} style={{ fontSize: 10 }}>
                          {STATUS_MAP[a.status]?.label || a.status}
                        </span>
                      </td>
                      <td>
                        {a.status === "APPROVED" || a.status === "COMPLETED" ? (
                          <span className="badge badge-success" style={{ fontSize: 10 }}>Done</span>
                        ) : a.status === "REJECTED" ? (
                          <span className="badge badge-error" style={{ fontSize: 10 }}>Rejected</span>
                        ) : (
                          <div style={{ display: "flex", gap: 4 }}>
                            <button
                              className="btn btn-success btn-sm"
                              disabled={actionLoading}
                              title="Approve"
                              onClick={(e) => { e.stopPropagation(); handleAction(a.application_no, "APPROVED"); }}
                            >
                              ✓
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              disabled={actionLoading}
                              title="Reject"
                              onClick={(e) => { e.stopPropagation(); handleAction(a.application_no, "REJECTED"); }}
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Application Detail */}
        <div>
          {app ? (
            <div className="card animate-slide">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-md)" }}>
                <div>
                  <h3 className="card-title">{app.service_type}</h3>
                  <span style={{ fontSize: 12, color: "var(--text-accent)", fontFamily: "monospace" }}>{app.application_no}</span>
                </div>
                <span className={`badge ${STATUS_MAP[app.status]?.class || "badge-neutral"}`}>
                  {STATUS_MAP[app.status]?.label || app.status}
                </span>
              </div>

              {[
                ["Citizen", app.applicant_name],
                ["Contact", app.applicant_phone || app.applicant_email || "—"],
                ["Department", app.department],
                ["Parcel ULPIN", app.parcel_ulpin || "—"],
                ["Purpose", app.purpose || "—"],
                ["Submitted", new Date(app.created_at).toLocaleString()],
                ["Priority", app.priority],
              ].map(([l, v]) => (
                <div key={l} className="field-row">
                  <span className="field-label">{l}</span>
                  <span className="field-value">{v}</span>
                </div>
              ))}

              {app.parcel_ulpin && (
                <div style={{ display: "flex", gap: "var(--space-sm)", marginTop: "var(--space-md)" }}>
                  <Link href={`/parcel/${app.parcel_ulpin}`} className="btn btn-primary btn-sm">
                    View Land 360°
                  </Link>
                  <Link href={`/map?parcel=${app.parcel_ulpin}`} className="btn btn-secondary btn-sm">
                    View on Map
                  </Link>
                </div>
              )}

              {/* Action Buttons */}
              {app.status !== "APPROVED" && app.status !== "COMPLETED" && app.status !== "REJECTED" && (
                <div style={{ display: "flex", gap: "var(--space-sm)", marginTop: "var(--space-lg)", borderTop: "1px solid var(--border-default)", paddingTop: "var(--space-md)" }}>
                  <button
                    className="btn btn-success"
                    disabled={actionLoading}
                    onClick={() => handleAction(app.application_no, "APPROVED", "Verified against RoR and Registration databases. Approved.")}
                  >
                    ✓ Approve Application
                  </button>
                  <button
                    className="btn btn-danger"
                    disabled={actionLoading}
                    onClick={() => handleAction(app.application_no, "REJECTED", "Discrepancy in ownership records. Rejected.")}
                  >
                    ✕ Reject
                  </button>
                  <button
                    className="btn btn-secondary"
                    disabled={actionLoading}
                    onClick={() => handleAction(app.application_no, "ACTION_REQUIRED", "Please upload additional identity documents.")}
                  >
                    ⟳ Request Info
                  </button>
                </div>
              )}

              {/* History Timeline */}
              <h4 className="section-title" style={{ marginTop: "var(--space-lg)" }}>Application Audit Trail</h4>
              <div style={{ marginTop: "var(--space-sm)" }}>
                {history.map((h: any, i: number) => (
                  <div key={i} style={{ display: "flex", gap: "var(--space-md)", padding: "6px 0", borderLeft: "2px solid var(--border-default)", paddingLeft: "var(--space-md)", marginLeft: 6, position: "relative" }}>
                    <div style={{ position: "absolute", left: -5, top: 8, width: 8, height: 8, borderRadius: "50%", background: i === history.length - 1 ? "var(--brand-primary)" : "var(--border-strong)" }} />
                    <div>
                      <div style={{ fontSize: 12, color: "var(--text-primary)" }}>{h.action}</div>
                      <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>
                        {new Date(h.created_at).toLocaleString()} • {h.performed_by}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: "center", padding: "var(--space-2xl)" }}>
              <div style={{ fontSize: 40, marginBottom: "var(--space-md)" }}>👈</div>
              <p style={{ color: "var(--text-secondary)" }}>Select an application from the queue to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
