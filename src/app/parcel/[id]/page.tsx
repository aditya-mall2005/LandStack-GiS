"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/api-client";
import * as Lucide from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", icon: <Lucide.PieChart size={14} /> },
  { id: "ownership", label: "Ownership", icon: <Lucide.User size={14} /> },
  { id: "ror", label: "RoR", icon: <Lucide.FileText size={14} /> },
  { id: "registration", label: "Registration", icon: <Lucide.FileSignature size={14} /> },
  { id: "encumbrance", label: "Encumbrance", icon: <Lucide.Lock size={14} /> },
  { id: "building", label: "Building", icon: <Lucide.Hammer size={14} /> },
  { id: "landuse", label: "Land Use", icon: <Lucide.Trees size={14} /> },
  { id: "tax", label: "Tax", icon: <Lucide.Wallet size={14} /> },
  { id: "restrictions", label: "Restrictions", icon: <Lucide.AlertTriangle size={14} /> },
  { id: "conflicts", label: "Conflicts", icon: <Lucide.GitMerge size={14} /> },
  { id: "provenance", label: "Provenance", icon: <Lucide.Landmark size={14} /> },
];

const STATUS_COLORS: Record<string, string> = {
  PERMITTED: "var(--status-success)",
  CONDITIONAL: "var(--status-info)",
  REVIEW_REQUIRED: "var(--status-warning)",
  RESTRICTED: "var(--status-error)",
  BLOCKED: "var(--status-error)",
};

const LAND_TYPE_COLORS: Record<string, string> = {
  Agricultural: "#4CAF50",
  Residential: "#2196F3",
  Commercial: "#FF9800",
  Industrial: "#9C27B0",
  "Government Land": "#F44336",
  Wasteland: "#795548",
};

