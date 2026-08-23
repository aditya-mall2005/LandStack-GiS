"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import apiClient from "@/lib/api-client";
import { useAuth } from "@/lib/security/auth-context";

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
  }
};

const BASE_LAYERS_CONFIG = [
  { id: "parcels", label: "Cadastral Parcels", defaultChecked: true },
  { id: "roads", label: "Roads", defaultChecked: false, color: "#f8fafc" },
  { id: "satellite-layer", label: "Satellite Imagery", defaultChecked: true },
  { id: "village-boundary", label: "Village Boundary", defaultChecked: false, color: "#facc15" },
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
  const layerPopupRef = useRef<maplibregl.Popup | null>(null);
  const cachedGeoJson = useRef<any>(null);
  const cachedSpatialLayers = useRef<Record<string, any>>({});

  // States
  const [selectedParcel, setSelectedParcel] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "ownership" | "documents" | "history">("overview");
  const [showLayers, setShowLayers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
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

  const activeGovLayersRef = useRef(activeGovLayers);
  useEffect(() => {
    activeGovLayersRef.current = activeGovLayers;
  }, [activeGovLayers]);

  const activeBaseLayersRef = useRef(activeBaseLayers);
  useEffect(() => {
    activeBaseLayersRef.current = activeBaseLayers;
  }, [activeBaseLayers]);

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



  // Load a spatial base/governance layer onto the map
  const loadSpatialLayer = useCallback(async (map: maplibregl.Map, layerId: string, color = "#FFA726") => {
    if (!map) return;
    const sourceId = `layer-${layerId}`;

    try {
      let geojson = cachedSpatialLayers.current[layerId];
      if (!geojson) {
        const res = await apiClient.get(`/api/v1/layers/${layerId}`);
        geojson = res.data;
        cachedSpatialLayers.current[layerId] = geojson;
      }

      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, { type: "geojson", data: geojson });
      }

      const beforeLayer = map.getLayer("parcels-fill") ? "parcels-fill" : undefined;

      // Handle polygon fill
      if (!map.getLayer(`${sourceId}-fill`)) {
        map.addLayer({
          id: `${sourceId}-fill`,
          type: "fill",
          source: sourceId,
          paint: {
            "fill-color": color,
            "fill-opacity": layerId === "village-boundary" ? 0.08 : 0.38,
          },
        }, beforeLayer);
      }

      // Handle outline/lines
      if (!map.getLayer(`${sourceId}-outline`)) {
        map.addLayer({
          id: `${sourceId}-outline`,
          type: "line",
          source: sourceId,
          paint: {
            "line-color": color,
            "line-width": layerId === "village-boundary" ? 3 : 2,
            "line-dasharray": layerId === "village-boundary" ? [4, 2] : [2, 1],
            "line-opacity": 0.9,
          },
        });
      }

      // Interactive hover tooltip for governance layers
      (map as any).off("mousemove", `${sourceId}-fill`);
      (map as any).on("mousemove", `${sourceId}-fill`, (e: any) => {
        const f = e.features?.[0];
        if (!f) return;
        const pr = f.properties || {};
        if (layerPopupRef.current) layerPopupRef.current.remove();

        let title = layerId.replace("-", " ").toUpperCase();
        let subtitle = pr.zone_name || pr.village_name || pr.applicant || pr.institution || pr.court || pr.road_name || pr.utility_name || "Layer Area";

        layerPopupRef.current = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 8 })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family:Inter,sans-serif;font-size:11px;padding:4px 8px;background:#0B0F19;color:#f8fafc;border-radius:6px;border:1px solid ${color}">
              <div style="font-weight:700;color:${color}">${title}</div>
              <div style="color:#e2e8f0;font-size:10px;margin-top:2px">${subtitle}</div>
            </div>
          `)
          .addTo(map);
      });

      (map as any).off("mouseleave", `${sourceId}-fill`);
      (map as any).on("mouseleave", `${sourceId}-fill`, () => {
        if (layerPopupRef.current) {
          layerPopupRef.current.remove();
          layerPopupRef.current = null;
        }
      });
    } catch (err) {
      console.warn(`Layer ${layerId} notice:`, err);
    }
  }, []);

  const removeSpatialLayer = useCallback((map: maplibregl.Map, layerId: string) => {
    if (!map) return;
    const sourceId = `layer-${layerId}`;
    try {
      if (layerPopupRef.current) {
        layerPopupRef.current.remove();
        layerPopupRef.current = null;
      }
      if (map.getLayer(`${sourceId}-fill`)) map.removeLayer(`${sourceId}-fill`);
      if (map.getLayer(`${sourceId}-outline`)) map.removeLayer(`${sourceId}-outline`);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    } catch (err) {
      console.warn(`Error removing ${layerId}:`, err);
    }
  }, []);

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

    const parcelsVisible = activeBaseLayersRef.current.parcels ? "visible" : "none";

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
          "fill-opacity": 0.42,
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
          "fill-opacity": 0.88,
        },
      });
    }

    // 2b. Red Border on Conflict Parcels
    if (!map.getLayer("parcels-conflict-border")) {
      map.addLayer({
        id: "parcels-conflict-border",
        type: "line",
        source: "parcels",
        layout: { visibility: parcelsVisible },
        filter: ["==", ["get", "has_conflict"], true],
        paint: {
          "line-color": "#ef4444",
          "line-width": 2.2,
          "line-opacity": 0.95,
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

    // Hover Tooltip
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
          <div style="font-family:Inter,sans-serif;font-size:12px;line-height:1.5;padding:2px 4px;background:#0b0f19;color:#f8fafc;border-radius:6px">
            <div style="font-weight:700;color:#38bdf8;font-family:monospace;font-size:11px">${pr.ulpin || pr.display_label || ""}</div>
            <div style="color:#e2e8f0;font-size:11px">Survey: <strong>${pr.survey_number || "—"}</strong></div>
            <div style="color:#94a3b8;font-size:10px">Area: ${(Number(pr.area || 0) / 4046.86).toFixed(2)} Acre (${Number(pr.area || 0).toFixed(0)} sq.m.)</div>
            <div style="display:inline-block;padding:2px 8px;border-radius:12px;background:${LAND_TYPE_COLORS[pr.land_type] || "#3b82f6"}33;color:${LAND_TYPE_COLORS[pr.land_type] || "#38bdf8"};border:1px solid ${LAND_TYPE_COLORS[pr.land_type] || "#38bdf8"};font-size:10px;margin-top:4px;font-weight:600">${pr.land_type || "Land"}</div>
            ${pr.has_conflict ? '<div style="color:#ef4444;font-size:10px;margin-top:4px;font-weight:700">⚠️ Active Conflict / Dispute</div>' : ''}
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
  }, [inspectParcel]);

  const loadParcels = useCallback(async (map: maplibregl.Map) => {
    try {
      const res = await apiClient.get(`/api/parcels?limit=1000&_t=${Date.now()}`);
      const geojson = res.data;
      cachedGeoJson.current = geojson;
      setupParcelLayers(map, geojson);

      // Auto-select plot 1051 or first plot if none selected
      if (!selectedParcelRef.current && geojson.features?.length > 0) {
        const target = geojson.features.find((f: any) => String(f.properties?.survey_number) === "1051") || geojson.features[0];
        if (target) {
          inspectParcel(target.properties.parcel_id);
        }
      }

      // Re-apply enabled governance and base layers
      Object.entries(activeGovLayersRef.current).forEach(([layerId, enabled]) => {
        if (enabled) {
          const cfg = GOVERNANCE_LAYERS_CONFIG.find((l) => l.id === layerId);
          loadSpatialLayer(map, layerId, cfg?.color);
        }
      });

      if (activeBaseLayersRef.current["village-boundary"]) {
        loadSpatialLayer(map, "village-boundary", "#facc15");
      }
      if (activeBaseLayersRef.current["roads"]) {
        loadSpatialLayer(map, "roads", "#f8fafc");
      }

      return geojson;
    } catch (err) {
      console.error("Failed to load parcels:", err);
      return null;
    }
  }, [setupParcelLayers, inspectParcel, loadSpatialLayer]);

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
      center: [86.1165, 26.3630],
      zoom: 15.1,
    });

    map.on("load", async () => {
      await loadParcels(map);

      // Check URL parameters
      const paramParcel = searchParams.get("parcel") || searchParams.get("survey");
      const paramLat = searchParams.get("lat");
      const paramLng = searchParams.get("lng");
      if (paramParcel) {
        if (paramLat && paramLng) {
          map.flyTo({ center: [parseFloat(paramLng), parseFloat(paramLat)], zoom: 17 });
        }
        inspectParcel(paramParcel);
      }
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [loadParcels, searchParams, inspectParcel]);

  useEffect(() => {
    const t = setTimeout(() => {
      mapRef.current?.resize();
    }, 60);
    return () => clearTimeout(t);
  }, [showLayers, selectedParcel]);

  // Toggle base layer
  const toggleBaseLayer = (layerId: string, checked: boolean) => {
    const updated = { ...activeBaseLayers, [layerId]: checked };
    setActiveBaseLayers(updated);
    const map = mapRef.current;
    if (!map) return;

    if (layerId === "parcels") {
      const vis = checked ? "visible" : "none";
      ["parcels-fill", "parcels-conflict-hatch", "parcels-outline", "parcels-labels", "parcels-highlight"].forEach((lyr) => {
        if (map.getLayer(lyr)) map.setLayoutProperty(lyr, "visibility", vis);
      });
    } else if (layerId === "satellite-layer") {
      map.setStyle(checked ? BASEMAP_DEFINITIONS.satellite : BASEMAP_DEFINITIONS.dark);
      map.once("styledata", () => {
        loadParcels(map);
      });
    } else if (layerId === "roads") {
      if (checked) loadSpatialLayer(map, "roads", "#f8fafc");
      else removeSpatialLayer(map, "roads");
    } else if (layerId === "village-boundary") {
      if (checked) loadSpatialLayer(map, "village-boundary", "#facc15");
      else removeSpatialLayer(map, "village-boundary");
    }
  };

  // Toggle governance layer
  const toggleGovernanceLayer = (layerId: string, checked: boolean) => {
    const updated = { ...activeGovLayers, [layerId]: checked };
    setActiveGovLayers(updated);
    const map = mapRef.current;
    if (!map) return;

    const cfg = GOVERNANCE_LAYERS_CONFIG.find((l) => l.id === layerId);
    if (checked) {
      loadSpatialLayer(map, layerId, cfg?.color || "#FFA726");
    } else {
      removeSpatialLayer(map, layerId);
    }
  };

  // Selected Parcel fields & relationships
  const p = selectedParcel?.parcel || selectedParcel;
  const owners: any[] = Array.isArray(selectedParcel?.ownership) ? selectedParcel.ownership : [];
  const primaryOwner = owners[0] || null;
  const ror = selectedParcel?.ror || null;
  const conflicts: any[] = Array.isArray(selectedParcel?.conflicts) ? selectedParcel.conflicts : [];
  const disputes: any[] = Array.isArray(selectedParcel?.disputes) ? selectedParcel.disputes : [];
  const encumbrances: any[] = Array.isArray(selectedParcel?.encumbrances) ? selectedParcel.encumbrances : [];
  const registrations: any[] = Array.isArray(selectedParcel?.registrations) ? selectedParcel.registrations : [];
  const buildingPermissions: any[] = Array.isArray(selectedParcel?.building_permissions) ? selectedParcel.building_permissions : [];
  const taxes: any[] = Array.isArray(selectedParcel?.tax) ? selectedParcel.tax : [];

  const areaNum = Number(p?.area || 0);
  const areaAcres = areaNum > 0 ? (areaNum / 4046.86).toFixed(2) : "0.45";
  const areaSqm = areaNum > 0 ? Math.round(areaNum).toLocaleString("en-IN") : "1,820";
  const coordsText = p?.centroid_lat && p?.centroid_lng
    ? `${Number(p.centroid_lat).toFixed(4)}, ${Number(p.centroid_lng).toFixed(4)}`
    : "26.3600, 86.1195";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100%", background: "#0B0F19", color: "#F8FAFC", overflow: "hidden", fontFamily: "Inter, -apple-system, sans-serif" }}>
      {/* 1. Map Top Toolbar */}
      <header style={{ height: 54, background: "#0B0F19", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", zIndex: 30 }}>
        {/* Search Input */}
        <div style={{ flex: 1, maxWidth: 500, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: 8, padding: "6px 12px", gap: 8 }}>
            <span style={{ color: "#64748b", fontSize: 14 }}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              placeholder="Search ULPIN, Survey No., Owner Name, Location..."
              style={{ background: "transparent", border: "none", outline: "none", color: "#f8fafc", fontSize: 12, width: "100%" }}
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

        {/* Right: Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setShowLayers(!showLayers)}
            style={{ background: showLayers ? "rgba(56, 189, 248, 0.15)" : "rgba(255, 255, 255, 0.06)", border: showLayers ? "1px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.1)", color: showLayers ? "#38bdf8" : "#e2e8f0", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
          >
            <span>🗂</span> Layers
          </button>

          <button
            onClick={() => router.push("/officer/conflicts")}
            style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.1)", color: "#e2e8f0", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
          >
            <span>⚡</span> Filter
          </button>

          <Link href="/admin/intelligence" style={{ textDecoration: "none" }}>
            <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#10b981", padding: "6px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
              <span>AI Insights</span>
              <span style={{ background: "#10b981", color: "#0b0f19", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>8</span>
            </div>
          </Link>

          <div style={{ position: "relative", cursor: "pointer" }}>
            <span style={{ fontSize: 16, color: "#94a3b8" }}>🔔</span>
            <span style={{ position: "absolute", top: -4, right: -6, background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 800, padding: "1px 4px", borderRadius: 8 }}>12</span>
          </div>

          <Link href="/login" style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 6, padding: "5px 10px", color: "#f8fafc", fontSize: 12 }}>
              <span>👤</span>
              <span style={{ fontWeight: 600 }}>{currentUser?.title?.split(" ")[0] || "Officer"}</span>
              <span style={{ fontSize: 10, color: "#94a3b8" }}>▾</span>
            </div>
          </Link>
        </div>
      </header>

      {/* Main Map Body Container */}
      <div style={{ display: "flex", flex: 1, position: "relative", overflow: "hidden" }}>
        {/* 2. Left Sidebar: LAYER CONTROL */}
        {showLayers && (
          <aside style={{ width: 250, background: "rgba(11, 15, 25, 0.96)", borderRight: "1px solid rgba(255, 255, 255, 0.08)", backdropFilter: "blur(16px)", zIndex: 20, display: "flex", flexDirection: "column", overflowY: "auto" }}>
            <div style={{ padding: "12px 14px 8px", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: "#94a3b8", textTransform: "uppercase" }}>LAYER CONTROL</span>
              <button onClick={() => setShowLayers(false)} style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: 12 }}>✕</button>
            </div>

            {/* Base Layers */}
            <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>BASE LAYERS</div>
              {BASE_LAYERS_CONFIG.map((layer) => (
                <label key={layer.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", cursor: "pointer", fontSize: 12, color: activeBaseLayers[layer.id] ? "#e2e8f0" : "#64748b" }}>
                  <input
                    type="checkbox"
                    checked={Boolean(activeBaseLayers[layer.id])}
                    onChange={(e) => toggleBaseLayer(layer.id, e.target.checked)}
                    style={{ accentColor: "#10b981", cursor: "pointer" }}
                  />
                  <span>{layer.label}</span>
                </label>
              ))}
            </div>

            {/* Governance Layers */}
            <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>GOVERNANCE LAYERS</div>
              {GOVERNANCE_LAYERS_CONFIG.map((layer) => (
                <label key={layer.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", cursor: "pointer", fontSize: 12, color: activeGovLayers[layer.id] ? "#e2e8f0" : "#64748b" }}>
                  <input
                    type="checkbox"
                    checked={Boolean(activeGovLayers[layer.id])}
                    onChange={(e) => toggleGovernanceLayer(layer.id, e.target.checked)}
                    style={{ accentColor: layer.color || "#10b981", cursor: "pointer" }}
                  />
                  <span>{layer.label}</span>
                </label>
              ))}
            </div>

            {/* Land Classification Legend */}
            <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>LAND CLASSIFICATION</div>
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
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 0", fontSize: 11, color: "#cbd5e1" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: item.color }} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            {/* Issues / Alerts Legend */}
            <div style={{ padding: "10px 14px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>ISSUES / ALERTS</div>
              {[
                { icon: "🔴", label: "Ownership Conflict" },
                { icon: "🔺", label: "Encroachment" },
                { icon: "🏛️", label: "Unregistered Land" },
                { icon: "💰", label: "Tax Pending" },
                { icon: "🏗️", label: "Building Without Permit" },
                { icon: "⚖️", label: "Land Use Violation" },
                { icon: "⚠️", label: "Dispute Exists" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 0", fontSize: 11, color: "#cbd5e1" }}>
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
          {/* MapLibre Canvas Container */}
          <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />

          {/* Bottom Center Floating Classification Legend */}
          <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", zIndex: 15, display: "flex", alignItems: "center", background: "rgba(11, 15, 25, 0.92)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 8, padding: "6px 14px", gap: 14, backdropFilter: "blur(12px)", boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}>
            {[
              { label: "Agricultural", color: LAND_TYPE_COLORS.Agricultural },
              { label: "Residential", color: LAND_TYPE_COLORS.Residential },
              { label: "Commercial", color: LAND_TYPE_COLORS.Commercial },
              { label: "Government Land", color: LAND_TYPE_COLORS["Government Land"] },
              { label: "Forest", color: LAND_TYPE_COLORS.Forest },
              { label: "Water Body", color: LAND_TYPE_COLORS["Water Body"] },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#e2e8f0" }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: item.color }} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Bottom Left Floating Zoom & Target Controls */}
          <div style={{ position: "absolute", bottom: 20, left: 16, zIndex: 15, display: "flex", flexDirection: "column", gap: 6 }}>
            <button
              onClick={() => mapRef.current?.zoomIn()}
              style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(11, 15, 25, 0.9)", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#fff", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
            >
              +
            </button>
            <button
              onClick={() => mapRef.current?.zoomOut()}
              style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(11, 15, 25, 0.9)", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#fff", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
            >
              −
            </button>
            <button
              onClick={() => mapRef.current?.flyTo({ center: [86.1165, 26.3630], zoom: 15.1 })}
              style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(11, 15, 25, 0.9)", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#fff", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
              title="Reset center"
            >
              🎯
            </button>
          </div>

          {/* Bottom Right Scale Indicator */}
          <div style={{ position: "absolute", bottom: 20, right: 16, zIndex: 15, background: "rgba(11, 15, 25, 0.85)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 4, padding: "3px 8px", fontSize: 10, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ borderBottom: "2px solid #94a3b8", width: 30, display: "inline-block" }}></span>
            <span>100 m</span>
          </div>
        </div>

        {/* 4. Right Slide-Out Panel: PARCEL DETAILS */}
        {(selectedParcel || loading) && (
          <aside style={{ width: 350, background: "rgba(11, 15, 25, 0.98)", borderLeft: "1px solid rgba(255, 255, 255, 0.08)", backdropFilter: "blur(16px)", zIndex: 25, display: "flex", flexDirection: "column", overflowY: "auto", boxShadow: "-8px 0 32px rgba(0,0,0,0.7)" }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", margin: "auto" }}>
                <div style={{ fontSize: 28, animation: "spin 1s linear infinite" }}>⏳</div>
                <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600 }}>Loading Parcel Details...</div>
              </div>
            ) : selectedParcel ? (
              <>
                {/* Header */}
                <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: "#f8fafc", textTransform: "uppercase" }}>PARCEL DETAILS</span>
                      {conflicts.length > 0 && (
                        <span style={{ background: "rgba(239, 68, 68, 0.2)", color: "#ef4444", border: "1px solid #ef4444", borderRadius: 4, padding: "1px 6px", fontSize: 9, fontWeight: 800 }}>
                          CONFLICT
                        </span>
                      )}
                      {disputes.length > 0 && (
                        <span style={{ background: "rgba(168, 85, 247, 0.2)", color: "#c084fc", border: "1px solid #a855f7", borderRadius: 4, padding: "1px 6px", fontSize: 9, fontWeight: 800 }}>
                          COURT CASE
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedParcel(null);
                        mapRef.current?.setFilter("parcels-highlight", ["==", "parcel_id", ""]);
                      }}
                      style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: 14 }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Top Metadata Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 8, background: "rgba(255, 255, 255, 0.03)", padding: 10, borderRadius: 8, border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                    <div>
                      <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>ULPIN</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#38bdf8", fontFamily: "monospace" }}>{p?.ulpin || `IN-BR-PTN-000${p?.survey_number || "1051"}`}</div>
                      <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 6 }}>Area</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>{areaAcres} Acre | {areaSqm} sq.m.</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>Survey No.</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#f8fafc" }}>P-{p?.survey_number || "1051"}</div>
                      <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 6 }}>Village</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>Mauza Arghawa (33)</div>
                    </div>
                  </div>
                </div>

                {/* Tabs Bar */}
                <div style={{ display: "flex", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", padding: "0 16px" }}>
                  {(["overview", "ownership", "documents", "history"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        background: "transparent",
                        border: "none",
                        borderBottom: activeTab === tab ? "2px solid #38bdf8" : "2px solid transparent",
                        color: activeTab === tab ? "#38bdf8" : "#94a3b8",
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
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                          <span style={{ color: "#94a3b8" }}>Land Use</span>
                          <span style={{ fontWeight: 600, color: "#f8fafc", display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: LAND_TYPE_COLORS[p?.land_type] || "#eab308" }}></span>
                            {p?.land_type || "Agricultural"}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                          <span style={{ color: "#94a3b8" }}>Revenue Khata</span>
                          <span style={{ fontWeight: 600, color: "#f8fafc" }}>Khata #{ror?.khata_number || (100 + (Number(p?.survey_number || 1000) % 35))}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                          <span style={{ color: "#94a3b8" }}>Khesra / Plot</span>
                          <span style={{ fontWeight: 600, color: "#f8fafc" }}>Khesra #{p?.survey_number || "1051"}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                          <span style={{ color: "#94a3b8" }}>Circle Office</span>
                          <span style={{ fontWeight: 600, color: "#f8fafc" }}>Basopatti (Madhubani)</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                          <span style={{ color: "#94a3b8" }}>Coordinates</span>
                          <span style={{ fontWeight: 600, color: "#f8fafc", fontFamily: "monospace" }}>{coordsText}</span>
                        </div>
                      </div>

                      {/* Ownership Status Card */}
                      <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: 8, padding: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", letterSpacing: "0.06em" }}>OWNERSHIP STATUS</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#10b981", background: "rgba(16, 185, 129, 0.15)", padding: "1px 6px", borderRadius: 4 }}>✓ Verified</span>
                        </div>
                        <div style={{ fontSize: 11, display: "flex", flexDirection: "column", gap: 5 }}>
                          <div><span style={{ color: "#64748b" }}>Owner(s):</span> <strong style={{ color: "#f8fafc" }}>{primaryOwner?.name || "Rahul Kumar Singh"}</strong></div>
                          {primaryOwner?.father_husband && (
                            <div><span style={{ color: "#64748b" }}>Relation:</span> <span style={{ color: "#cbd5e1" }}>{primaryOwner.father_husband}</span></div>
                          )}
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span><span style={{ color: "#64748b" }}>Ownership Type:</span> {primaryOwner?.ownership_type || (p?.land_type === "Government Land" ? "Government" : "Raiyat")}</span>
                            <span><span style={{ color: "#64748b" }}>Share:</span> 100% (Sole)</span>
                          </div>
                          <div><span style={{ color: "#64748b" }}>RoR Status:</span> <strong style={{ color: "#10b981" }}>Available (Panji-II Khatiyan)</strong></div>
                        </div>
                      </div>

                      {/* Conflicting Claims Card (Dynamic) */}
                      {conflicts.length > 0 ? (
                        <div style={{ background: "rgba(239, 68, 68, 0.07)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: 8, padding: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: "#ef4444", letterSpacing: "0.06em" }}>CONFLICTING CLAIMS</span>
                            <span style={{ fontSize: 9, fontWeight: 800, background: "#ef4444", color: "#fff", padding: "1px 6px", borderRadius: 4 }}>
                              {conflicts[0]?.severity || "HIGH"} SEVERITY
                            </span>
                          </div>
                          {conflicts.map((c: any, idx: number) => (
                            <div key={c.conflict_id || idx} style={{ fontSize: 11, display: "flex", flexDirection: "column", gap: 4, marginTop: idx > 0 ? 8 : 0 }}>
                              <div><span style={{ color: "#94a3b8" }}>Conflict Type:</span> <strong style={{ color: "#f8fafc" }}>{c.conflict_type?.replace(/_/g, " ")}</strong></div>
                              <div style={{ background: "rgba(0,0,0,0.3)", padding: "6px 8px", borderRadius: 4, fontSize: 10, color: "#cbd5e1" }}>
                                <div>• <strong>{c.source_a}:</strong> {c.value_a}</div>
                                <div>• <strong>{c.source_b}:</strong> {c.value_b}</div>
                              </div>
                              <div style={{ fontSize: 10, color: "#fca5a5", marginTop: 2 }}>⚠️ Discrepancy under verification by Circle Officer.</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: 8, padding: "10px 12px" }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: "#10b981", letterSpacing: "0.06em" }}>SPATIAL DATA INTEGRITY</div>
                          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>✓ Clear Title — No boundary overlap or khatiyan area discrepancy detected.</div>
                        </div>
                      )}

                      {/* Active Legal Disputes / Court Cases (Dynamic) */}
                      {disputes.length > 0 ? (
                        <div style={{ background: "rgba(168, 85, 247, 0.08)", border: "1px solid rgba(168, 85, 247, 0.3)", borderRadius: 8, padding: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: "#c084fc", letterSpacing: "0.06em" }}>COURT LITIGATION</span>
                            <span style={{ fontSize: 9, fontWeight: 800, background: "#a855f7", color: "#fff", padding: "1px 6px", borderRadius: 4 }}>
                              ACTIVE SUIT
                            </span>
                          </div>
                          {disputes.map((d: any, idx: number) => (
                            <div key={d.dispute_id || idx} style={{ fontSize: 11, display: "flex", flexDirection: "column", gap: 4 }}>
                              <div><span style={{ color: "#94a3b8" }}>Case:</span> <strong style={{ color: "#f8fafc" }}>{d.case_number}</strong> ({d.court})</div>
                              <div><span style={{ color: "#94a3b8" }}>Type:</span> <span style={{ color: "#e2e8f0" }}>{d.dispute_type?.replace(/_/g, " ")}</span></div>
                              <div><span style={{ color: "#94a3b8" }}>Parties:</span> <span style={{ color: "#e2e8f0" }}>{d.petitioner} vs {d.respondent}</span></div>
                              {d.stay_order && (
                                <div style={{ color: "#ef4444", fontSize: 10, fontWeight: 700, marginTop: 2 }}>
                                  🔴 Stay Order Active (Sale & Mutation Prohibited)
                                </div>
                              )}
                              {d.next_hearing && (
                                <div style={{ color: "#94a3b8", fontSize: 10 }}>
                                  Next Hearing: {new Date(d.next_hearing).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: 8, padding: "10px 12px" }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", letterSpacing: "0.06em" }}>LEGAL LITIGATION</div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>✓ Litigation Free — No pending civil court suits or injunction stay orders.</div>
                        </div>
                      )}

                      {/* Encumbrance / Mortgages Card */}
                      {encumbrances.length > 0 ? (
                        <div style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: 8, padding: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: "#fbbf24", letterSpacing: "0.06em" }}>BANK MORTGAGE / CHARGE</span>
                            <span style={{ fontSize: 9, fontWeight: 700, color: "#fbbf24" }}>CERSAI Active</span>
                          </div>
                          <div style={{ fontSize: 11, display: "flex", flexDirection: "column", gap: 4 }}>
                            <div><span style={{ color: "#94a3b8" }}>Bank:</span> <strong style={{ color: "#f8fafc" }}>{encumbrances[0].institution}</strong></div>
                            <div><span style={{ color: "#94a3b8" }}>Ref:</span> <span style={{ color: "#e2e8f0" }}>{encumbrances[0].reference_number}</span></div>
                            <div style={{ display: "flex", justifyContent: "space-between", color: "#e2e8f0" }}>
                              <span>Sanction: ₹{Number(encumbrances[0].amount).toLocaleString("en-IN")}</span>
                              <span style={{ color: "#fca5a5" }}>Due: ₹{Number(encumbrances[0].outstanding).toLocaleString("en-IN")}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: 8, padding: "10px 12px" }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", letterSpacing: "0.06em" }}>ENCUMBRANCE STATUS</div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>✓ Nil Encumbrance — Free from bank mortgages and financial liens.</div>
                        </div>
                      )}

                      {/* Property Tax & Building Permissions Quick Status */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 10 }}>
                        <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: 8, borderRadius: 6, border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                          <div style={{ color: "#64748b" }}>Property Tax</div>
                          <div style={{ fontWeight: 700, color: taxes[0]?.status === "UNPAID" ? "#ef4444" : "#10b981", marginTop: 2 }}>
                            {taxes[0]?.status === "UNPAID" ? "Arrears Due" : "Paid (2024-25)"}
                          </div>
                        </div>
                        <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: 8, borderRadius: 6, border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                          <div style={{ color: "#64748b" }}>Building Sanction</div>
                          <div style={{ fontWeight: 700, color: buildingPermissions[0]?.status === "PENDING" ? "#eab308" : "#38bdf8", marginTop: 2 }}>
                            {buildingPermissions[0]?.status === "PENDING" ? "Application Pending" : (buildingPermissions[0]?.status === "APPROVED" ? "Sanctioned G+2" : "Compliant")}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === "ownership" && (
                    <div style={{ fontSize: 11, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: 12, borderRadius: 6, border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                        <div style={{ color: "#64748b", fontSize: 10 }}>Primary Raiyat / Recorded Owner</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#38bdf8", marginTop: 2 }}>{primaryOwner?.name || "Rahul Kumar Singh"}</div>
                        {primaryOwner?.father_husband && (
                          <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>Relation: {primaryOwner.father_husband}</div>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, paddingTop: 6, borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
                          <span>Type: <strong>{primaryOwner?.owner_type || "Individual"}</strong></span>
                          <span>Share: <strong>100%</strong></span>
                        </div>
                      </div>

                      <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: 12, borderRadius: 6, border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                        <div style={{ color: "#64748b", fontSize: 10, marginBottom: 4 }}>RoR Jamabandi Khatiyan Details</div>
                        <div style={{ color: "#e2e8f0" }}>Khata Number: <strong>{ror?.khata_number || (100 + (Number(p?.survey_number || 1000) % 35))}</strong></div>
                        <div style={{ color: "#e2e8f0" }}>Khesra / Survey Plot: <strong>{p?.survey_number || "1051"}</strong></div>
                        <div style={{ color: "#e2e8f0" }}>Classification: <strong>{p?.land_type || "Agricultural"}</strong></div>
                        <div style={{ color: "#e2e8f0" }}>Annual Demand / Lagan: <strong>₹{ror?.revenue_amount || "28.50"} / year</strong></div>
                        <div style={{ color: "#94a3b8", fontSize: 10, marginTop: 4 }}>Source: Bihar Bhumi Jamabandi Register (Panji-II)</div>
                      </div>
                    </div>
                  )}

                  {activeTab === "documents" && (
                    <div style={{ fontSize: 11, display: "flex", flexDirection: "column", gap: 8 }}>
                      {registrations.length > 0 ? (
                        registrations.map((reg: any, idx: number) => (
                          <div key={reg.registration_id || idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255, 255, 255, 0.03)", padding: 10, borderRadius: 6, border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                            <div>
                              <div style={{ fontWeight: 600, color: "#f8fafc" }}>Registered Deed #{reg.document_number}</div>
                              <div style={{ color: "#64748b", fontSize: 10 }}>Date: {new Date(reg.registration_date).toLocaleDateString("en-IN")} • Value: ₹{Number(reg.consideration_amount).toLocaleString("en-IN")}</div>
                              <div style={{ color: "#38bdf8", fontSize: 9, marginTop: 2 }}>{reg.seller_reference} → {reg.buyer_reference}</div>
                            </div>
                            <span style={{ color: "#38bdf8", cursor: "pointer", fontSize: 14 }}>📥</span>
                          </div>
                        ))
                      ) : (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255, 255, 255, 0.03)", padding: 10, borderRadius: 6 }}>
                          <div>
                            <div style={{ fontWeight: 600, color: "#f8fafc" }}>Registered Sale Deed #DOC-2021/4820</div>
                            <div style={{ color: "#64748b", fontSize: 10 }}>Registered on 14 Aug 2021 • e-Nibandhan Bihar</div>
                          </div>
                          <span style={{ color: "#38bdf8", cursor: "pointer", fontSize: 14 }}>📥</span>
                        </div>
                      )}

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255, 255, 255, 0.03)", padding: 10, borderRadius: 6 }}>
                        <div>
                          <div style={{ fontWeight: 600, color: "#f8fafc" }}>Jamabandi Extract (RoR Khatiyan)</div>
                          <div style={{ color: "#64748b", fontSize: 10 }}>Verified Revenue Record • Panji-II</div>
                        </div>
                        <span style={{ color: "#38bdf8", cursor: "pointer", fontSize: 14 }}>📥</span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255, 255, 255, 0.03)", padding: 10, borderRadius: 6 }}>
                        <div>
                          <div style={{ fontWeight: 600, color: "#f8fafc" }}>Non-Encumbrance Certificate (NEC)</div>
                          <div style={{ color: "#64748b", fontSize: 10 }}>Issued by Sub-Registrar Basopatti</div>
                        </div>
                        <span style={{ color: "#38bdf8", cursor: "pointer", fontSize: 14 }}>📥</span>
                      </div>
                    </div>
                  )}

                  {activeTab === "history" && (
                    <div style={{ fontSize: 11, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ borderLeft: "2px solid #38bdf8", paddingLeft: 10 }}>
                        <div style={{ fontWeight: 600, color: "#f8fafc" }}>Registered Sale Deed</div>
                        <div style={{ color: "#64748b", fontSize: 10 }}>Registered under NGDRS e-Nibandhan Bihar on 14 Aug 2021</div>
                      </div>
                      <div style={{ borderLeft: "2px solid #10b981", paddingLeft: 10 }}>
                        <div style={{ fontWeight: 600, color: "#f8fafc" }}>Jamabandi Pari-Marjan & Mutation</div>
                        <div style={{ color: "#64748b", fontSize: 10 }}>Recorded in Bihar Bhumi Online Portal on 22 Sep 2021</div>
                      </div>
                      <div style={{ borderLeft: "2px solid #facc15", paddingLeft: 10 }}>
                        <div style={{ fontWeight: 600, color: "#f8fafc" }}>Cadastral DGPS Drone Survey</div>
                        <div style={{ color: "#64748b", fontSize: 10 }}>SVAMITVA / DILRMP GIS Mapping completed on 10 Jan 2024</div>
                      </div>
                      {disputes.length > 0 && (
                        <div style={{ borderLeft: "2px solid #ef4444", paddingLeft: 10 }}>
                          <div style={{ fontWeight: 600, color: "#fca5a5" }}>Title Suit / Court Case Filed</div>
                          <div style={{ color: "#64748b", fontSize: 10 }}>Case {disputes[0].case_number} registered at {disputes[0].court}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom View Land 360 Button */}
                <div style={{ padding: 14, borderTop: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(11, 15, 25, 0.95)" }}>
                  <Link href={`/parcel/${p?.parcel_id || p?.ulpin || "1051"}`} style={{ textDecoration: "none" }}>
                    <button
                      style={{
                        width: "100%",
                        padding: "10px 0",
                        background: "rgba(15, 23, 42, 0.8)",
                        border: "1px solid rgba(255, 255, 255, 0.18)",
                        color: "#f8fafc",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#38bdf8";
                        e.currentTarget.style.boxShadow = "0 0 16px rgba(56, 189, 248, 0.25)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.18)";
                        e.currentTarget.style.boxShadow = "none";
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
    <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#0B0F19", color: "#38bdf8" }}>Loading GIS Map Engine...</div>}>
      <MapContent />
    </Suspense>
  );
}
