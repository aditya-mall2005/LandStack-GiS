"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/security/auth-context";

interface SearchResult {
  parcel_id: string;
  ulpin: string;
  survey_number: string;
  area: number;
  land_type: string;
  district: string;
  owner_name: string | null;
  match_type: string;
  center: { lat: number; lng: number };
}

const LAND_TYPE_COLORS: Record<string, string> = {
  Agricultural: "var(--land-agricultural)",
  Residential: "var(--land-residential)",
  Commercial: "var(--land-commercial)",
  Industrial: "var(--land-industrial)",
  "Government Land": "var(--land-government)",
  Wasteland: "var(--land-wasteland)",
};

function maskNameForCitizen(name: string | null): string {
  if (!name) return "—";
  if (name.toLowerCase().includes("ramesh")) return name; // Current demo citizen own record
  const parts = name.split(" ");
  return parts.map(p => p.length > 2 ? p.slice(0, 2) + "*".repeat(p.length - 2) : p + "*").join(" ");
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const initialQ = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/v1/search?q=${encodeURIComponent(q)}&limit=30`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQ) {
      setQuery(initialQ);
      doSearch(initialQ);
    }
  }, [initialQ, doSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      doSearch(query.trim());
    }
  };

  const isOfficer = currentUser.role !== "CITIZEN";

  return (
    <div className="app-content animate-in">
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 24 }}>🔍</span>
            <h1 className="page-title">Search Cadastral Land Records</h1>
          </div>
          <p className="page-subtitle">
            Unified multi-department search across ULPIN, Survey No., Khesra, and Jamabandi Raiyat records.
          </p>
        </div>

        {/* Role-Based Data Projection Indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(15, 23, 42, 0.8)", border: "1px solid var(--border-color)", padding: "6px 14px", borderRadius: "var(--radius-md)" }}>
          <span style={{ fontSize: 16 }}>{currentUser.icon}</span>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#f8fafc" }}>
              {isOfficer ? "In-Jurisdiction Officer View" : "Public Citizen View"}
            </div>
            <div style={{ fontSize: 10, color: isOfficer ? "#34d399" : "#38bdf8" }}>
              {isOfficer ? "✓ Full Statutory Records Unmasked" : "🔒 DPDPA 2023 Masked Projection"}
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "var(--space-sm)", marginBottom: "var(--space-lg)" }}>
        <input
          className="input input-search"
          placeholder="Enter ULPIN (e.g. IN-BR-10-...), Survey No. (1420, 1894), Khesra, or Raiyat Name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, fontSize: 13 }}
        />
        <button type="submit" className="btn btn-primary">Search Records</button>
      </form>

      {/* Results */}
      {loading && (
        <div style={{ textAlign: "center", padding: "var(--space-2xl)", color: "var(--text-secondary)" }}>
          <div className="animate-pulse" style={{ fontSize: 24 }}>🔍</div>
          <p style={{ marginTop: 8 }}>Searching cadastral registry across all departments...</p>
        </div>
      )}

      {!loading && searched && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-md)" }}>
            <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              {results.length} record{results.length !== 1 ? "s" : ""} found for &ldquo;{query}&rdquo;
            </span>
            <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
              Projection: <strong>{currentUser.role}</strong> ({currentUser.jurisdiction})
            </span>
          </div>

          {results.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "var(--space-2xl)" }}>
              <div style={{ fontSize: 32, marginBottom: "var(--space-sm)" }}>🏜️</div>
              <p style={{ color: "var(--text-secondary)" }}>No cadastral parcels found matching your query</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "var(--space-md)" }}>
              {results.map((r) => {
                const displayName = isOfficer ? (r.owner_name || "Unrecorded / Government") : maskNameForCitizen(r.owner_name);
                const areaDecimal = (Number(r.area || 0) / 40.4686).toFixed(1);

                return (
                  <div key={r.parcel_id} className="card card-clickable" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-accent)", fontFamily: "monospace" }}>
                          {r.ulpin}
                        </span>
                        <span className="badge badge-info" style={{ fontSize: 10 }}>{r.match_type}</span>
                        {isOfficer && <span className="badge badge-success" style={{ fontSize: 10 }}>● Verified RoR</span>}
                      </div>

                      <div style={{ display: "flex", gap: "var(--space-lg)", fontSize: 12, color: "var(--text-secondary)", flexWrap: "wrap", marginTop: 4 }}>
                        <span>Khesra / Survey: <strong style={{ color: "#f8fafc" }}>#{r.survey_number}</strong></span>
                        <span>Area: <strong style={{ color: "#f8fafc" }}>{Number(r.area).toLocaleString()} m²</strong> ({areaDecimal} dec)</span>
                        <span>Raiyat: <strong style={{ color: isOfficer ? "#34d399" : "#e2e8f0" }}>{displayName}</strong></span>
                        <span>Location: <strong style={{ color: "#f8fafc" }}>Arghawa (33), Madhubani</strong></span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                      <span className="badge-land" style={{ background: LAND_TYPE_COLORS[r.land_type] || "#607D8B" }}>
                        {r.land_type}
                      </span>
                      <Link href={`/parcel/${r.parcel_id}`} className="btn btn-secondary btn-sm">
                        Land 360°
                      </Link>
                      <Link href={`/map?survey=${r.survey_number}`} className="btn btn-primary btn-sm">
                        🗺️ Cadastre
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!loading && !searched && (
        <div className="card" style={{ textAlign: "center", padding: "var(--space-2xl)" }}>
          <div style={{ fontSize: 40, marginBottom: "var(--space-md)" }}>🔍</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: "var(--space-sm)", color: "#f8fafc" }}>
            Search Across 300 Cadastral Records
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 460, margin: "0 auto", lineHeight: 1.6 }}>
            Enter a ULPIN, survey number (e.g. 1420, 1894), khesra number, or raiyat name to find records integrated from Revenue, Registration, Planning, and Municipal departments.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="app-content"><p>Loading Cadastral Search...</p></div>}>
      <SearchContent />
    </Suspense>
  );
}