export default function ParcelPage() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!params.id) return;
    let isMounted = true;
    apiClient
      .get(`/api/parcels/${params.id}`)
      .then((res) => {
        if (isMounted) {
          setData(res.data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  if (loading) {
    return (
      <div className="app-content" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
        <div style={{ textAlign: "center" }}>
          <div className="animate-pulse" style={{ color: "var(--brand-primary)" }}><Lucide.Map size={48} /></div>
          <p style={{ color: "var(--text-secondary)", marginTop: "var(--space-md)" }}>Loading Land 360° data...</p>
        </div>
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="app-content">
        <div className="card" style={{ textAlign: "center", padding: "var(--space-2xl)" }}>
          <div style={{ color: "var(--status-error)" }}><Lucide.XCircle size={48} /></div>
          <h3 style={{ marginTop: "var(--space-md)" }}>Parcel Not Found</h3>
          <p style={{ color: "var(--text-secondary)" }}>{data?.error || "The requested parcel could not be found."}</p>
          <Link href="/search" className="btn btn-primary" style={{ marginTop: "var(--space-md)" }}>Search Again</Link>
        </div>
      </div>
    );
  }

  const p = data.parcel;
  const rules = data.rules_evaluation;
  const quality = data.integration?.data_quality;

  return (
    <div className="app-content animate-in">
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-lg)", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", marginBottom: 4, flexWrap: "wrap" }}>
            <h1 className="page-title">Land 360°</h1>
            <span className="badge" style={{ background: STATUS_COLORS[rules?.status] + "22", color: STATUS_COLORS[rules?.status], fontSize: 12, padding: "3px 10px" }}>
              {rules?.status || "UNKNOWN"}
            </span>
          </div>
          <p className="page-subtitle" style={{ wordBreak: "break-word" }}>
            ULPIN: <span style={{ color: "var(--text-accent)", fontFamily: "monospace", fontWeight: 600 }}>{p.ulpin}</span>
            {" • "}Survey: {p.survey_number}
            {" • "}{p.district_code}
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
          <Link href={`/map?parcel=${p.parcel_id}`} className="btn btn-secondary"><Lucide.Map size={14} /> View on Map</Link>
          <Link href={`/services/ownership-verification?parcel=${p.parcel_id}`} className="btn btn-primary"><Lucide.CheckCircle2 size={14} /> Verify Ownership</Link>
        </div>
      </div>

      {/* Top Summary Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: "var(--space-lg)" }}>
        <div className="stat-card">
          <div className="stat-label">Area</div>
          <div className="stat-value" style={{ fontSize: 18 }}>{Number(p.area).toLocaleString()}</div>
          <div className="stat-label">{p.area_unit || "sqm"}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Land Type</div>
          <div style={{ marginTop: 4 }}>
            <span className="badge-land" style={{ background: LAND_TYPE_COLORS[p.land_type] || "#607D8B", fontSize: 12, padding: "3px 10px" }}>
              {p.land_type}
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Compliance Score</div>
          <div className="stat-value" style={{ fontSize: 18, color: STATUS_COLORS[rules?.status] }}>{rules?.compliance_score || 0}%</div>
          <div className="progress-bar" style={{ marginTop: 6 }}>
            <div className="progress-fill" style={{ width: `${rules?.compliance_score || 0}%`, background: rules?.compliance_score >= 80 ? "var(--status-success)" : rules?.compliance_score >= 50 ? "var(--status-warning)" : "var(--status-error)" }} />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Data Layers</div>
          <div className="stat-value" style={{ fontSize: 18 }}>{quality?.layers_available?.length || 0}</div>
          <div className="stat-label">of 9 connected</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Alerts</div>
          <div className="stat-value" style={{ fontSize: 18, color: rules?.alerts?.length > 0 ? "var(--status-warning)" : "var(--status-success)" }}>
            {rules?.alerts?.length || 0}
          </div>
          <div className="stat-label" style={{ fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rules?.summary?.substring(0, 30)}</div>
        </div>
      </div>

      {/* Rules Alerts */}
      {rules?.alerts?.length > 0 && (
        <div style={{ display: "grid", gap: "var(--space-sm)", marginBottom: "var(--space-lg)" }}>
          {rules.alerts.map((a: any, i: number) => (
            <div key={i} className={`alert alert-${a.severity === "CRITICAL" ? "error" : "warning"}`}>
              {a.severity === "CRITICAL" ? <Lucide.AlertCircle size={14} color="var(--status-error)" /> : <Lucide.AlertTriangle size={14} color="var(--status-warning)" />} <strong>[{a.code}]</strong> {a.message}
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs no-scrollbar" style={{ marginBottom: "var(--space-lg)", display: "flex", overflowX: "auto", whiteSpace: "nowrap", paddingBottom: 0, scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
            style={{ flexShrink: 0 }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-in" key={activeTab}>
        {/* ──── Overview ──── */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-md)" }}>
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: "var(--space-md)" }}>Parcel Details</h3>
              {[
                ["Parcel ID", p.parcel_id?.substring(0, 8) + "..."],
                ["ULPIN", p.ulpin],
                ["Survey / Khesra", p.survey_number],
                ["Area", `${Number(p.area).toLocaleString()} ${p.area_unit || "sqm"}`],
                ["Land Type", p.land_type],
                ["State", p.state_code],
                ["District", p.district_code],
                ["Village", p.village_code],
              ].map(([label, value]) => (
                <div key={label} className="field-row">
                  <span className="field-label">{label}</span>
                  <span className={label === "ULPIN" ? "field-value-accent" : "field-value"}>{value || "—"}</span>
                </div>
              ))}
            </div>
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: "var(--space-md)" }}>Data Quality</h3>
              {[
                ["RoR Record", quality?.has_ror],
                ["Ownership", quality?.has_ownership],
                ["Registration", quality?.has_registration],
                ["Encumbrance", quality?.has_encumbrance],
                ["Building Permission", quality?.has_building_permission],
                ["Property Tax", quality?.has_tax],
                ["Conflicts", quality?.has_conflicts],
              ].map(([label, hasData]) => (
                <div key={label as string} className="field-row">
                  <span className="field-label">{label as string}</span>
                  <span className={`badge ${hasData ? "badge-success" : "badge-neutral"}`}>
                    {hasData ? "✓ Connected" : "○ Not linked"}
                  </span>
                </div>
              ))}
              {p.identifiers?.length > 0 && (
                <>
                  <h4 className="section-title" style={{ marginTop: "var(--space-md)" }}>Identifiers</h4>
                  {p.identifiers.map((id: any, i: number) => (
                    <div key={i} className="field-row">
                      <span className="field-label">{id.identifier_type} {id.is_primary ? "★" : ""}</span>
                      <span className="field-value" style={{ fontFamily: "monospace" }}>{id.identifier_value}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* ──── Ownership ──── */}
        {activeTab === "ownership" && (
          <div>
            {data.ownership?.length > 0 ? (
              <div style={{ display: "grid", gap: "var(--space-md)" }}>
                {data.ownership.map((o: any, i: number) => (
                  <div key={i} className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{o.name}</div>
                        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>Father/Husband: {o.father_husband || "—"}</div>
                      </div>
                      <span className="badge badge-info">{o.owner_type || o.ownership_type}</span>
                    </div>
                    <div style={{ display: "flex", gap: "var(--space-lg)", marginTop: "var(--space-md)" }}>
                      <div><span className="field-label">Share</span><div className="field-value">{o.ownership_share ? `${(o.ownership_share * 100).toFixed(0)}%` : "—"}</div></div>
                      <div><span className="field-label">Type</span><div className="field-value">{o.ownership_type || "—"}</div></div>
                      <div><span className="field-label">Since</span><div className="field-value">{o.valid_from || "—"}</div></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card" style={{ textAlign: "center", padding: "var(--space-2xl)" }}>
                <div style={{ fontSize: 32 }}>👤</div>
                <p style={{ color: "var(--text-secondary)" }}>No ownership records linked to this parcel</p>
              </div>
            )}
          </div>
        )}

        {/* ──── RoR ──── */}
        {activeTab === "ror" && (
          <div className="card">
            {data.ror ? (
              <>
                <h3 className="card-title" style={{ marginBottom: "var(--space-md)" }}>Record of Rights</h3>
                {[
                  ["Khata Number", data.ror.khata_number],
                  ["Khesra Number", data.ror.khesra_number],
                  ["Classification", data.ror.land_classification],
                  ["Area", `${data.ror.area} ${data.ror.area_unit}`],
                  ["Revenue Amount", `₹${Number(data.ror.revenue_amount).toLocaleString()}`],
                  ["Source", data.ror.source_system],
                ].map(([l, v]) => (
                  <div key={l} className="field-row">
                    <span className="field-label">{l}</span>
                    <span className="field-value">{v || "—"}</span>
                  </div>
                ))}
                <div className="field-row">
                  <span className="field-label">Revenue Status</span>
                  <span className={`badge ${data.ror.revenue_status === "Paid" ? "badge-success" : "badge-error"}`}>
                    {data.ror.revenue_status}
                  </span>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "var(--space-2xl)" }}>
                <div style={{ fontSize: 32 }}>📜</div>
                <p style={{ color: "var(--text-secondary)" }}>No RoR records linked</p>
              </div>
            )}
          </div>
        )}

        {/* ──── Registration ──── */}
        {activeTab === "registration" && (
          <div>
            {data.registrations?.length > 0 ? (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Document No.</th>
                      <th>Seller</th>
                      <th>Buyer</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.registrations.map((r: any, i: number) => (
                      <tr key={i}>
                        <td>{r.registration_date || "—"}</td>
                        <td><span className="badge badge-info">{r.transaction_type}</span></td>
                        <td style={{ fontFamily: "monospace", fontSize: 12 }}>{r.document_number}</td>
                        <td>{r.seller_reference || "—"}</td>
                        <td>{r.buyer_reference || "—"}</td>
                        <td style={{ fontWeight: 600 }}>₹{Number(r.consideration_amount || 0).toLocaleString()}</td>
                        <td><span className="badge badge-success">{r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="card" style={{ textAlign: "center", padding: "var(--space-2xl)" }}>
                <div style={{ fontSize: 32 }}>📝</div>
                <p style={{ color: "var(--text-secondary)" }}>No registration records found</p>
              </div>
            )}
          </div>
        )}

        {/* ──── Encumbrance ──── */}
        {activeTab === "encumbrance" && (
          <div>
            {data.encumbrances?.length > 0 ? (
              <div style={{ display: "grid", gap: "var(--space-md)" }}>
                {data.encumbrances.map((e: any, i: number) => (
                  <div key={i} className="card" style={{ borderLeft: `3px solid ${e.status === "Active" ? "var(--status-error)" : "var(--status-success)"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-md)" }}>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{e.encumbrance_type}</span>
                      <span className={`badge ${e.status === "Active" ? "badge-error" : "badge-success"}`}>{e.status}</span>
                    </div>
                    {[
                      ["Institution", e.institution],
                      ["Reference", e.reference_number],
                      ["Amount", `₹${Number(e.amount || 0).toLocaleString()}`],
                      ["Outstanding", `₹${Number(e.outstanding || 0).toLocaleString()}`],
                      ["Interest Rate", e.interest_rate ? `${e.interest_rate}%` : "—"],
                      ["Start Date", e.start_date || "—"],
                      ["End Date", e.end_date || "—"],
                    ].map(([l, v]) => (
                      <div key={l} className="field-row">
                        <span className="field-label">{l}</span>
                        <span className="field-value">{v}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="card" style={{ textAlign: "center", padding: "var(--space-2xl)" }}>
                <div style={{ fontSize: 32 }}>✅</div>
                <p style={{ color: "var(--status-success)", fontWeight: 600 }}>No registered encumbrance found</p>
                <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>Based on integrated records from Registration Department</p>
              </div>
            )}
          </div>
        )}

        {/* ──── Building Permission ──── */}
        {activeTab === "building" && (
          <div>
            {data.building_permissions?.length > 0 ? (
              <div style={{ display: "grid", gap: "var(--space-md)" }}>
                {data.building_permissions.map((b: any, i: number) => (
                  <div key={i} className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-md)" }}>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{b.building_type}</span>
                      <span className={`badge ${b.status === "Approved" ? "badge-success" : b.status === "Rejected" ? "badge-error" : "badge-warning"}`}>{b.status}</span>
                    </div>
                    {[
                      ["Application No.", b.application_number],
                      ["Applicant", b.applicant || "—"],
                      ["Approved Area", `${b.approved_area || "—"} sqm`],
                      ["Floors", b.floors],
                      ["Application Date", b.application_date || "—"],
                      ["Approval Date", b.approval_date || "—"],
                    ].map(([l, v]) => (
                      <div key={l} className="field-row">
                        <span className="field-label">{l}</span>
                        <span className="field-value">{v}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="card" style={{ textAlign: "center", padding: "var(--space-2xl)" }}>
                <div style={{ fontSize: 32 }}>🏗️</div>
                <p style={{ color: "var(--text-secondary)" }}>No building permission records found</p>
              </div>
            )}
          </div>
        )}

        {/* ──── Land Use & Planning ──── */}
        {activeTab === "landuse" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: "var(--space-md)" }}>🌾 Land Use Zones</h3>
              {data.spatial?.land_use?.length > 0 ? (
                data.spatial.land_use.map((lu: any, i: number) => (
                  <div key={i} className="field-row">
                    <span className="field-label">Zone</span>
                    <span className="badge badge-info">{lu.zone_name}</span>
                  </div>
                ))
              ) : (
                <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>No land use classification data</p>
              )}
            </div>
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: "var(--space-md)" }}>📐 Master Plan Zones</h3>
              {data.spatial?.master_plan?.length > 0 ? (
                data.spatial.master_plan.map((mp: any, i: number) => (
                  <div key={i} style={{ marginBottom: "var(--space-sm)" }}>
                    <div className="field-row">
                      <span className="field-label">Zone</span>
                      <span className="badge badge-info">{mp.zone_name}</span>
                    </div>
                    {mp.permitted_use && (
                      <div className="field-row">
                        <span className="field-label">Permitted Use</span>
                        <span className="field-value">{mp.permitted_use}</span>
                      </div>
                    )}
                    {mp.max_far && (
                      <div className="field-row">
                        <span className="field-label">Max FAR</span>
                        <span className="field-value">{mp.max_far}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>No master plan data</p>
              )}
            </div>
          </div>
        )}

        {/* ──── Tax ──── */}
        {activeTab === "tax" && (
          <div>
            {data.tax?.length > 0 ? (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr><th>Year</th><th>Tax Amount</th><th>Paid</th><th>Due</th><th>Arrears</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {data.tax.map((t: any, i: number) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{t.assessment_year}</td>
                        <td>₹{Number(t.tax_amount || 0).toLocaleString()}</td>
                        <td>₹{Number(t.paid_amount || 0).toLocaleString()}</td>
                        <td style={{ color: Number(t.due_amount) > 0 ? "var(--status-error)" : "inherit" }}>₹{Number(t.due_amount || 0).toLocaleString()}</td>
                        <td>₹{Number(t.arrears || 0).toLocaleString()}</td>
                        <td><span className={`badge ${t.status === "Paid" ? "badge-success" : "badge-warning"}`}>{t.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="card" style={{ textAlign: "center", padding: "var(--space-2xl)" }}>
                <div style={{ fontSize: 32 }}>💰</div>
                <p style={{ color: "var(--text-secondary)" }}>No property tax records found</p>
              </div>
            )}
          </div>
        )}

        {/* ──── Restrictions ──── */}
        {activeTab === "restrictions" && (
          <div>
            {data.spatial?.restrictions?.length > 0 ? (
              <div style={{ display: "grid", gap: "var(--space-md)" }}>
                {data.spatial.restrictions.map((r: any, i: number) => (
                  <div key={i} className={`alert alert-${r.severity === "HIGH" || r.severity === "CRITICAL" ? "error" : "warning"}`}>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>{r.restriction_name}</div>
                      <div style={{ fontSize: 12, opacity: 0.9 }}>Type: {r.restriction_type} • Severity: {r.severity}</div>
                      {r.description && <div style={{ fontSize: 12, marginTop: 4 }}>{r.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card" style={{ textAlign: "center", padding: "var(--space-2xl)" }}>
                <div style={{ fontSize: 32 }}>✅</div>
                <p style={{ color: "var(--status-success)", fontWeight: 600 }}>No restrictions detected</p>
              </div>
            )}
            {data.disputes?.length > 0 && (
              <div style={{ marginTop: "var(--space-lg)" }}>
                <h3 className="section-title">Active Disputes</h3>
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Case No.</th><th>Type</th><th>Court</th><th>Status</th><th>Stay Order</th><th>Filing Date</th></tr></thead>
                    <tbody>
                      {data.disputes.map((d: any, i: number) => (
                        <tr key={i}>
                          <td style={{ fontFamily: "monospace" }}>{d.case_number}</td>
                          <td>{d.dispute_type}</td>
                          <td>{d.court}</td>
                          <td><span className="badge badge-warning">{d.status}</span></td>
                          <td>{d.stay_order ? "⚠️ Yes" : "No"}</td>
                          <td>{d.filing_date || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ──── Conflicts ──── */}
        {activeTab === "conflicts" && (
          <div>
            {data.conflicts?.length > 0 ? (
              <div style={{ display: "grid", gap: "var(--space-md)" }}>
                {data.conflicts.map((c: any, i: number) => (
                  <div key={i} className="card" style={{ borderLeft: `3px solid ${c.severity === "HIGH" ? "var(--status-error)" : "var(--status-warning)"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-sm)" }}>
                      <span style={{ fontWeight: 700 }}>{c.conflict_type}</span>
                      <span className={`badge ${c.resolved ? "badge-success" : "badge-error"}`}>{c.resolved ? "Resolved" : "Open"}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
                      <div className="card" style={{ padding: "var(--space-sm)", background: "var(--bg-elevated)" }}>
                        <div className="field-label">{c.source_a}</div>
                        <div className="field-value">{c.value_a}</div>
                      </div>
                      <div className="card" style={{ padding: "var(--space-sm)", background: "var(--bg-elevated)" }}>
                        <div className="field-label">{c.source_b}</div>
                        <div className="field-value">{c.value_b}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card" style={{ textAlign: "center", padding: "var(--space-2xl)" }}>
                <div style={{ fontSize: 32 }}>✅</div>
                <p style={{ color: "var(--status-success)", fontWeight: 600 }}>No data conflicts detected</p>
                <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>All department records are consistent for this parcel</p>
              </div>
            )}
          </div>
        )}

        {/* ──── Provenance ──── */}
        {activeTab === "provenance" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: "var(--space-md)" }}>Data Source</h3>
              {[
                ["Source System", data.provenance?.source],
                ["Data Type", data.provenance?.type],
              ].map(([l, v]) => (
                <div key={l} className="field-row">
                  <span className="field-label">{l}</span>
                  <span className="field-value">{v || "—"}</span>
                </div>
              ))}
              <div className="alert alert-info" style={{ marginTop: "var(--space-md)" }}>
                {data.provenance?.disclaimer}
              </div>
            </div>
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: "var(--space-md)" }}>Integration Matches</h3>
              {data.integration?.matches?.length > 0 ? (
                data.integration.matches.map((m: any, i: number) => (
                  <div key={i}>
                    {[
                      ["Source", m.source_system],
                      ["Match Method", m.match_method],
                      ["Score", `${m.match_score}%`],
                      ["Area Diff", m.area_diff_pct !== null ? `${m.area_diff_pct}%` : "—"],
                      ["Status", m.status],
                    ].map(([l, v]) => (
                      <div key={l} className="field-row">
                        <span className="field-label">{l}</span>
                        <span className="field-value">{v}</span>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>No integration match data available</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
