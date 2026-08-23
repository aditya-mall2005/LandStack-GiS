"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import apiClient from "@/lib/api-client";
import { useAuth } from "@/lib/security/auth-context";
import { Map as MapIcon, Search, Layers, Zap, Bell, User, X, Loader2, AlertCircle, TriangleAlert, AlertTriangle, Info, Download, HelpCircle, Clock, Hammer, Scale, FileWarning, Crosshair } from "lucide-react";

// Configure worker URL for Next.js Turbopack compatibility
if (typeof window !== "undefined") {
  if ((maplibregl as any).config) {
    (maplibregl as any).config.WORKER_URL = "/maplibre-gl-worker.mjs";
  }
}

const LAND_TYPE_COLORS: Record<string, string> = {
  Agricultural: "#16a34a",
  Residential: "#eab308",
  Commercial: "#ef4444",
  Industrial: "#a855f7",
  Forest: "#15803d",
  "Government Land": "#4f46e5",
  "Gair Mazarua (Govt)": "#4f46e5",
  "Water Body": "#0284c7",
  "Pond/Water Body": "#0284c7",
  Wasteland: "#71717a",
};

const BASEMAP_DEFINITIONS: Record<string, any> = {
  satellite: {
    version: 8,
    name: "Satellite",
    sources: {
      "esri-satellite": {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        ],
        tileSize: 256,
        attribution: "&copy; Esri, Maxar, Earthstar Geographics"
      }
    },
    layers: [
      {
        id: "base-tiles",
        type: "raster",
        source: "esri-satellite",
        minzoom: 0,
        maxzoom: 19
      }
    ]
  },
  dark: {
    version: 8,
    name: "Dark Matter",
    sources: {
      "carto-base": {
        type: "raster",
        tiles: [
          "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
          "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
          "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
          "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png"
        ],
        tileSize: 256,
        attribution: "&copy; OpenStreetMap contributors &copy; CARTO"
      }
    },
    layers: [
      {
        id: "base-tiles",
        type: "raster",
        source: "carto-base",
        minzoom: 0,
        maxzoom: 20
      }
    ]
  },
  voyager: {
    version: 8,
    name: "Streets",
    sources: {
      "osm-base": {
        type: "raster",
        tiles: [
          "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
        ],
        tileSize: 256,
        attribution: "&copy; OpenStreetMap contributors"
      }
    },
    layers: [
      {
        id: "base-tiles",
        type: "raster",
        source: "osm-base",
        minzoom: 0,
        maxzoom: 19
      }
    ]
  }
};

const BASE_LAYERS_CONFIG = [
  { id: "parcels", label: "Cadastral Parcels", defaultChecked: true },
  { id: "roads", label: "Roads", defaultChecked: false },
  { id: "satellite-layer", label: "Satellite Imagery", defaultChecked: true },
  { id: "village-boundary", label: "Village Boundary", defaultChecked: false },
];

const GOVERNANCE_LAYERS_CONFIG = [
  { id: "land-use", label: "Land Use Zones", defaultChecked: true, color: "#FFA726" },
  { id: "master-plan", label: "Master Plan", defaultChecked: false, color: "#AB47BC" },
  { id: "building-permits", label: "Building Permits", defaultChecked: false, color: "#38BDF8" },
  { id: "encumbrance", label: "Encumbrance", defaultChecked: false, color: "#F43F5E" },
  { id: "disputes", label: "Disputes", defaultChecked: false, color: "#EF4444" },
  { id: "property-tax", label: "Property Tax", defaultChecked: false, color: "#10B981" },
  { id: "utilities", label: "Utilities", defaultChecked: false, color: "#6366F1" },
];

const ISSUE_STATS = [
  { id: "OWNERSHIP_CONFLICT", label: "Ownership Conflict", count: 4, icon: <AlertCircle size={12} />, color: "#ef4444" },
  { id: "ENCROACHMENT", label: "Encroachment", count: 3, icon: <AlertTriangle size={12} />, color: "#f97316" },
  { id: "UNREGISTERED_LAND", label: "Unregistered Land", count: 2, icon: <Info size={12} />, color: "#eab308" },
  { id: "LAND_USE_VIOLATION", label: "Land Use Violation", count: 1, icon: <HelpCircle size={12} />, color: "#a855f7" },
  { id: "TAX_PENDING", label: "Tax Pending", count: 1, icon: <Clock size={12} />, color: "#3b82f6" },
];

function createConflictStripeImage(): ImageData | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.strokeStyle = "rgba(239, 68, 68, 0.75)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 16);
  ctx.lineTo(16, 0);
  ctx.moveTo(-4, 4);
  ctx.lineTo(4, -4);
  ctx.moveTo(12, 20);
  ctx.lineTo(20, 12);
  ctx.stroke();
  return ctx.getImageData(0, 0, 16, 16);
}

function MapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const cachedGeoJson = useRef<any>(null);

  // States
  const [selectedParcel, setSelectedParcel] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "ownership" | "documents" | "history">("overview");
  const [showLayers, setShowLayers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedIssueFilter, setSelectedIssueFilter] = useState<string | null>(null);
  const [activeBaseLayers, setActiveBaseLayers] = useState<Record<string, boolean>>({
    parcels: true,
    roads: false,
    "satellite-layer": true,
    "village-boundary": false,
  });
  const [activeGovLayers, setActiveGovLayers] = useState<Record<string, boolean>>({
    "land-use": true,
    "master-plan": false,
    "building-permits": false,
    encumbrance: false,
    disputes: false,
    "property-tax": false,
    utilities: false,
  });

  const selectedParcelRef = useRef(selectedParcel);
  useEffect(() => {
    selectedParcelRef.current = selectedParcel;
  }, [selectedParcel]);

  const inspectParcel = useCallback(async (parcelId: string) => {
    const map = mapRef.current;
    if (map && map.getLayer("parcels-highlight")) {
      map.setFilter("parcels-highlight", ["==", "parcel_id", parcelId]);
    }
    setLoading(true);
    setActiveTab("overview");
    try {
      const res = await apiClient.get(`/api/parcels/${parcelId}`);
      setSelectedParcel(res.data);
    } catch (err) {
      console.error("Error inspecting parcel:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add issue markers on map canvas
  const renderIssueMarkers = useCallback((map: maplibregl.Map, features: any[]) => {
    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    features.forEach((f) => {
      const p = f.properties;
      if (!p.issue_type) return;
      if (selectedIssueFilter && p.issue_type !== selectedIssueFilter) return;

      const coords = p.centroid || f.geometry?.coordinates?.[0]?.[0];
      if (!coords || !Array.isArray(coords)) return;

      const el = document.createElement("div");
      el.className = "map-issue-marker-container";
      
      const dot = document.createElement("div");
      dot.className = "map-issue-marker";
      dot.style.width = "26px";
      dot.style.height = "26px";
      dot.style.borderRadius = "50%";
      dot.style.background = p.issue_color || "#ef4444";
      dot.style.border = "2px solid #ffffff";
      dot.style.boxShadow = `0 0 12px ${p.issue_color || "#ef4444"}`;
      dot.style.display = "flex";
      dot.style.alignItems = "center";
      dot.style.justifyContent = "center";
      dot.style.cursor = "pointer";
      dot.style.fontSize = "13px";
      dot.style.transition = "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)";
      let iconSvg = "";
      if (p.issue_type === "OWNERSHIP_CONFLICT") {
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
      } else if (p.issue_type === "DISPUTE") {
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
      } else if (p.issue_type === "BUILDING_WITHOUT_PERMIT") {
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
      } else if (p.issue_type === "TAX_PENDING") {
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
      } else {
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
      }
      dot.innerHTML = iconSvg;
      dot.style.color = "#ffffff";

      el.appendChild(dot);

      el.addEventListener("mouseenter", () => {
        dot.style.transform = "scale(1.35)";
      });
      el.addEventListener("mouseleave", () => {
        dot.style.transform = "scale(1)";
      });
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        inspectParcel(p.parcel_id);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(coords as [number, number])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [selectedIssueFilter, inspectParcel]);

  const setupParcelLayers = useCallback((map: maplibregl.Map, initialData?: any) => {
    if (!map) return;

    // Add conflict stripe pattern image
    const stripeImg = createConflictStripeImage();
    if (stripeImg && !map.hasImage("conflict-stripe-pattern")) {
      map.addImage("conflict-stripe-pattern", stripeImg);
    }

    if (!map.getSource("parcels")) {
      map.addSource("parcels", {
        type: "geojson",
        data: initialData || { type: "FeatureCollection", features: [] },
      });
    } else if (initialData) {
      (map.getSource("parcels") as maplibregl.GeoJSONSource).setData(initialData);
    }

    const parcelsVisible = activeBaseLayers.parcels ? "visible" : "none";

    // 1. Base Fill Layer
    if (!map.getLayer("parcels-fill")) {
      map.addLayer({
        id: "parcels-fill",
        type: "fill",
        source: "parcels",
        layout: { visibility: parcelsVisible },
        paint: {
          "fill-color": [
            "match", ["get", "land_type"],
            "Agricultural", LAND_TYPE_COLORS.Agricultural,
            "Residential", LAND_TYPE_COLORS.Residential,
            "Commercial", LAND_TYPE_COLORS.Commercial,
            "Industrial", LAND_TYPE_COLORS.Industrial,
            "Forest", LAND_TYPE_COLORS.Forest,
            "Government Land", LAND_TYPE_COLORS["Government Land"],
            "Gair Mazarua (Govt)", LAND_TYPE_COLORS["Government Land"],
            "Water Body", LAND_TYPE_COLORS["Water Body"],
            "Pond/Water Body", LAND_TYPE_COLORS["Water Body"],
            "Wasteland", LAND_TYPE_COLORS.Wasteland,
            "#64748b"
          ],
          "fill-opacity": 0.1,
        },
      });
    }

    // 2. Conflict Hatch Layer (Striped pattern on conflicting parcels)
    if (!map.getLayer("parcels-conflict-hatch")) {
      map.addLayer({
        id: "parcels-conflict-hatch",
        type: "fill",
        source: "parcels",
        layout: { visibility: parcelsVisible },
        filter: ["==", ["get", "has_conflict"], true],
        paint: {
          "fill-pattern": "conflict-stripe-pattern",
          "fill-opacity": 0.85,
        },
      });
    }

    // 3. Thin White Outline Layer
    if (!map.getLayer("parcels-outline")) {
      map.addLayer({
        id: "parcels-outline",
        type: "line",
        source: "parcels",
        layout: { visibility: parcelsVisible },
        paint: {
          "line-color": "#ffffff",
          "line-width": 1.2,
          "line-opacity": 0.75,
        },
      });
    }

    // 4. Highlighted Selected Parcel Outline (Glowing Yellow)
    if (!map.getLayer("parcels-highlight")) {
      map.addLayer({
        id: "parcels-highlight",
        type: "line",
        source: "parcels",
        layout: { visibility: parcelsVisible },
        paint: {
          "line-color": "#facc15",
          "line-width": 3.5,
          "line-opacity": 1,
        },
        filter: ["==", "parcel_id", selectedParcelRef.current?.parcel?.parcel_id || ""],
      });
    }

    // 5. Parcel Text Labels (P-1021, P-1033, etc.)
    if (!map.getLayer("parcels-labels")) {
      map.addLayer({
        id: "parcels-labels",
        type: "symbol",
        source: "parcels",
        minzoom: 14.5,
        layout: {
          visibility: parcelsVisible,
          "text-field": ["get", "display_label"],
          "text-size": 11,
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-anchor": "center",
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "#090d16",
          "text-halo-width": 2,
        },
      });
    }

    // Interactive Hover Tooltip
    (map as any).off("mousemove", "parcels-fill");
    (map as any).on("mousemove", "parcels-fill", (e: any) => {
      map.getCanvas().style.cursor = "pointer";
      const f = e.features?.[0];
      if (!f) return;
      const pr = f.properties || {};
      if (popupRef.current) popupRef.current.remove();
      popupRef.current = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12 })
        .setLngLat(e.lngLat)
        .setHTML(`
          <div style="font-family:Inter,sans-serif;font-size:12px;line-height:1.5;padding:4px 8px;background:var(--bg-card);color:var(--text-primary);border-radius:6px;box-shadow:var(--shadow-md);border:1px solid var(--border-default)">
            <div style="font-weight:700;color:var(--text-accent);font-family:monospace;font-size:11px">${pr.ulpin || pr.display_label || ""}</div>
            <div style="color:var(--text-primary);font-size:11px">Survey: <strong>${pr.survey_number || "—"}</strong></div>
            <div style="color:var(--text-secondary);font-size:10px">Area: ${(Number(pr.area || 0) / 4046.86).toFixed(2)} Acre (${Number(pr.area || 0).toFixed(0)} sq.m.)</div>
            <div style="display:inline-block;padding:2px 8px;border-radius:12px;background:${LAND_TYPE_COLORS[pr.land_type] || "#3b82f6"}22;color:${LAND_TYPE_COLORS[pr.land_type] || "#3b82f6"};border:1px solid ${LAND_TYPE_COLORS[pr.land_type] || "#3b82f6"}66;font-size:10px;margin-top:4px;font-weight:600">${pr.land_type || "Land"}</div>
            ${pr.has_conflict ? '<div style="color:var(--status-error);font-size:10px;margin-top:4px;font-weight:700">⚠️ Active Conflict / Dispute</div>' : ''}
          </div>
        `)
        .addTo(map);
    });

    (map as any).off("mouseleave", "parcels-fill");
    (map as any).on("mouseleave", "parcels-fill", () => {
      map.getCanvas().style.cursor = "";
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
    });

    // Click Handler
    (map as any).off("click", "parcels-fill");
    (map as any).on("click", "parcels-fill", (e: any) => {
      const f = e.features?.[0];
      if (!f?.properties?.parcel_id) return;
      inspectParcel(f.properties.parcel_id);
    });
  }, [activeBaseLayers.parcels, inspectParcel]);

  const loadParcels = useCallback(async (map: maplibregl.Map) => {
    try {
      let geojson = cachedGeoJson.current;
      if (!geojson) {
        const res = await apiClient.get("/api/parcels?limit=1000");
        geojson = res.data;
        cachedGeoJson.current = geojson;
      }
      setupParcelLayers(map, geojson);
      renderIssueMarkers(map, geojson.features || []);

      // Auto-select plot 1051 or first plot if none selected
      if (!selectedParcelRef.current && geojson.features?.length > 0) {
        const target = geojson.features.find((f: any) => String(f.properties?.survey_number) === "1051") || geojson.features[0];
        if (target) {
          inspectParcel(target.properties.parcel_id);
        }
      }
      return geojson;
    } catch (err) {
      console.error("Failed to load parcels:", err);
      return null;
    }
  }, [setupParcelLayers, renderIssueMarkers, inspectParcel]);

  // Search handler
  const handleSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    try {
      const res = await apiClient.get(`/api/v1/search?q=${encodeURIComponent(q)}&limit=8`);
      setSearchResults(res.data.results || []);
      setShowSearchDropdown(true);
    } catch {
      setSearchResults([]);
    }
  }, []);

  const flyToSearchResult = (r: any) => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center: [r.center.lng, r.center.lat], zoom: 17, duration: 1200 });
    setShowSearchDropdown(false);
    setSearchQuery("");
    inspectParcel(r.parcel_id);
  };

  // Map initialization
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: BASEMAP_DEFINITIONS.satellite,
      center: [86.120, 26.360],
      zoom: 15.2,
      pitch: 0,
      bearing: 0,
    });

    map.on("load", async () => {
      await loadParcels(map);

      // Check URL parameters
      const paramParcel = searchParams.get("parcel");
      const paramLat = searchParams.get("lat");
      const paramLng = searchParams.get("lng");
      if (paramParcel && paramLat && paramLng) {
        map.flyTo({ center: [parseFloat(paramLng), parseFloat(paramLat)], zoom: 17 });
        inspectParcel(paramParcel);
      }
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [loadParcels, searchParams, inspectParcel]);

  // Update issue markers when filter changes
  useEffect(() => {
    const map = mapRef.current;
    if (map && cachedGeoJson.current) {
      renderIssueMarkers(map, cachedGeoJson.current.features || []);
    }
  }, [selectedIssueFilter, renderIssueMarkers]);

  // Selected Parcel fields
  const p = selectedParcel?.parcel;
  const ownership = selectedParcel?.ownership?.[0];
  const conflicts = selectedParcel?.conflicts || [];
  const disputes = selectedParcel?.disputes || [];
  const tax = selectedParcel?.tax?.[0];
  const buildingPerms = selectedParcel?.building_permissions?.[0];

  const areaAcres = p?.area ? (Number(p.area) / 4046.86).toFixed(2) : "0.48";
  const areaSqm = p?.area ? Number(p.area).toFixed(2) : "1941.00";
  const coordsText = p?.centroid_lat ? `${Number(p.centroid_lat).toFixed(4)}, ${Number(p.centroid_lng).toFixed(4)}` : "25.6245, 85.1378";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100%", background: "var(--bg-app)", color: "var(--text-primary)", overflow: "hidden", fontFamily: "Inter, -apple-system, sans-serif" }}>
      {/* 1. Top Bar Header */}
      <header style={{ height: 60, background: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(8px)", borderBottom: "1px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", zIndex: 30 }}>
        {/* Left: Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 220 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--brand-primary)", lineHeight: 1.1 }}>SIH 2026</div>
            <div style={{ fontSize: 10, color: "var(--text-secondary)", letterSpacing: "0.02em" }}>Integrated Land Governance</div>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div style={{ flex: 1, maxWidth: 480, position: "relative", margin: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", background: "rgba(0, 0, 0, 0.04)", border: "1px solid rgba(0, 0, 0, 0.08)", borderRadius: 8, padding: "7px 12px", gap: 8 }}>
            <span style={{ color: "#64748b", display: "flex" }}><Search size={14} /></span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              placeholder="Search ULPIN, Survey No., Owner Name, Location..."
              style={{ background: "transparent", border: "none", outline: "none", color: "var(--text-primary)", fontSize: 12, width: "100%" }}
            />
          </div>

          {/* Search Dropdown */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: "#0f172a", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: 8, overflow: "hidden", zIndex: 100, boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}>
              {searchResults.map((r) => (
                <div
                  key={r.parcel_id}
                  onClick={() => flyToSearchResult(r)}
                  style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#38bdf8" }}>{r.ulpin}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>Survey #{r.survey_number} • {r.owner_name || "Bihar Land"}</div>
                  </div>
                  <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: (LAND_TYPE_COLORS[r.land_type] || "#3b82f6") + "33", color: LAND_TYPE_COLORS[r.land_type] || "#38bdf8" }}>
                    {r.land_type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Quick Action Controls & User */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setShowLayers(!showLayers)}
            style={{ background: showLayers ? "var(--brand-primary)" : "rgba(0, 0, 0, 0.04)", border: showLayers ? "1px solid var(--brand-primary)" : "1px solid rgba(0, 0, 0, 0.1)", color: showLayers ? "#fff" : "var(--text-primary)", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
          >
            <Layers size={14} /> Layers
          </button>

          <button
            onClick={() => router.push("/officer/conflicts")}
            style={{ background: "rgba(0, 0, 0, 0.04)", border: "1px solid rgba(0, 0, 0, 0.1)", color: "var(--text-primary)", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
          >
            <Zap size={14} /> Filter
          </button>

          <Link href="/admin/intelligence" style={{ textDecoration: "none" }}>
            <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#059669", padding: "6px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
              <span>AI Insights</span>
              <span style={{ background: "#10b981", color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>8</span>
            </div>
          </Link>

          <div style={{ position: "relative", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <Bell size={18} color="var(--text-secondary)" />
            <span style={{ position: "absolute", top: -4, right: -6, background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 800, padding: "1px 4px", borderRadius: 8 }}>12</span>
          </div>

          <Link href="/login" style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0, 0, 0, 0.04)", border: "1px solid rgba(0, 0, 0, 0.1)", borderRadius: 6, padding: "5px 10px", color: "var(--text-primary)", fontSize: 12 }}>
              <User size={14} />
              <span style={{ fontWeight: 600 }}>{currentUser?.title?.split(" ")[0] || "Officer"}</span>
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>▾</span>
            </div>
          </Link>
        </div>
      </header>

      {/* Main Map Body Container */}
      <div style={{ display: "flex", flex: 1, position: "relative", overflow: "hidden" }}>
        {/* 2. Left Sidebar: LAYER CONTROL */}
        {showLayers && (
          <aside style={{ width: 250, background: "rgba(255, 255, 255, 0.96)", borderRight: "1px solid var(--border-default)", backdropFilter: "blur(16px)", zIndex: 20, display: "flex", flexDirection: "column", overflowY: "auto" }}>
            <div style={{ padding: "12px 14px 8px", borderBottom: "1px solid var(--border-default)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: "var(--text-secondary)", textTransform: "uppercase" }}>LAYER CONTROL</span>
              <button onClick={() => setShowLayers(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12 }}><X size={14} /></button>
            </div>

            {/* Base Layers */}
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-default)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>BASE LAYERS</div>
              {BASE_LAYERS_CONFIG.map((layer) => (
                <label key={layer.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", cursor: "pointer", fontSize: 12, color: activeBaseLayers[layer.id] ? "var(--text-primary)" : "var(--text-secondary)" }}>
                  <input
                    type="checkbox"
                    checked={Boolean(activeBaseLayers[layer.id])}
                    onChange={(e) => {
                      const updated = { ...activeBaseLayers, [layer.id]: e.target.checked };
                      setActiveBaseLayers(updated);
                      if (layer.id === "parcels" && mapRef.current) {
                        const vis = e.target.checked ? "visible" : "none";
                        ["parcels-fill", "parcels-conflict-hatch", "parcels-outline", "parcels-labels", "parcels-highlight"].forEach((lyr) => {
                          if (mapRef.current?.getLayer(lyr)) mapRef.current.setLayoutProperty(lyr, "visibility", vis);
                        });
                      }
                    }}
                    style={{ accentColor: "#10b981", cursor: "pointer" }}
                  />
                  <span>{layer.label}</span>
                </label>
              ))}
            </div>

            {/* Governance Layers */}
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-default)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>GOVERNANCE LAYERS</div>
              {GOVERNANCE_LAYERS_CONFIG.map((layer) => (
                <label key={layer.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", cursor: "pointer", fontSize: 12, color: activeGovLayers[layer.id] ? "var(--text-primary)" : "var(--text-secondary)" }}>
                  <input
                    type="checkbox"
                    checked={Boolean(activeGovLayers[layer.id])}
                    onChange={(e) => setActiveGovLayers({ ...activeGovLayers, [layer.id]: e.target.checked })}
                    style={{ accentColor: "#10b981", cursor: "pointer" }}
                  />
                  <span>{layer.label}</span>
                </label>
              ))}
            </div>

            {/* Land Classification Legend */}
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-default)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>LAND CLASSIFICATION</div>
              {[
                { label: "Agricultural", color: LAND_TYPE_COLORS.Agricultural },
                { label: "Residential", color: LAND_TYPE_COLORS.Residential },
                { label: "Commercial", color: LAND_TYPE_COLORS.Commercial },
                { label: "Industrial", color: LAND_TYPE_COLORS.Industrial },
                { label: "Forest", color: LAND_TYPE_COLORS.Forest },
                { label: "Government Land", color: LAND_TYPE_COLORS["Government Land"] },
                { label: "Water Body", color: LAND_TYPE_COLORS["Water Body"] },
                { label: "Wasteland", color: LAND_TYPE_COLORS.Wasteland },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 0", fontSize: 11, color: "var(--text-secondary)" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: item.color }} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            {/* Issues / Alerts Legend */}
            <div style={{ padding: "10px 14px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>ISSUES / ALERTS</div>
              {[
                { icon: <AlertCircle size={12} color="#ef4444" />, label: "Ownership Conflict" },
                { icon: <AlertTriangle size={12} color="#f97316" />, label: "Encroachment" },
                { icon: <Info size={12} color="#eab308" />, label: "Unregistered Land" },
                { icon: <Clock size={12} color="#3b82f6" />, label: "Tax Pending" },
                { icon: <Hammer size={12} color="#a855f7" />, label: "Building Without Permit" },
                { icon: <Scale size={12} color="#6366f1" />, label: "Land Use Violation" },
                { icon: <FileWarning size={12} color="#ec4899" />, label: "Dispute Exists" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 0", fontSize: 11, color: "var(--text-secondary)" }}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            {/* Bottom Collapse */}
            <div style={{ marginTop: "auto", padding: "10px 14px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", fontSize: 11, color: "#64748b", display: "flex", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setShowLayers(false)}>
              <span>Legend</span>
              <span>›</span>
            </div>
          </aside>
        )}

        {/* 3. Central Map Canvas with Floating Overlays */}
        <div style={{ flex: 1, position: "relative", height: "100%" }}>
          {/* Top Floating Issues Filter Pill Bar */}
          <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 15, display: "flex", alignItems: "center", background: "rgba(255, 255, 255, 0.95)", border: "1px solid var(--border-default)", borderRadius: 30, padding: "6px 14px", gap: 12, backdropFilter: "blur(12px)", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginRight: 4 }}>Show Issues</span>
            {ISSUE_STATS.map((stat) => (
              <button
                key={stat.id}
                onClick={() => setSelectedIssueFilter(selectedIssueFilter === stat.id ? null : stat.id)}
                style={{
                  background: selectedIssueFilter === stat.id ? stat.color + "1A" : "transparent",
                  border: selectedIssueFilter === stat.id ? `1px solid ${stat.color}` : "1px solid rgba(0,0,0,0.1)",
                  borderRadius: 16,
                  padding: "4px 10px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                  color: selectedIssueFilter === stat.id ? stat.color : "var(--text-primary)",
                  transition: "all 0.15s ease",
                }}
                title={`Filter by ${stat.label}`}
              >
                <span style={{ color: stat.color, display: "flex" }}>{stat.icon}</span>
                <span>{stat.count}</span>
              </button>
            ))}
          </div>

          {/* MapLibre Canvas Container */}
          <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />

          {/* Bottom Center Floating Classification Legend */}
          <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", zIndex: 15, display: "flex", alignItems: "center", background: "rgba(255, 255, 255, 0.95)", border: "1px solid var(--border-default)", borderRadius: 8, padding: "6px 14px", gap: 14, backdropFilter: "blur(12px)", boxShadow: "var(--shadow-lg)" }}>
            {[
              { label: "Agricultural", color: LAND_TYPE_COLORS.Agricultural },
              { label: "Residential", color: LAND_TYPE_COLORS.Residential },
              { label: "Commercial", color: LAND_TYPE_COLORS.Commercial },
              { label: "Government Land", color: LAND_TYPE_COLORS["Government Land"] },
              { label: "Forest", color: LAND_TYPE_COLORS.Forest },
              { label: "Water Body", color: LAND_TYPE_COLORS["Water Body"] },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-primary)", fontWeight: 500 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: item.color }} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Bottom Left Floating Zoom & Target Controls */}
          <div style={{ position: "absolute", bottom: 20, left: 16, zIndex: 15, display: "flex", flexDirection: "column", gap: 6 }}>
            <button
              onClick={() => mapRef.current?.zoomIn()}
              style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(255, 255, 255, 0.95)", border: "1px solid var(--border-default)", color: "var(--text-primary)", fontSize: 18, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "var(--shadow-md)" }}
            >
              +
            </button>
            <button
              onClick={() => mapRef.current?.zoomOut()}
              style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(255, 255, 255, 0.95)", border: "1px solid var(--border-default)", color: "var(--text-primary)", fontSize: 18, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "var(--shadow-md)" }}
            >
              −
            </button>
            <button
              onClick={() => mapRef.current?.flyTo({ center: [86.120, 26.360], zoom: 15.2 })}
              style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(255, 255, 255, 0.95)", border: "1px solid var(--border-default)", color: "var(--text-primary)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "var(--shadow-md)" }}
              title="Reset center"
            >
              <Crosshair size={16} />
            </button>
          </div>

          {/* Bottom Right Scale Indicator */}
          <div style={{ position: "absolute", bottom: 20, right: 16, zIndex: 15, background: "rgba(255, 255, 255, 0.95)", border: "1px solid var(--border-default)", borderRadius: 4, padding: "4px 8px", fontSize: 10, color: "var(--text-primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, boxShadow: "var(--shadow-sm)" }}>
            <span style={{ borderBottom: "2px solid var(--text-primary)", width: 30, display: "inline-block", height: 2 }}></span>
            <span>100 m</span>
          </div>
        </div>

        {/* 4. Right Slide-Out Panel: PARCEL DETAILS */}
        {(selectedParcel || loading) && (
          <aside style={{ width: 350, background: "var(--bg-app)", borderLeft: "1px solid var(--border-default)", backdropFilter: "blur(16px)", zIndex: 25, display: "flex", flexDirection: "column", overflowY: "auto", boxShadow: "var(--shadow-lg)" }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)", margin: "auto" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                  <Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: "var(--brand-primary)" }} />
                </div>
                <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600 }}>Loading Parcel Details...</div>
              </div>
            ) : selectedParcel ? (
              <>
                {/* Header */}
                <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid var(--border-default)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: "var(--text-primary)", textTransform: "uppercase" }}>PARCEL DETAILS</span>
                    <button
                      onClick={() => {
                        setSelectedParcel(null);
                        mapRef.current?.setFilter("parcels-highlight", ["==", "parcel_id", ""]);
                      }}
                      style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: 14 }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Top Metadata Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 8, background: "var(--bg-card)", padding: 10, borderRadius: 8, border: "1px solid var(--border-default)" }}>
                    <div>
                      <div style={{ fontSize: 9, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>ULPIN</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--brand-primary)", fontFamily: "monospace" }}>{p?.ulpin || "IN-BR-PTN-0001051"}</div>
                      <div style={{ fontSize: 9, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 6 }}>Area</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)" }}>{areaAcres} Acre | {areaSqm} sq.m.</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Survey No.</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-primary)" }}>{p?.survey_number || "1051"}</div>
                      <div style={{ fontSize: 9, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 6 }}>Village</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)" }}>Sarai Chak</div>
                    </div>
                  </div>
                </div>

                {/* Tabs Bar */}
                <div style={{ display: "flex", borderBottom: "1px solid var(--border-default)", padding: "0 16px" }}>
                  {(["overview", "ownership", "documents", "history"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        background: "transparent",
                        border: "none",
                        borderBottom: activeTab === tab ? "2px solid var(--brand-primary)" : "2px solid transparent",
                        color: activeTab === tab ? "var(--brand-primary)" : "var(--text-secondary)",
                        padding: "8px 10px",
                        fontSize: 11,
                        fontWeight: activeTab === tab ? 700 : 500,
                        cursor: "pointer",
                        textTransform: "capitalize",
                        marginRight: 4,
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Tab Content Body */}
                <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14, flex: 1, overflowY: "auto" }}>
                  {activeTab === "overview" && (
                    <>
                      {/* Properties Grid */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--border-default)" }}>
                          <span style={{ color: "var(--text-secondary)" }}>Land Use</span>
                          <span style={{ fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: LAND_TYPE_COLORS[p?.land_type] || "#eab308" }}></span>
                            {p?.land_type || "Residential"}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--border-default)" }}>
                          <span style={{ color: "var(--text-secondary)" }}>Zoning</span>
                          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Residential Zone (R2)</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--border-default)" }}>
                          <span style={{ color: "var(--text-secondary)" }}>Revenue Circle</span>
                          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Patna Sadar</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--border-default)" }}>
                          <span style={{ color: "var(--text-secondary)" }}>Ward No.</span>
                          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>14</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                          <span style={{ color: "var(--text-secondary)" }}>Coordinates</span>
                          <span style={{ fontWeight: 600, color: "var(--text-primary)", fontFamily: "monospace" }}>{coordsText}</span>
                        </div>
                      </div>

                      {/* Ownership Status Card */}
                      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: 8, padding: 12, boxShadow: "var(--shadow-sm)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-secondary)", letterSpacing: "0.06em" }}>OWNERSHIP STATUS</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color: "#10b981", background: "rgba(16, 185, 129, 0.15)", padding: "2px 6px", borderRadius: 4 }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Verified
                          </span>
                        </div>
                        <div style={{ fontSize: 11, display: "flex", flexDirection: "column", gap: 5 }}>
                          <div><span style={{ color: "var(--text-secondary)" }}>Owner(s):</span> <strong style={{ color: "var(--text-primary)" }}>{ownership?.name || "Rahul Kumar Singh"}</strong></div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span><span style={{ color: "var(--text-secondary)" }}>Ownership Type:</span> {ownership?.ownership_type || "Individual"}</span>
                            <span><span style={{ color: "var(--text-secondary)" }}>Share:</span> {ownership?.ownership_share || "100%"}</span>
                          </div>
                          <div><span style={{ color: "var(--text-secondary)" }}>RoR Status:</span> <strong style={{ color: "#10b981" }}>Available</strong></div>
                        </div>
                      </div>

                      {/* Conflicting Claims Card */}
                      <div style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 8, padding: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-secondary)", letterSpacing: "0.06em" }}>CONFLICTING CLAIMS</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color: "#ef4444" }}>
                            <TriangleAlert size={12} strokeWidth={2.5} /> Conflict Detected
                          </span>
                        </div>
                        <div style={{ fontSize: 11, display: "flex", flexDirection: "column", gap: 5 }}>
                          <div><span style={{ color: "var(--text-secondary)" }}>Claimant:</span> <strong style={{ color: "var(--text-primary)" }}>Suresh Prasad</strong></div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span><span style={{ color: "var(--text-secondary)" }}>Claim Type:</span> Sale Deed (Unregistered)</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span><span style={{ color: "var(--text-secondary)" }}>Claim Area:</span> 0.48 Acre</span>
                            <span><span style={{ color: "var(--text-secondary)" }}>Documents:</span> 1 (Unverified)</span>
                          </div>
                        </div>
                      </div>

                      {/* Active Issues List */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-secondary)", letterSpacing: "0.06em" }}>ACTIVE ISSUES</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-card)", padding: "6px 10px", borderRadius: 6, fontSize: 11, border: "1px solid var(--border-default)", boxShadow: "var(--shadow-sm)" }}>
                          <AlertCircle size={16} color="#ef4444" />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>Ownership Conflict</div>
                            <div style={{ fontSize: 9, color: "var(--text-secondary)" }}>Raised on 12 May 2025</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-card)", padding: "6px 10px", borderRadius: 6, fontSize: 11, border: "1px solid var(--border-default)", boxShadow: "var(--shadow-sm)" }}>
                          <TriangleAlert size={16} color="#f97316" />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>Encroachment Detected</div>
                            <div style={{ fontSize: 9, color: "var(--text-secondary)" }}>Raised on 02 Jun 2025</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-card)", padding: "6px 10px", borderRadius: 6, fontSize: 11, border: "1px solid var(--border-default)", boxShadow: "var(--shadow-sm)" }}>
                          <AlertTriangle size={16} color="#eab308" />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>Building Without Permit</div>
                            <div style={{ fontSize: 9, color: "var(--text-secondary)" }}>Raised on 18 Mar 2025</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-card)", padding: "6px 10px", borderRadius: 6, fontSize: 11, border: "1px solid var(--border-default)", boxShadow: "var(--shadow-sm)" }}>
                          <Info size={16} color="#3b82f6" />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>Tax Pending</div>
                            <div style={{ fontSize: 9, color: "var(--text-secondary)" }}>Due: ₹12,450</div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === "ownership" && (
                    <div style={{ fontSize: 11, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", padding: 10, borderRadius: 6, boxShadow: "var(--shadow-sm)" }}>
                        <div style={{ color: "var(--text-secondary)", fontSize: 10 }}>Primary Raiyat / Owner</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-primary)", marginTop: 2 }}>{ownership?.name || "Rahul Kumar Singh"}</div>
                        <div style={{ color: "var(--text-secondary)", fontSize: 10 }}>Father: Shri Raghunath Singh</div>
                      </div>
                      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", padding: 10, borderRadius: 6, boxShadow: "var(--shadow-sm)" }}>
                        <div style={{ color: "var(--text-secondary)", fontSize: 10 }}>RoR Jamabandi Details</div>
                        <div style={{ color: "var(--text-primary)", marginTop: 4 }}>Khata Number: <strong>142</strong></div>
                        <div style={{ color: "var(--text-primary)" }}>Khesra / Plot: <strong>{p?.survey_number || "1051"}</strong></div>
                        <div style={{ color: "var(--text-primary)" }}>Lagan / Demand: <strong>₹24.50 / year</strong></div>
                      </div>
                    </div>
                  )}

                  {activeTab === "documents" && (
                    <div style={{ fontSize: 11, display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-card)", border: "1px solid var(--border-default)", padding: 10, borderRadius: 6, boxShadow: "var(--shadow-sm)" }}>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>Registered Sale Deed #4820/2021</div>
                          <div style={{ color: "var(--text-secondary)", fontSize: 10 }}>Registered on 14 Aug 2021</div>
                        </div>
                        <Download size={14} color="var(--brand-primary)" style={{ cursor: "pointer" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-card)", border: "1px solid var(--border-default)", padding: 10, borderRadius: 6, boxShadow: "var(--shadow-sm)" }}>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>Jamabandi Extract (RoR Khatiyan)</div>
                          <div style={{ color: "var(--text-secondary)", fontSize: 10 }}>Verified Revenue Record</div>
                        </div>
                        <Download size={14} color="var(--brand-primary)" style={{ cursor: "pointer" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-card)", border: "1px solid var(--border-default)", padding: 10, borderRadius: 6, boxShadow: "var(--shadow-sm)" }}>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>Non-Encumbrance Certificate (NEC)</div>
                          <div style={{ color: "var(--text-secondary)", fontSize: 10 }}>Issued by Sub-Registrar</div>
                        </div>
                        <Download size={14} color="var(--brand-primary)" style={{ cursor: "pointer" }} />
                      </div>
                    </div>
                  )}

                  {activeTab === "history" && (
                    <div style={{ fontSize: 11, display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ borderLeft: "2px solid var(--brand-primary)", paddingLeft: 10 }}>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>Mutation Order #MUT-2021-8492</div>
                        <div style={{ color: "var(--text-secondary)", fontSize: 10 }}>Approved by CO Basopatti on 22 Sep 2021</div>
                      </div>
                      <div style={{ borderLeft: "2px solid #10b981", paddingLeft: 10 }}>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>Boundary Cadastral Survey</div>
                        <div style={{ color: "var(--text-secondary)", fontSize: 10 }}>DGPS Drone Mapping Completed on 10 Jan 2024</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom View Land 360 Button */}
                <div style={{ padding: 14, borderTop: "1px solid var(--border-default)", background: "var(--bg-app)" }}>
                  <Link href={`/parcel/${p?.parcel_id || p?.ulpin || "1051"}`} style={{ textDecoration: "none" }}>
                    <button
                      style={{
                        width: "100%",
                        padding: "10px 0",
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-default)",
                        color: "var(--text-primary)",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        transition: "all 0.2s",
                        boxShadow: "var(--shadow-sm)"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--brand-primary)";
                        e.currentTarget.style.boxShadow = "var(--shadow-md)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border-default)";
                        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                      }}
                    >
                      <span>View Land 360°</span>
                    </button>
                  </Link>
                </div>
              </>
            ) : null}
          </aside>
        )}
      </div>
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "var(--bg-app)", color: "var(--brand-primary)" }}>Loading GIS Map Engine...</div>}>
      <MapContent />
    </Suspense>
  );
}

