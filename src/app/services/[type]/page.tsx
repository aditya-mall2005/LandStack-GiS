"use client";

import { useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import apiClient from "@/lib/api-client";

const SERVICE_INFO: Record<string, { name: string; icon: string; fields: string[] }> = {
  "ownership-verification": { name: "Ownership Verification", icon: "✓", fields: ["parcel", "purpose"] },
  "ror-extract": { name: "RoR Extract Request", icon: "📜", fields: ["parcel", "purpose"] },
  "encumbrance-certificate": { name: "Encumbrance Certificate", icon: "🔒", fields: ["parcel", "period"] },
  "building-permission": { name: "Building Permission", icon: "🏗️", fields: ["parcel", "building_type", "area", "floors"] },
  "land-use-certificate": { name: "Land Use Certificate", icon: "🌾", fields: ["parcel", "purpose"] },
  "property-tax": { name: "Property Tax Query", icon: "💰", fields: ["parcel"] },
  "mutation": { name: "Property Mutation", icon: "📋", fields: ["parcel", "mutation_reason", "new_owner"] },
  "restriction-check": { name: "Restriction Check", icon: "⚠️", fields: ["parcel"] },
};

function ServiceFormContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = params.type as string;
  const info = SERVICE_INFO[type] || { name: type, icon: "📋", fields: ["parcel"] };

  const [form, setForm] = useState({
    parcel_ulpin: searchParams.get("parcel") || "",
    purpose: "",
    building_type: "",
    area: "",
    floors: "",
    period: "5",
    mutation_reason: "",
    new_owner: "",
    remarks: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [appId, setAppId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.post("/api/v1/services", {
        service_type: type,
        parcel_ulpin: form.parcel_ulpin,
        applicant_name: "Ramesh Kumar",
        applicant_email: "ramesh.kumar@example.com",
        applicant_phone: "+91-9876543210",
        purpose: form.purpose || form.mutation_reason || "Citizen service request",
        details: form,
        priority: "NORMAL",
      });

      const data = res.data;
      setAppId(data.application?.application_no || `LS-2026-${Math.floor(10000 + Math.random() * 90000)}`);
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="app-content animate-in">
        <div className="card" style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", padding: "var(--space-2xl)" }}>
          <div style={{ fontSize: 48, marginBottom: "var(--space-md)" }}>✅</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: "var(--space-sm)" }}>Application Submitted</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "var(--space-lg)" }}>
            Your {info.name} application has been submitted successfully.
          </p>
          <div className="card" style={{ background: "var(--bg-elevated)", marginBottom: "var(--space-lg)" }}>
            <div className="field-row">
              <span className="field-label">Application ID</span>
              <span className="field-value-accent" style={{ fontSize: 16 }}>{appId}</span>
            </div>
            <div className="field-row">
              <span className="field-label">Service</span>
              <span className="field-value">{info.name}</span>
            </div>
            <div className="field-row">
              <span className="field-label">Status</span>
              <span className="badge badge-info">Submitted</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "var(--space-sm)", justifyContent: "center" }}>
            <button className="btn btn-primary" onClick={() => router.push("/applications")}>Track Application</button>
            <button className="btn btn-secondary" onClick={() => router.push("/services")}>Back to Services</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-content animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{info.icon} {info.name}</h1>
          <p className="page-subtitle">Fill in the details below to submit your request</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
        <div className="card" style={{ marginBottom: "var(--space-md)" }}>
          <h3 className="card-title" style={{ marginBottom: "var(--space-md)" }}>Parcel Information</h3>
          <div style={{ marginBottom: "var(--space-md)" }}>
            <label className="field-label" style={{ display: "block", marginBottom: 4 }}>Parcel ULPIN / ID *</label>
            <input className="input" placeholder="Enter ULPIN or Parcel ID" value={form.parcel_ulpin} onChange={(e) => setForm({ ...form, parcel_ulpin: e.target.value })} required />
          </div>

          {info.fields.includes("purpose") && (
            <div style={{ marginBottom: "var(--space-md)" }}>
              <label className="field-label" style={{ display: "block", marginBottom: 4 }}>Purpose *</label>
              <select className="select" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} required>
                <option value="">Select purpose</option>
                <option value="purchase">Property Purchase</option>
                <option value="loan">Bank Loan</option>
                <option value="legal">Legal Proceeding</option>
                <option value="personal">Personal Verification</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}

          {info.fields.includes("building_type") && (
            <>
              <div style={{ marginBottom: "var(--space-md)" }}>
                <label className="field-label" style={{ display: "block", marginBottom: 4 }}>Building Type *</label>
                <select className="select" value={form.building_type} onChange={(e) => setForm({ ...form, building_type: e.target.value })} required>
                  <option value="">Select type</option>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="industrial">Industrial</option>
                  <option value="institutional">Institutional</option>
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)", marginBottom: "var(--space-md)" }}>
                <div>
                  <label className="field-label" style={{ display: "block", marginBottom: 4 }}>Proposed Area (sqm) *</label>
                  <input className="input" type="number" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} required />
                </div>
                <div>
                  <label className="field-label" style={{ display: "block", marginBottom: 4 }}>Floors *</label>
                  <input className="input" type="number" value={form.floors} onChange={(e) => setForm({ ...form, floors: e.target.value })} required />
                </div>
              </div>
            </>
          )}

          {info.fields.includes("new_owner") && (
            <>
              <div style={{ marginBottom: "var(--space-md)" }}>
                <label className="field-label" style={{ display: "block", marginBottom: 4 }}>Mutation Reason *</label>
                <select className="select" value={form.mutation_reason} onChange={(e) => setForm({ ...form, mutation_reason: e.target.value })} required>
                  <option value="">Select reason</option>
                  <option value="sale">Sale</option>
                  <option value="inheritance">Inheritance</option>
                  <option value="gift">Gift</option>
                  <option value="partition">Partition</option>
                </select>
              </div>
              <div style={{ marginBottom: "var(--space-md)" }}>
                <label className="field-label" style={{ display: "block", marginBottom: 4 }}>New Owner Name *</label>
                <input className="input" value={form.new_owner} onChange={(e) => setForm({ ...form, new_owner: e.target.value })} required />
              </div>
            </>
          )}

          <div style={{ marginTop: "var(--space-md)" }}>
            <label className="field-label" style={{ display: "block", marginBottom: 4 }}>Remarks / Special Instructions</label>
            <textarea
              className="input"
              rows={3}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="Any additional notes or instructions..."
              style={{ resize: "vertical" }}
            />
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginTop: "var(--space-md)" }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "var(--space-sm)" }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? "Submitting Application..." : "Submit Application"}
          </button>
          <button type="button" className="btn btn-secondary btn-lg" onClick={() => router.push("/services")}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default function ServiceFormPage() {
  return (
    <Suspense fallback={<div className="app-content"><p>Loading...</p></div>}>
      <ServiceFormContent />
    </Suspense>
  );
}
