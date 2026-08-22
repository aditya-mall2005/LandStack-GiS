"use client";

import { useState } from "react";

const IMPORT_HISTORY = [
  { id: "IMP-001", dataset: "Cadastral Parcels", dept: "Revenue", format: "GeoJSON", records: 300, valid: 300, matched: 300, status: "COMPLETED", date: "22 Aug 2026" },
  { id: "IMP-002", dataset: "RoR Records", dept: "Revenue", format: "JSON", records: 300, valid: 300, matched: 300, status: "COMPLETED", date: "22 Aug 2026" },
  { id: "IMP-003", dataset: "Registration Records", dept: "Registration", format: "JSON", records: 309, valid: 309, matched: 309, status: "COMPLETED", date: "22 Aug 2026" },
  { id: "IMP-004", dataset: "Encumbrance Records", dept: "Registration", format: "JSON", records: 132, valid: 132, matched: 132, status: "COMPLETED", date: "22 Aug 2026" },
  { id: "IMP-005", dataset: "Building Permissions", dept: "Municipal", format: "JSON", records: 83, valid: 83, matched: 83, status: "COMPLETED", date: "22 Aug 2026" },
  { id: "IMP-006", dataset: "Property Tax", dept: "Municipal", format: "JSON", records: 789, valid: 789, matched: 789, status: "COMPLETED", date: "22 Aug 2026" },
  { id: "IMP-007", dataset: "Dispute Records", dept: "Judiciary", format: "JSON", records: 42, valid: 42, matched: 42, status: "COMPLETED", date: "22 Aug 2026" },
  { id: "IMP-008", dataset: "Zoning Master Plan", dept: "Planning", format: "GeoJSON", records: 8, valid: 8, matched: 8, status: "COMPLETED", date: "22 Aug 2026" },
  { id: "IMP-009", dataset: "Environmental Zones", dept: "Environment", format: "GeoJSON", records: 5, valid: 5, matched: 5, status: "COMPLETED", date: "22 Aug 2026" },
];

