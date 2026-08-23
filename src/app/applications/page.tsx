"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/security/auth-context";
import apiClient from "@/lib/api-client";

/* eslint-disable @typescript-eslint/no-explicit-any */

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  SUBMITTED: { label: "Submitted", class: "badge-info" },
  DOCUMENT_VERIFICATION: { label: "Document Verification", class: "badge-info" },
  UNDER_REVIEW: { label: "Under Review", class: "badge-warning" },
  ACTION_REQUIRED: { label: "Action Required", class: "badge-error" },
  APPROVED: { label: "Approved", class: "badge-success" },
  COMPLETED: { label: "Completed", class: "badge-success" },
  REJECTED: { label: "Rejected", class: "badge-error" },
};

function getSteps(currentStatus: string) {
  const allSteps = ["SUBMITTED", "DOCUMENT_VERIFICATION", "UNDER_REVIEW", "APPROVED", "COMPLETED"];
  const stepLabels = ["Submitted", "Document Verification", "Under Review", "Approved", "Completed"];
  
  if (currentStatus === "REJECTED") {
    return [
      { label: "Submitted", status: "completed" },
      { label: "Under Review", status: "completed" },
      { label: "Rejected", status: "current" },
    ];
  }

  const currentIndex = allSteps.indexOf(currentStatus);
  return stepLabels.map((label, i) => {
    if (i < currentIndex) return { label, status: "completed" };
    if (i === currentIndex) return { label, status: "current" };
    return { label, status: "pending" };
  });
}

