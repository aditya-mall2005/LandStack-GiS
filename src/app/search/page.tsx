"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

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

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
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

  return (
    <div className="app-content animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Search Land Records</h1>
          <p className="page-subtitle">Find parcels by ULPIN, Survey Number, Khesra, or Owner Name</p>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "var(--space-sm)", marginBottom: "var(--space-lg)" }}>
        <input
          className="input input-search"
          placeholder="Enter ULPIN, Survey No., Khesra, or Owner Name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      {/* Results */}
      {loading && (
        <div style={{ textAlign: "center", padding: "var(--space-2xl)", color: "var(--text-secondary)" }}>
          <div className="animate-pulse" style={{ fontSize: 20 }}>🔍</div>
          <p>Searching across all departments...</p>
        </div>
      )}

      {!loading && searched && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-md)" }}>
            <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              {results.length} result{results.length !== 1 ? "s" : ""} found for &ldquo;{initialQ}&rdquo;
            </span>
          </div>

          {results.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "var(--space-2xl)" }}>
              <div style={{ fontSize: 32, marginBottom: "var(--space-sm)" }}>🏜️</div>
              <p style={{ color: "var(--text-secondary)" }}>No parcels found matching your query</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "var(--space-md)" }}>
              {results.map((r) => (
                <div key={r.parcel_id} className="card card-clickable" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-accent)", fontFamily: "monospace" }}>
                        {r.ulpin}
                      </span>
                      <span className="badge badge-info">{r.match_type}</span>
                    </div>
                    <div style={{ display: "flex", gap: "var(--space-lg)", fontSize: 13, color: "var(--text-secondary)" }}>
                      <span>Survey: {r.survey_number}</span>
                      <span>Area: {Number(r.area).toLocaleString()} sqm</span>
                      {r.owner_name && <span>Owner: {r.owner_name}</span>}
                      <span>District: {r.district}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                    <span className="badge-land" style={{ background: LAND_TYPE_COLORS[r.land_type] || "#607D8B" }}>
                      {r.land_type}
                    </span>
                    <Link href={`/parcel/${r.parcel_id}`} className="btn btn-secondary btn-sm">
                      Land 360°
                    </Link>
                    <Link href={`/map?parcel=${r.parcel_id}&lat=${r.center.lat}&lng=${r.center.lng}`} className="btn btn-primary btn-sm">
                      View Map
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && !searched && (
        <div className="card" style={{ textAlign: "center", padding: "var(--space-2xl)" }}>
          <div style={{ fontSize: 40, marginBottom: "var(--space-md)" }}>🔍</div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: "var(--space-sm)" }}>Search Across All Departments</h3>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 400, margin: "0 auto" }}>
            Enter a ULPIN, survey number, khesra number, or owner name to find land records integrated from Revenue, Registration, Planning, and Municipal departments.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="app-content"><p>Loading...</p></div>}>
      <SearchContent />
    </Suspense>
  );
}