export default function ImportPage() {
  const [form, setForm] = useState({ dataset: "", department: "", crs: "EPSG:4326", identifier: "ULPIN" });
  const [simResult, setSimResult] = useState<null | { total: number; valid: number; invalid: number; matched: number }>(null);

  const handleValidate = (e: React.FormEvent) => {
    e.preventDefault();
    setSimResult({
      total: Math.floor(Math.random() * 500) + 100,
      valid: Math.floor(Math.random() * 450) + 100,
      invalid: Math.floor(Math.random() * 30),
      matched: Math.floor(Math.random() * 400) + 100,
    });
  };

  return (
    <div className="app-content animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📥 Data Import</h1>
          <p className="page-subtitle">Upload and ingest datasets from government departments</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: "var(--space-lg)" }}>
        {/* Upload Form */}
        <div>
          <form className="card" onSubmit={handleValidate}>
            <h3 className="card-title" style={{ marginBottom: "var(--space-lg)" }}>New Import</h3>

            <div style={{ marginBottom: "var(--space-md)" }}>
              <label className="field-label" style={{ display: "block", marginBottom: 4 }}>Dataset</label>
              <select className="select" value={form.dataset} onChange={(e) => setForm({ ...form, dataset: e.target.value })}>
                <option value="">Select dataset type</option>
                <option value="cadastral">Cadastral Parcels</option>
                <option value="ror">Record of Rights</option>
                <option value="registration">Registration Records</option>
                <option value="encumbrance">Encumbrance Records</option>
                <option value="building">Building Permissions</option>
                <option value="landuse">Land Use Data</option>
                <option value="tax">Property Tax</option>
                <option value="zoning">Master Plan / Zoning</option>
              </select>
            </div>

            <div style={{ marginBottom: "var(--space-md)" }}>
              <label className="field-label" style={{ display: "block", marginBottom: 4 }}>Department</label>
              <input className="input" placeholder="e.g. Revenue Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>

            <div style={{ marginBottom: "var(--space-md)" }}>
              <label className="field-label" style={{ display: "block", marginBottom: 4 }}>File</label>
              <div style={{ border: "2px dashed var(--border-default)", borderRadius: "var(--radius-md)", padding: "var(--space-lg)", textAlign: "center", cursor: "pointer", background: "var(--bg-input)" }}>
                <div style={{ fontSize: 24, marginBottom: "var(--space-sm)" }}>📁</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Drag & drop or click to upload</div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>GeoJSON, CSV, XLSX supported</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)", marginBottom: "var(--space-md)" }}>
              <div>
                <label className="field-label" style={{ display: "block", marginBottom: 4 }}>CRS</label>
                <select className="select" value={form.crs} onChange={(e) => setForm({ ...form, crs: e.target.value })}>
                  <option value="EPSG:4326">EPSG:4326 (WGS84)</option>
                  <option value="EPSG:3857">EPSG:3857 (Web Mercator)</option>
                  <option value="EPSG:32644">EPSG:32644 (UTM 44N)</option>
                </select>
              </div>
              <div>
                <label className="field-label" style={{ display: "block", marginBottom: 4 }}>Identifier</label>
                <select className="select" value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })}>
                  <option value="ULPIN">ULPIN</option>
                  <option value="SURVEY_NO">Survey Number</option>
                  <option value="KHESRA">Khesra Number</option>
                  <option value="PLOT">Plot Number</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "var(--space-sm)" }}>
              <button type="submit" className="btn btn-secondary" style={{ flex: 1 }}>🔍 Validate</button>
              <button type="button" className="btn btn-primary" style={{ flex: 1 }}>📥 Import</button>
            </div>
          </form>

          {/* Validation Result */}
          {simResult && (
            <div className="card animate-in" style={{ marginTop: "var(--space-md)" }}>
              <h3 className="card-title" style={{ marginBottom: "var(--space-md)" }}>Validation Results</h3>
              {[
                ["Total Records", simResult.total, "var(--text-primary)"],
                ["Valid", simResult.valid, "var(--status-success)"],
                ["Invalid", simResult.invalid, "var(--status-error)"],
                ["ULPIN Matched", simResult.matched, "var(--status-info)"],
              ].map(([label, value, color]) => (
                <div key={label as string} className="field-row">
                  <span className="field-label">{label as string}</span>
                  <span className="field-value" style={{ color: color as string, fontWeight: 700 }}>{(value as number).toLocaleString()}</span>
                </div>
              ))}
              <div className="progress-bar" style={{ marginTop: "var(--space-md)" }}>
                <div className="progress-fill" style={{ width: `${(simResult.valid / simResult.total) * 100}%` }} />
              </div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4, textAlign: "right" }}>
                {((simResult.valid / simResult.total) * 100).toFixed(1)}% valid
              </div>
            </div>
          )}
        </div>

        {/* Import History */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Import History</h3>
            <span className="badge badge-success">{IMPORT_HISTORY.length} completed</span>
          </div>
          <div className="table-wrap" style={{ border: "none" }}>
            <table className="table">
              <thead>
                <tr><th>Job ID</th><th>Dataset</th><th>Department</th><th>Format</th><th>Records</th><th>Valid</th><th>Matched</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {IMPORT_HISTORY.map((h) => (
                  <tr key={h.id}>
                    <td style={{ fontFamily: "monospace", fontSize: 11 }}>{h.id}</td>
                    <td>{h.dataset}</td>
                    <td>{h.dept}</td>
                    <td><span className="badge badge-neutral">{h.format}</span></td>
                    <td>{h.records.toLocaleString()}</td>
                    <td style={{ color: "var(--status-success)" }}>{h.valid.toLocaleString()}</td>
                    <td style={{ color: "var(--status-info)" }}>{h.matched.toLocaleString()}</td>
                    <td><span className="badge badge-success">{h.status}</span></td>
                    <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{h.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