export default function ApplicationsPage() {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const url = currentUser.role !== "CITIZEN" && currentUser.role !== "ADMIN" && currentUser.role !== "AUDITOR"
        ? (currentUser.role === "REGISTRATION_OFFICER" ? "/api/v1/applications?department=Registration"
          : currentUser.role === "PLANNING_OFFICER" ? "/api/v1/applications?department=Planning"
          : currentUser.role === "TAX_OFFICER" ? "/api/v1/applications?department=Municipality"
          : "/api/v1/applications?department=Revenue")
        : "/api/v1/applications";

      const res = await apiClient.get(url);
      if (res.data?.applications?.length > 0) {
        setApplications(res.data.applications);
        setSelectedId(res.data.applications[0].application_no);
      }
    } catch (err) {
      console.error("Failed to load applications:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchDetail = useCallback(async (appNo: string) => {
    try {
      const res = await apiClient.get(`/api/v1/applications/${appNo}`);
      setSelectedDetail(res.data);
    } catch (err) {
      console.error("Failed to fetch detail:", err);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    if (selectedId) {
      fetchDetail(selectedId);
    }
  }, [selectedId, fetchDetail]);

  const app = selectedDetail?.application || applications.find((a) => a.application_no === selectedId);
  const history = selectedDetail?.history || [];

  return (
    <div className="app-content animate-in">
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 24 }}>{currentUser.role === "CITIZEN" ? "📋" : "👨‍💼"}</span>
            <h1 className="page-title">
              {currentUser.role === "CITIZEN" ? "My Applications & Status" : `${currentUser.department} Applications Tracking`}
            </h1>
          </div>
          <p className="page-subtitle">
            {currentUser.role === "CITIZEN"
              ? `Track your land mutation, NOC, and RoR verification requests (${currentUser.name})`
              : `Departmental case queue for ${currentUser.title} (${currentUser.jurisdiction})`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {currentUser.role === "CITIZEN" ? (
            <Link href="/services" className="btn btn-primary">+ New Application</Link>
          ) : (
            <Link href="/officer" className="btn btn-primary">Open Officer Desk →</Link>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "var(--space-2xl)", color: "var(--text-secondary)" }}>
          <div className="animate-pulse" style={{ fontSize: 24 }}>📄</div>
          <p style={{ marginTop: "var(--space-sm)" }}>Loading applications...</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: app ? "1fr 1.2fr" : "1fr", gap: "var(--space-md)" }}>
          {/* Application List */}
          <div style={{ display: "grid", gap: "var(--space-md)" }}>
            {applications.map((a) => {
              const steps = getSteps(a.status);
              const isSelected = selectedId === a.application_no;
              return (
                <div
                  key={a.application_no}
                  className="card card-clickable"
                  style={isSelected ? { borderColor: "var(--brand-primary)", boxShadow: "var(--shadow-glow)" } : {}}
                  onClick={() => setSelectedId(a.application_no)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-sm)" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "var(--text-accent)" }}>
                      {a.application_no}
                    </span>
                    <span className={`badge ${STATUS_MAP[a.status]?.class || "badge-neutral"}`}>
                      {STATUS_MAP[a.status]?.label || a.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{a.service_type}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    Parcel: {a.parcel_ulpin || "—"} • {a.department}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>
                    Submitted: {new Date(a.created_at).toLocaleDateString()} • Priority: {a.priority}
                  </div>

                  {/* Progress Steps */}
                  <div className="status-steps" style={{ marginTop: "var(--space-md)" }}>
                    {steps.map((step, i) => (
                      <div key={i} style={{ display: "contents" }}>
                        <div className="status-step">
                          <div className={`status-step-dot ${step.status}`}>
                            {step.status === "completed" ? "✓" : step.status === "current" ? "●" : ""}
                          </div>
                          <div className="status-step-label">{step.label}</div>
                        </div>
                        {i < steps.length - 1 && (
                          <div className={`status-step-line ${step.status === "completed" ? "completed" : ""}`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail Panel */}
          {app && (
            <div className="card animate-slide" style={{ height: "fit-content" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-lg)" }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700 }}>{app.service_type}</h2>
                  <span style={{ fontSize: 13, color: "var(--text-accent)", fontFamily: "monospace" }}>{app.application_no}</span>
                </div>
                <button className="btn btn-ghost" onClick={() => setSelectedId(null)}>✕</button>
              </div>

              <div style={{ marginBottom: "var(--space-lg)" }}>
                {[
                  ["Parcel ULPIN", app.parcel_ulpin || "—"],
                  ["Applicant", app.applicant_name],
                  ["Department", app.department],
                  ["Assigned Officer", app.assigned_officer || "Pending Assignment"],
                  ["Purpose", app.purpose || "—"],
                  ["Submitted", new Date(app.created_at).toLocaleString()],
                  ["Last Updated", new Date(app.updated_at).toLocaleString()],
                ].map(([l, v]) => (
                  <div key={l} className="field-row">
                    <span className="field-label">{l}</span>
                    <span className="field-value">{v}</span>
                  </div>
                ))}
                <div className="field-row">
                  <span className="field-label">Status</span>
                  <span className={`badge ${STATUS_MAP[app.status]?.class || "badge-neutral"}`}>
                    {STATUS_MAP[app.status]?.label || app.status}
                  </span>
                </div>
              </div>

              {app.parcel_ulpin && (
                <div style={{ display: "flex", gap: "var(--space-sm)", marginBottom: "var(--space-lg)" }}>
                  <Link href={`/parcel/${app.parcel_ulpin}`} className="btn btn-secondary btn-sm">
                    View Parcel Land 360°
                  </Link>
                  <Link href={`/map?parcel=${app.parcel_ulpin}`} className="btn btn-secondary btn-sm">
                    View on Map
                  </Link>
                </div>
              )}

              <h3 className="section-title">Activity Timeline</h3>
              <div style={{ marginTop: "var(--space-sm)" }}>
                {history.length > 0 ? (
                  history.map((h: any, i: number) => (
                    <div key={i} style={{ display: "flex", gap: "var(--space-md)", padding: "var(--space-sm) 0", borderLeft: "2px solid var(--border-default)", paddingLeft: "var(--space-md)", marginLeft: 6, position: "relative" }}>
                      <div style={{ position: "absolute", left: -5, top: 10, width: 8, height: 8, borderRadius: "50%", background: i === 0 ? "var(--brand-primary)" : "var(--border-strong)" }} />
                      <div>
                        <div style={{ fontSize: 13, color: "var(--text-primary)" }}>{h.action}</div>
                        <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                          {new Date(h.created_at).toLocaleString()} • {h.performed_by}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "var(--text-secondary)", fontSize: 12 }}>No history entries logged yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
