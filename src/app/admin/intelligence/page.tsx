"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SAMPLE_DOCUMENTS } from "@/lib/ai/document-extract";
import apiClient from "@/lib/api-client";

export default function IntelligenceDashboard() {
  const [satelliteDetections, setSatelliteDetections] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [activeTab, setActiveTab] = useState<"satellite" | "anomalies" | "ocr" | "assistant">("satellite");

  // Document OCR Sandbox State
  const [selectedDocKey, setSelectedDocKey] = useState("sale_deed_1420");
  const [extracting, setExtracting] = useState(false);
  const [docResult, setDocResult] = useState<any>(SAMPLE_DOCUMENTS.sale_deed_1420);

  // AI Assistant Chat State
  const [chatQuery, setChatQuery] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string; tools?: string[] }[]>([
    {
      role: "assistant",
      content: "Hello Officer! I am LandStack's AI Governance Assistant. You can ask me to analyze detected satellite changes, explain cross-department record discrepancies, or summarize case histories.",
      tools: ["get_parcel_360", "get_data_conflicts", "get_satellite_changes"]
    }
  ]);

  useEffect(() => {
    apiClient.get("/api/v1/ai/satellite-changes").then((r) => setSatelliteDetections(r.data.detections || [])).catch(console.error);
    apiClient.get("/api/v1/ai/anomalies").then((r) => setAnomalies(r.data.anomalies || [])).catch(console.error);
  }, []);

  const handleDocumentExtract = async () => {
    setExtracting(true);
    try {
      const res = await apiClient.post("/api/v1/ai/document-extract", {
        document_type: "SALE_DEED",
        document_name: "Reg_SaleDeed_Basopatti_1420.pdf"
      });
      setDocResult(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setExtracting(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatQuery.trim()) return;
    const userQ = chatQuery;
    setChatQuery("");
    setChatHistory((prev) => [...prev, { role: "user", content: userQ }]);
    setChatLoading(true);

    try {
      const res = await apiClient.post("/api/v1/ai/chat", {
        query: userQ,
        role: "OFFICER"
      });
      setChatHistory((prev) => [...prev, { role: "assistant", content: res.data.reply, tools: res.data.tools_executed }]);
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="app-content animate-in">
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 24 }}>🧠</span>
            <h1 className="page-title">AI & Geospatial Intelligence Engine</h1>
          </div>
          <p className="page-subtitle">Satellite change detection, document intelligence OCR, transaction anomaly scoring, and decision-support assistant.</p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-sm)" }}>
          <Link href="/admin/adapters" className="btn btn-outline" style={{ fontSize: 12 }}>
            🔌 State Adapters
          </Link>
          <Link href="/officer" className="btn btn-primary" style={{ fontSize: 12 }}>
            👨‍💼 Officer Portal
          </Link>
        </div>
      </div>

      {/* Sub-Module Navigation */}
      <div className="no-scrollbar" style={{ display: "flex", gap: 8, marginBottom: "var(--space-md)", borderBottom: "1px solid var(--border-color)", paddingBottom: 10, overflowX: "auto", whiteSpace: "nowrap", scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {[
          { id: "satellite", label: "🛰️ Satellite Change Detection", count: satelliteDetections.length },
          { id: "anomalies", label: "⚡ Transaction Risk & Anomaly Radar", count: anomalies.length },
          { id: "ocr", label: "📄 Document Intelligence & OCR", count: "Live" },
          { id: "assistant", label: "💬 AI Decision-Support Assistant", count: "Bot" }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`btn ${activeTab === t.id ? "btn-primary" : "btn-outline"}`}
            style={{ fontSize: 12, padding: "6px 14px", flexShrink: 0 }}
          >
            {t.label} <span className="badge badge-neutral" style={{ fontSize: 10, marginLeft: 6 }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Satellite Change Detection & Slider */}
      {activeTab === "satellite" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-md)" }}>
          {/* Visual Before / After Comparison Slider */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Interactive Satellite Comparison Slider</h3>
              <span className="badge badge-info">Sentinel-2 (10m Resolution)</span>
            </div>

            <div style={{ position: "relative", height: 320, borderRadius: 10, overflow: "hidden", background: "#0d1117", marginBottom: 14 }}>
              {/* After Layer (2026) */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff"
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 8 }}>🏗️ 🏢</div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "var(--status-error)" }}>AUGUST 2026: Built-Up Structure Detected</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>Area: 450 sqm • NDVI Drop: -0.42 • YOLOv8 Seg: 89% Conf</div>
              </div>

              {/* Before Layer (2024) with clip path */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  width: `${sliderPosition}%`,
                  background: "linear-gradient(135deg, #064e3b 0%, #022c22 100%)",
                  borderRight: "3px solid #38bdf8",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  overflow: "hidden"
                }}
              >
                <div style={{ width: 400, textAlign: "center" }}>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>🌾 🌳</div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#34d399" }}>MARCH 2024: Agricultural Vegetation</div>
                  <div style={{ fontSize: 12, color: "#6ee7b7" }}>Official RoR: Dhanhar-1 (Paddy Crop)</div>
                </div>
              </div>

              {/* Drag Handle Tag */}
              <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.7)", padding: "4px 8px", borderRadius: 4, fontSize: 11, color: "#34d399" }}>
                ← 2024 (Before)
              </div>
              <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.7)", padding: "4px 8px", borderRadius: 4, fontSize: 11, color: "#f87171" }}>
                2026 (After) →
              </div>
            </div>

            {/* Slider Control */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 8px" }}>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>2024 Baseline</span>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                style={{ flex: 1, accentColor: "var(--brand-primary)" }}
              />
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>2026 Detection</span>
            </div>
          </div>

          {/* Detections List */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 12 }}>Detected Physical Changes</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 360, overflowY: "auto" }}>
              {satelliteDetections.map((d) => (
                <div key={d.detection_id} style={{ background: "var(--bg-secondary)", padding: 12, borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{d.change_type.replace(/_/g, " ")}</span>
                    <span className="badge badge-error" style={{ fontSize: 10 }}>{(d.confidence * 100).toFixed(0)}% Confidence</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    Parcel #{d.survey_number} • Area Affected: {d.area_affected_sqm} sqm
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-accent)", marginTop: 4 }}>
                    Sensor: {d.source}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Transaction Risk & Anomaly Radar */}
      {activeTab === "anomalies" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "var(--space-md)" }}>
          {anomalies.map((a) => (
            <div key={a.anomaly_id} className="card" style={{ borderLeft: `4px solid ${a.risk_score >= 70 ? "var(--status-error)" : "var(--status-warning)"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{a.anomaly_type.replace(/_/g, " ")}</div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Parcel #{a.survey_number} • {a.parcel_ulpin}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: a.risk_score >= 70 ? "var(--status-error)" : "var(--status-warning)" }}>
                    {a.risk_score}/100
                  </div>
                  <span className={`badge ${a.risk_score >= 70 ? "badge-error" : "badge-warning"}`} style={{ fontSize: 10 }}>
                    {a.risk_level} RISK
                  </span>
                </div>
              </div>

              <div style={{ background: "var(--bg-secondary)", padding: 10, borderRadius: 6, marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, color: "var(--text-accent)" }}>Explainable Contributing Factors:</div>
                <ul style={{ paddingLeft: 16, margin: 0, fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {(a.contributing_factors?.factors || ["Rapid transfer sequence", "Valuation below circle rate benchmark"]).map((f: string, i: number) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>

              <div style={{ fontSize: 11, color: "var(--text-secondary)", borderTop: "1px solid var(--border-color)", paddingTop: 8 }}>
                <strong>Recommended Action:</strong> {a.recommended_action}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Document Intelligence & OCR */}
      {activeTab === "ocr" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "var(--space-md)" }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Document Parser & Cross-Verification Sandbox</h3>
              <button className="btn btn-primary" style={{ fontSize: 11 }} onClick={handleDocumentExtract} disabled={extracting}>
                {extracting ? "Running OCR..." : "⚡ Run OCR Extraction"}
              </button>
            </div>

            <div style={{ background: "var(--bg-secondary)", padding: 12, borderRadius: 8, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>📄 {docResult?.document_name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Type: {docResult?.document_type} • File Size: {docResult?.file_size_kb} KB</div>
                </div>
                <span className="badge badge-success">OCR Conf: {(docResult?.overall_confidence * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div className="table-wrap" style={{ border: "none" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Extracted Field</th>
                    <th>OCR Extracted Value</th>
                    <th>LandStack DB Cross-Check</th>
                    <th>Match</th>
                  </tr>
                </thead>
                <tbody>
                  {docResult?.fields?.map((f: any, i: number) => (
                    <tr key={i}>
                      <td style={{ fontSize: 11, fontWeight: 600 }}>{f.field_name}</td>
                      <td style={{ fontSize: 11, color: "var(--text-accent)" }}>{f.extracted_value}</td>
                      <td style={{ fontSize: 11 }}>{f.db_value || "—"}</td>
                      <td>
                        <span className={`badge ${f.db_match ? "badge-success" : "badge-error"}`} style={{ fontSize: 9 }}>
                          {f.db_match ? "✓ MATCH" : "⚠️ MISMATCH"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 10 }}>Cross-Verification Summary</h3>
            <div style={{ background: "var(--status-warning-bg)", border: "1px solid var(--status-warning)", padding: 12, borderRadius: 8, marginBottom: 14 }}>
              <div style={{ fontWeight: 700, color: "var(--status-warning)", fontSize: 12 }}>⚠️ Area Discrepancy Flagged:</div>
              <div style={{ fontSize: 11, color: "var(--text-primary)", marginTop: 4 }}>
                The uploaded Sale Deed specifies <strong>1,350.00 sqm</strong>, whereas the Cadastral GIS spatial boundary contains <strong>1,420.00 sqm</strong> (70 sqm discrepancy).
              </div>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              The system automatically flags this discrepancy into the <strong>Cross-Department Data Conflict Engine</strong> without human intervention, alerting the Revenue Officer before final mutation approval.
            </p>
          </div>
        </div>
      )}

      {/* Tab 4: AI Decision-Support Assistant */}
      {activeTab === "assistant" && (
        <div className="card" style={{ height: 500, display: "flex", flexDirection: "column" }}>
          <div className="card-header" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: 10 }}>
            <div>
              <h3 className="card-title">Governance Decision-Support AI Assistant</h3>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Authorized Tools: get_parcel_360, get_conflicts, get_satellite_changes, get_workflow_status</div>
            </div>
            <span className="badge badge-info">Active LLM Agent</span>
          </div>

          {/* Message List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 0", display: "flex", flexDirection: "column", gap: 12 }}>
            {chatHistory.map((msg, i) => (
              <div
                key={i}
                style={{
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "80%",
                  background: msg.role === "user" ? "var(--brand-primary)" : "var(--bg-secondary)",
                  color: msg.role === "user" ? "#fff" : "var(--text-primary)",
                  padding: "10px 14px",
                  borderRadius: 10,
                  fontSize: 12,
                  lineHeight: 1.6,
                  border: msg.role === "assistant" ? "1px solid var(--border-color)" : "none"
                }}
              >
                <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
                {msg.tools && msg.tools.length > 0 && (
                  <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                    {msg.tools.map((t) => (
                      <span key={t} className="badge badge-neutral" style={{ fontSize: 9 }}>🛠️ {t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {chatLoading && (
              <div style={{ alignSelf: "flex-start", background: "var(--bg-secondary)", padding: "8px 12px", borderRadius: 8, fontSize: 11, color: "var(--text-secondary)" }}>
                Executing authorized tools & generating decision-support memo...
              </div>
            )}
          </div>

          {/* Prompt Input */}
          <div style={{ display: "flex", gap: 8, borderTop: "1px solid var(--border-color)", paddingTop: 10 }}>
            <input
              type="text"
              style={{ flex: 1, background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 6, color: "var(--text-primary)", padding: "8px 12px", fontSize: 12 }}
              placeholder="Ask: 'Why is Parcel #1420 flagged?' or 'Which cases have SLA breaches?'..."
              value={chatQuery}
              onChange={(e) => setChatQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
            />
            <button className="btn btn-primary" onClick={handleSendChat} disabled={chatLoading || !chatQuery.trim()}>
              Send →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
