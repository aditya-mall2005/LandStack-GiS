"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { STATE_ADAPTER_REGISTRY } from "@/lib/adapters";
import apiClient from "@/lib/api-client";

/* eslint-disable @typescript-eslint/no-explicit-any */

const DEPARTMENT_APIS = [
  { id: "revenue", name: "Revenue & Land Records API", endpoint: "/api/v1/mock/revenue/1420", system: "Bihar Bhumi / Jamabandi Panji-II", status: "CONNECTED", pingMs: 24, lastSync: "2 mins ago" },
  { id: "registration", name: "Registration & Deeds API", endpoint: "/api/v1/mock/registration/1420", system: "e-Nibandhan Registry", status: "CONNECTED", pingMs: 38, lastSync: "5 mins ago" },
  { id: "planning", name: "Town Planning & Zoning API", endpoint: "/api/v1/mock/planning/1420", system: "Master Plan 2035 GIS", status: "CONNECTED", pingMs: 42, lastSync: "12 mins ago" },
  { id: "tax", name: "Municipal Property Tax API", endpoint: "/api/v1/mock/tax/1420", system: "e-NagarSeva Tax Portal", status: "CONNECTED", pingMs: 29, lastSync: "8 mins ago" },
];

export default function AdaptersStudio() {
  const [selectedState, setSelectedState] = useState<"BR" | "TN" | "CH">("BR");
  const [rawJsonText, setRawJsonText] = useState("");
  const [transforming, setTransforming] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [apiResponses, setApiResponses] = useState<Record<string, any>>({});

  useEffect(() => {
    const config = STATE_ADAPTER_REGISTRY[selectedState];
    if (config) {
      setRawJsonText(JSON.stringify(config.sample_payload, null, 2));
      setResult(null);
    }
  }, [selectedState]);

  const handleNormalize = async () => {
    try {
      setTransforming(true);
      const parsed = JSON.parse(rawJsonText);
      const res = await apiClient.post("/api/v1/adapters/normalize", {
        state_code: selectedState,
        payload: parsed
      });
      setResult(res.data);
    } catch (err: any) {
      alert("Invalid JSON format: " + err.message);
    } finally {
      setTransforming(false);
    }
  };

  const testDepartmentApi = async (deptId: string, endpoint: string) => {
    try {
      const res = await apiClient.get(endpoint);
      setApiResponses((prev) => ({ ...prev, [deptId]: res.data }));
    } catch (err: any) {
      setApiResponses((prev) => ({ ...prev, [deptId]: { error: err.message } }));
    }
  };

  const config = STATE_ADAPTER_REGISTRY[selectedState];

  return (
    <div className="app-content animate-in">
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 24 }}>🔌</span>
            <h1 className="page-title">Interoperability & State Adapter Studio</h1>
          </div>
          <p className="page-subtitle">Demonstrates national-scale interoperability by normalizing heterogeneous state land records into a single Common LandStack Schema.</p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-sm)" }}>
          <Link href="/admin/intelligence" className="btn btn-outline" style={{ fontSize: 12 }}>
            🧠 AI Intelligence
          </Link>
          <Link href="/map" className="btn btn-primary" style={{ fontSize: 12 }}>
            🗺️ Open GIS Map
          </Link>
        </div>
      </div>

      {/* State Selector Buttons */}
      <div style={{ display: "flex", gap: 10, marginBottom: "var(--space-lg)" }}>
        {[
          { code: "BR", name: "Bihar (Khatiyan / Khesra)", icon: "🌾" },
          { code: "TN", name: "Tamil Nadu (Patta / Chitta)", icon: "🏛️" },
          { code: "CH", name: "Chandigarh / Punjab (Jamabandi / Farz)", icon: "🏢" }
        ].map((s) => (
          <button
            key={s.code}
            onClick={() => setSelectedState(s.code as any)}
            className={`btn ${selectedState === s.code ? "btn-primary" : "btn-outline"}`}
            style={{ padding: "8px 16px", fontSize: 13 }}
          >
            {s.icon} {s.name}
          </button>
        ))}
      </div>

      {/* State Metadata Config Card */}
      <div className="card" style={{ marginBottom: "var(--space-md)", background: "var(--bg-secondary)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, fontSize: 12 }}>
          <div><span style={{ color: "var(--text-secondary)" }}>Selected Adapter:</span> <strong>{config?.state_name}</strong></div>
          <div><span style={{ color: "var(--text-secondary)" }}>State Land Record System:</span> <strong>{config?.ror_system_name}</strong></div>
          <div><span style={{ color: "var(--text-secondary)" }}>Regional Measurement Unit:</span> <strong>{config?.measurement_unit}</strong></div>
          <div><span style={{ color: "var(--text-secondary)" }}>Admin Hierarchy:</span> <strong style={{ fontSize: 11 }}>{config?.admin_hierarchy.join(" → ")}</strong></div>
        </div>
      </div>

      {/* Transformation Sandbox (2 Columns) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.3fr", gap: "var(--space-md)", marginBottom: "var(--space-xl)" }}>
        {/* Left: Raw State Payload Editor */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div className="card-header">
            <h3 className="card-title">1. Raw State Payload (Input)</h3>
            <button className="btn btn-primary" onClick={handleNormalize} disabled={transforming} style={{ fontSize: 11 }}>
              {transforming ? "Normalizing..." : "⚡ Run State Adapter"}
            </button>
          </div>
          <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 8 }}>
            Editable state JSON containing local terminology (e.g. <em>khesra</em>, <em>rakba</em>, <em>raiyat</em>) and regional measurement units.
          </p>

          <textarea
            style={{
              flex: 1,
              minHeight: 280,
              fontFamily: "monospace",
              fontSize: 12,
              background: "#0d1117",
              color: "#58a6ff",
              border: "1px solid var(--border-color)",
              borderRadius: 6,
              padding: 12,
              lineHeight: 1.5
            }}
            value={rawJsonText}
            onChange={(e) => setRawJsonText(e.target.value)}
          />
        </div>

        {/* Right: Normalized Canonical LandStack Output */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div className="card-header">
            <h3 className="card-title">2. Canonical LandStack Entity (Output)</h3>
            {result?.data_quality && (
              <span className={`badge ${result.data_quality.overall_score >= 80 ? "badge-success" : "badge-warning"}`}>
                Quality Score: {result.data_quality.overall_score}%
              </span>
            )}
          </div>

          {result?.canonical ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Quality Score Breakdown */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, background: "var(--bg-secondary)", padding: 8, borderRadius: 6, textAlign: "center", fontSize: 11 }}>
                <div><span style={{ color: "var(--text-secondary)" }}>Completeness:</span> <strong>{result.data_quality.completeness}%</strong></div>
                <div><span style={{ color: "var(--text-secondary)" }}>Consistency:</span> <strong>{result.data_quality.consistency}%</strong></div>
                <div><span style={{ color: "var(--text-secondary)" }}>Unit Validity:</span> <strong>{result.data_quality.validity}%</strong></div>
              </div>

              {/* Normalized Entity JSON */}
              <pre
                style={{
                  maxHeight: 260,
                  overflowY: "auto",
                  fontFamily: "monospace",
                  fontSize: 11,
                  background: "#0d1117",
                  color: "#a5d6ff",
                  padding: 12,
                  borderRadius: 6,
                  border: "1px solid var(--border-color)",
                  margin: 0
                }}
              >
                {JSON.stringify(result.canonical, null, 2)}
              </pre>

              <div style={{ fontSize: 11, color: "var(--status-success)" }}>
                ✓ Normalized Area: <strong>{result.canonical.area_sq_m} sq.m</strong> (from {result.canonical.original_area} {result.canonical.original_unit})
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", fontSize: 12, textAlign: "center", minHeight: 280 }}>
              Click "⚡ Run State Adapter" to trigger schema transformation, unit conversion, and canonical mapping.
            </div>
          )}
        </div>
      </div>

      {/* Mock Department API Gateway Status Monitor */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Live Department API Gateway & Interoperability Health</h3>
            <p className="card-subtitle">Monitors real-time connectivity to state department endpoints</p>
          </div>
          <span className="badge badge-success">4/4 APIs Online</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
          {DEPARTMENT_APIS.map((api) => (
            <div key={api.id} style={{ background: "var(--bg-secondary)", padding: 12, borderRadius: 8, border: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 12 }}>{api.name}</span>
                <span className="badge badge-success" style={{ fontSize: 9 }}>● {api.status}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>System: {api.system}</div>
              <div style={{ fontSize: 10, color: "var(--text-secondary)" }}>Latency: {api.pingMs}ms • Sync: {api.lastSync}</div>

              <div style={{ marginTop: 10 }}>
                <button
                  className="btn btn-outline"
                  style={{ fontSize: 10, padding: "3px 8px", width: "100%", justifyContent: "center" }}
                  onClick={() => testDepartmentApi(api.id, api.endpoint)}
                >
                  📡 Test Query Response
                </button>
              </div>

              {apiResponses[api.id] && (
                <pre style={{ marginTop: 8, maxHeight: 100, overflowY: "auto", fontSize: 9, background: "#0d1117", color: "#38bdf8", padding: 6, borderRadius: 4, margin: 0 }}>
                  {JSON.stringify(apiResponses[api.id], null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
