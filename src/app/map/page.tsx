"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import apiClient from "@/lib/api-client";

// Configure worker URL for Next.js Turbopack compatibility
if (typeof window !== "undefined") {
  if ((maplibregl as any).config) {
    (maplibregl as any).config.WORKER_URL = "/maplibre-gl-worker.mjs";
  }
}

const LAND_TYPE_COLORS: Record<string, string> = {
  Agricultural: "#10b981",
  Residential: "#3b82f6",
  Commercial: "#f59e0b",
  Orchard: "#84cc16",
  "Gair Mazarua (Govt)": "#ef4444",
  "Government Land": "#ef4444",
  "Mixed Use": "#8b5cf6",
  "Pond/Water Body": "#06b6d4",
  Wasteland: "#78716c",
  Forest: "#15803d",
  Industrial: "#ec4899",
};

const BASEMAP_DEFINITIONS: Record<string, any> = {
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
  },
  positron: {
    version: 8,
    name: "Light",
    sources: {
      "carto-light-base": {
        type: "raster",
        tiles: [
          "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
          "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
          "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
          "https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png"
        ],
        tileSize: 256,
        attribution: "&copy; OpenStreetMap contributors &copy; CARTO"
      }
    },
    layers: [
      {
        id: "base-tiles",
        type: "raster",
        source: "carto-light-base",
        minzoom: 0,
        maxzoom: 20
      }
    ]
  }
};

const BASEMAP_STYLES = [
  { id: "dark", label: "Dark Matter" },
  { id: "satellite", label: "Satellite" },
  { id: "voyager", label: "Streets" },
  { id: "positron", label: "Light" },
];

const LAYER_CONFIGS = [
  {
    id: "parcels",
    label: "Cadastral Parcels",
    category: "Base",
    icon: "📍",
    enabled: true,
    color: "#ffffff",
  },
  {
    id: "land-use",
    label: "Land Use Zones",
    category: "Governance",
    icon: "🌾",
    enabled: false,
    color: "#FFA726",
  },
  {
    id: "master-plan",
    label: "Master Plan",
    category: "Governance",
    icon: "📐",
    enabled: false,
    color: "#AB47BC",
  },
  {
    id: "restrictions",
    label: "Restriction Zones",
    category: "Environment",
    icon: "⚠️",
    enabled: false,
    color: "#EF5350",
  },
];

const STATUS_COLORS: Record<string, string> = {
  PERMITTED: "#2ea043",
  CONDITIONAL: "#58a6ff",
  REVIEW_REQUIRED: "#d29922",
  RESTRICTED: "#f85149",
  BLOCKED: "#f85149",
};

const TABS = ["overview", "ownership", "ror", "registration", "encumbrance", "building", "landuse", "tax", "restrictions"];

function MapContent() {
  const searchParams = useSearchParams();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const layerPopupRef = useRef<maplibregl.Popup | null>(null);
  const cachedGeoJson = useRef<any>(null);
  const cachedLayersData = useRef<Record<string, any>>({});

  const [selectedParcel, setSelectedParcel] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [parcelCount, setParcelCount] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [layers, setLayers] = useState(LAYER_CONFIGS.map((l) => ({ ...l })));
  const [showLayers, setShowLayers] = useState(true);
  const [currentBasemap, setCurrentBasemap] = useState("dark");

  const layersRef = useRef(layers);
  const selectedParcelRef = useRef(selectedParcel);

  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);

  useEffect(() => {
    selectedParcelRef.current = selectedParcel;
  }, [selectedParcel]);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const setupParcelLayers = useCallback((map: maplibregl.Map, initialData?: any) => {
    if (!map) return;

    if (!map.getSource("parcels")) {
      map.addSource("parcels", {
        type: "geojson",
        data: initialData || { type: "FeatureCollection", features: [] },
      });
    } else if (initialData) {
      (map.getSource("parcels") as maplibregl.GeoJSONSource).setData(initialData);
    }

    const parcelsVisible = layersRef.current.find((l) => l.id === "parcels")?.enabled !== false ? "visible" : "none";

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
            "Orchard", LAND_TYPE_COLORS.Orchard,
            "Gair Mazarua (Govt)", LAND_TYPE_COLORS["Gair Mazarua (Govt)"],
            "Government Land", LAND_TYPE_COLORS["Government Land"],
            "Mixed Use", LAND_TYPE_COLORS["Mixed Use"],
            "Pond/Water Body", LAND_TYPE_COLORS["Pond/Water Body"],
            "Wasteland", LAND_TYPE_COLORS.Wasteland,
            "Forest", LAND_TYPE_COLORS.Forest,
            "Industrial", LAND_TYPE_COLORS.Industrial,
            "#64748b",
          ],
          "fill-opacity": 0.65,
        },
      });
    } else {
      map.setLayoutProperty("parcels-fill", "visibility", parcelsVisible);
    }

    if (!map.getLayer("parcels-outline")) {
      map.addLayer({
        id: "parcels-outline",
        type: "line",
        source: "parcels",
        layout: { visibility: parcelsVisible },
        paint: { "line-color": "#ffffff", "line-width": 1.5, "line-opacity": 0.8 },
      });
    } else {
      map.setLayoutProperty("parcels-outline", "visibility", parcelsVisible);
    }

    if (!map.getLayer("parcels-highlight")) {
      map.addLayer({
        id: "parcels-highlight",
        type: "line",
        source: "parcels",
        layout: { visibility: parcelsVisible },
        paint: { "line-color": "#FFD700", "line-width": 3.5, "line-opacity": 1 },
        filter: ["==", "parcel_id", selectedParcelRef.current?.parcel?.parcel_id || ""],
      });
    } else {
      map.setLayoutProperty("parcels-highlight", "visibility", parcelsVisible);
    }

    if (!map.getLayer("parcels-labels")) {
      map.addLayer({
        id: "parcels-labels",
        type: "symbol",
        source: "parcels",
        minzoom: 15,
        layout: {
          visibility: parcelsVisible,
          "text-field": ["get", "survey_number"],
          "text-size": 11,
          "text-anchor": "center",
        },
        paint: { "text-color": "#ffffff", "text-halo-color": "#000000", "text-halo-width": 2 },
      });
    } else {
      map.setLayoutProperty("parcels-labels", "visibility", parcelsVisible);
    }

    // Click handler
    (map as any).off("click", "parcels-fill");
    (map as any).on("click", "parcels-fill", async (e: any) => {
      const feature = e.features?.[0];
      if (!feature?.properties?.parcel_id) return;
      const parcelId = feature.properties.parcel_id;
      if (map.getLayer("parcels-highlight")) {
        map.setFilter("parcels-highlight", ["==", "parcel_id", parcelId]);
      }
      setLoading(true);
      setActiveTab("overview");
      try {
        const res = await apiClient.get(`/api/parcels/${parcelId}`);
        setSelectedParcel(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    });

    // Hover tooltip
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
          <div style="font-family:Inter,sans-serif;font-size:12px;line-height:1.6">
            <div style="font-weight:700;color:#58a6ff;font-family:monospace">${pr.ulpin || ""}</div>
            <div>Survey: ${pr.survey_number || "—"}</div>
            <div>Area: ${Number(pr.area || 0).toLocaleString()} sqm</div>
            <div style="display:inline-block;padding:1px 6px;border-radius:4px;background:${LAND_TYPE_COLORS[pr.land_type] || "#607D8B"};color:#fff;font-size:10px;margin-top:2px">${pr.land_type || ""}</div>
          </div>
        `)
        .addTo(map);
    });

    (map as any).off("mouseleave", "parcels-fill");
    (map as any).on("mouseleave", "parcels-fill", () => {
      map.getCanvas().style.cursor = "";
      if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
    });
  }, []);

  const loadParcels = useCallback(async (map: maplibregl.Map) => {
    try {
      let geojson = cachedGeoJson.current;
      if (!geojson) {
        const res = await apiClient.get("/api/parcels?limit=1000");
        geojson = res.data;
        cachedGeoJson.current = geojson;
      }
      setupParcelLayers(map, geojson);
      setParcelCount(geojson.features?.length || 0);
      return geojson;
    } catch (err) {
      console.error("Failed to load parcels:", err);
      return null;
    }
  }, [setupParcelLayers]);

  const loadLayer = useCallback(async (map: maplibregl.Map, layerId: string) => {
    if (!map) return;
    const sourceId = `layer-${layerId}`;

    try {
      let geojson = cachedLayersData.current[layerId];
      if (!geojson) {
        const res = await apiClient.get(`/api/v1/layers/${layerId}`);
        geojson = res.data;
        cachedLayersData.current[layerId] = geojson;
      }

      // Check if this layer is still meant to be enabled
      const isEnabled = layersRef.current.find((l) => l.id === layerId)?.enabled;
      if (!isEnabled) return;

      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, { type: "geojson", data: geojson });
      }

      const config = LAYER_CONFIGS.find((l) => l.id === layerId);
      const beforeLayer = map.getLayer("parcels-fill") ? "parcels-fill" : undefined;

      if (!map.getLayer(`${sourceId}-fill`)) {
        map.addLayer({
          id: `${sourceId}-fill`,
          type: "fill",
          source: sourceId,
          paint: {
            "fill-color": config?.color || "#888",
            "fill-opacity": 0.35,
          },
        }, beforeLayer);
      }

      if (!map.getLayer(`${sourceId}-outline`)) {
        map.addLayer({
          id: `${sourceId}-outline`,
          type: "line",
          source: sourceId,
          paint: {
            "line-color": config?.color || "#888",
            "line-width": 2,
            "line-dasharray": [3, 2],
            "line-opacity": 0.85,
          },
        }, beforeLayer);
      }

      // Interactive hover for spatial layers
      (map as any).off("mousemove", `${sourceId}-fill`);
      (map as any).on("mousemove", `${sourceId}-fill`, (e: any) => {
        const f = e.features?.[0];
        if (!f) return;
        const pr = f.properties || {};
        if (layerPopupRef.current) layerPopupRef.current.remove();

        let popupContent = "";
        if (layerId === "land-use") {
          popupContent = `<div style="font-size:11px;font-weight:600;color:#FFA726">🌾 ${pr.zone_name || pr.zone_code || "Land Use Zone"}</div>`;
        } else if (layerId === "master-plan") {
          popupContent = `<div style="font-size:11px;font-weight:600;color:#AB47BC">📐 ${pr.zone_name || "Master Plan Zone"}</div><div style="font-size:10px;color:#8b949e">Permitted: ${pr.permitted_use || "Standard"} • FAR: ${pr.max_far || "—"}</div>`;
        } else if (layerId === "restrictions") {
          popupContent = `<div style="font-size:11px;font-weight:600;color:#EF5350">⚠️ ${pr.restriction_name || "Restriction Zone"}</div><div style="font-size:10px;color:#8b949e">${pr.restriction_type || ""} [${pr.severity || ""}]</div>`;
        }

        if (popupContent) {
          layerPopupRef.current = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 8 })
            .setLngLat(e.lngLat)
            .setHTML(`<div style="font-family:Inter,sans-serif;line-height:1.4">${popupContent}</div>`)
            .addTo(map);
        }
      });

      (map as any).off("mouseleave", `${sourceId}-fill`);
      (map as any).on("mouseleave", `${sourceId}-fill`, () => {
        if (layerPopupRef.current) { layerPopupRef.current.remove(); layerPopupRef.current = null; }
      });
    } catch (err) {
      console.error(`Failed to load layer ${layerId}:`, err);
    }
  }, []);

  const removeLayer = useCallback((map: maplibregl.Map, layerId: string) => {
    if (!map) return;
    const sourceId = `layer-${layerId}`;
    try {
      if (layerPopupRef.current) { layerPopupRef.current.remove(); layerPopupRef.current = null; }
      if (map.getLayer(`${sourceId}-fill`)) map.removeLayer(`${sourceId}-fill`);
      if (map.getLayer(`${sourceId}-outline`)) map.removeLayer(`${sourceId}-outline`);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    } catch (err) {
      console.warn(`Error removing layer ${layerId}:`, err);
    }
  }, []);

  const toggleLayer = useCallback((layerId: string) => {
    setLayers((prev) => {
      const updated = prev.map((l) => (l.id === layerId ? { ...l, enabled: !l.enabled } : l));
      layersRef.current = updated;

      const target = updated.find((l) => l.id === layerId);
      const newState = target?.enabled ?? false;
      const map = mapRef.current;
      if (!map) return updated;

      if (layerId === "parcels") {
        const vis = newState ? "visible" : "none";
        if (map.getLayer("parcels-fill")) map.setLayoutProperty("parcels-fill", "visibility", vis);
        if (map.getLayer("parcels-outline")) map.setLayoutProperty("parcels-outline", "visibility", vis);
        if (map.getLayer("parcels-labels")) map.setLayoutProperty("parcels-labels", "visibility", vis);
        if (map.getLayer("parcels-highlight")) map.setLayoutProperty("parcels-highlight", "visibility", vis);
      } else if (newState) {
        loadLayer(map, layerId);
      } else {
        removeLayer(map, layerId);
      }

      return updated;
    });
  }, [loadLayer, removeLayer]);

  // Switch basemap
  const changeBasemap = (styleId: string) => {
    const map = mapRef.current;
    if (!map) return;
    const styleObj = BASEMAP_DEFINITIONS[styleId];
    if (!styleObj) return;

    setCurrentBasemap(styleId);
    map.setStyle(styleObj);

    const reapply = async () => {
      await loadParcels(map);
      if (selectedParcelRef.current?.parcel?.parcel_id && map.getLayer("parcels-highlight")) {
        map.setFilter("parcels-highlight", ["==", "parcel_id", selectedParcelRef.current.parcel.parcel_id]);
      }
      layersRef.current
        .filter((l) => l.id !== "parcels" && l.enabled)
        .forEach((l) => loadLayer(map, l.id));
    };

    map.once("styledata", reapply);
  };

  // Search
  const handleSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await apiClient.get(`/api/v1/search?q=${encodeURIComponent(q)}&limit=8`);
      setSearchResults(res.data.results || []);
      setShowSearch(true);
    } catch { setSearchResults([]); }
  }, []);

  const flyToParcel = useCallback((parcelId: string, lat: number, lng: number) => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center: [lng, lat], zoom: 17, duration: 1500 });
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);

    setTimeout(async () => {
      map.setFilter("parcels-highlight", ["==", "parcel_id", parcelId]);
      setLoading(true);
      setActiveTab("overview");
      try {
        const res = await apiClient.get(`/api/parcels/${parcelId}`);
        setSelectedParcel(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 1600);
  }, []);

  const resetView = () => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center: [86.120, 26.360], zoom: 15, duration: 1200 });
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const initialStyle = BASEMAP_DEFINITIONS[currentBasemap] || BASEMAP_DEFINITIONS.dark;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: initialStyle,
      center: [86.120, 26.360],
      zoom: 15,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 200 }), "bottom-right");

    map.on("load", async () => {
      console.log("[Map] Map loaded event fired");
      await loadParcels(map);

      // Check for URL params
      const paramParcel = searchParams.get("parcel");
      const paramLat = searchParams.get("lat");
      const paramLng = searchParams.get("lng");
      if (paramParcel && paramLat && paramLng) {
        flyToParcel(paramParcel, parseFloat(paramLat), parseFloat(paramLng));
      }
    });

    (window as any)._map = map;
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadParcels, searchParams, flyToParcel]);

  const p = selectedParcel?.parcel;
  const rules = selectedParcel?.rules_evaluation;

  return (
    <>
      {/* Search Bar & Map Controls Header */}
      <div style={mapStyles.searchBar}>
        <span style={{ fontSize: 16, color: "#484f58" }}>🔍</span>
        <input
          style={mapStyles.searchInput}
          placeholder="Search ULPIN, Survey No., Owner Name..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); handleSearch(e.target.value); }}
          onFocus={() => searchResults.length > 0 && setShowSearch(true)}
        />
        
        {/* Basemap Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {BASEMAP_STYLES.map((b) => (
            <button
              key={b.id}
              onClick={() => changeBasemap(b.id)}
              style={{
                ...mapStyles.basemapBtn,
                background: currentBasemap === b.id ? "var(--brand-gradient)" : "var(--bg-elevated)",
                color: currentBasemap === b.id ? "#fff" : "var(--text-secondary)",
              }}
            >
              {b.label}
            </button>
          ))}
        </div>

        <button onClick={resetView} style={mapStyles.basemapBtn} title="Reset camera to pilot extent">
          🎯 Reset View
        </button>

        <span style={{ fontSize: 12, color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
          {parcelCount} parcels
        </span>

        {/* Search Results Dropdown */}
        {showSearch && searchResults.length > 0 && (
          <div style={mapStyles.searchDropdown}>
            {searchResults.map((r: any) => (
              <div
                key={r.parcel_id}
                style={mapStyles.searchResult}
                onClick={() => flyToParcel(r.parcel_id, r.center.lat, r.center.lng)}
                onMouseOver={(e) => (e.currentTarget.style.background = "#161b22")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#58a6ff", fontFamily: "monospace" }}>{r.ulpin}</div>
                  <div style={{ fontSize: 11, color: "#8b949e" }}>
                    Survey: {r.survey_number} • {Number(r.area).toLocaleString()} sqm{r.owner_name ? ` • ${r.owner_name}` : ""}
                  </div>
                </div>
                <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: LAND_TYPE_COLORS[r.land_type] || "#607D8B", color: "#fff" }}>
                  {r.land_type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", flex: 1, position: "relative", overflow: "hidden" }}>
        {/* Layer Panel */}
        {showLayers && (
          <div style={mapStyles.layerPanel}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderBottom: "1px solid #21262d" }}>
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>LAYERS</span>
              <button style={mapStyles.ghostBtn} onClick={() => setShowLayers(false)}>✕</button>
            </div>
            {["Base", "Governance", "Environment"].map((cat) => {
              const catLayers = layers.filter((l) => l.category === cat);
              if (catLayers.length === 0) return null;
              return (
                <div key={cat} style={{ padding: "8px 14px" }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#484f58", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>{cat}</div>
                  {catLayers.map((l) => (
                    <label key={l.id} style={mapStyles.layerItem}>
                      <input
                        type="checkbox"
                        checked={l.enabled}
                        onChange={() => toggleLayer(l.id)}
                        style={{ accentColor: l.color }}
                      />
                      <span>{l.icon}</span>
                      <span style={{ fontSize: 12, color: l.enabled ? "#c9d1d9" : "#484f58" }}>{l.label}</span>
                    </label>
                  ))}
                </div>
              );
            })}

            {/* Legend */}
            <div style={{ padding: "8px 14px", borderTop: "1px solid #21262d" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#484f58", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Land Classification</div>
              {Object.entries(LAND_TYPE_COLORS).map(([type, color]) => (
                <div key={type} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: "inline-block" }} />
                  <span style={{ fontSize: 11, color: "#c9d1d9" }}>{type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Layer toggle button when hidden */}
        {!showLayers && (
          <button style={{ ...mapStyles.ghostBtn, position: "absolute", top: 10, left: 10, zIndex: 5, background: "rgba(13,17,23,0.9)", padding: "8px 12px", borderRadius: 8, border: "1px solid #30363d" }} onClick={() => setShowLayers(true)}>
            🗂 Layers
          </button>
        )}

        {/* Map */}
        <div ref={mapContainer} style={{ flex: 1, height: "100%" }} />

        {/* Detail Panel */}
        {(selectedParcel || loading) && (
          <div style={mapStyles.detailPanel}>
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#8b949e" }}>
                <div className="animate-pulse" style={{ fontSize: 24 }}>🗺️</div>
                <p style={{ marginTop: 8 }}>Loading Land 360°...</p>
              </div>
            ) : selectedParcel ? (
              <>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #21262d" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5, color: "#FFD700" }}>LAND 360°</span>
                      {rules && (
                        <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 10, background: (STATUS_COLORS[rules.status] || "#666") + "33", color: STATUS_COLORS[rules.status] || "#888", fontWeight: 600 }}>
                          {rules.status}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "#58a6ff", fontFamily: "monospace", marginTop: 2 }}>{p?.ulpin}</div>
                  </div>
                  <button style={mapStyles.ghostBtn} onClick={() => { setSelectedParcel(null); mapRef.current?.setFilter("parcels-highlight", ["==", "parcel_id", ""]); }}>✕</button>
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", overflowX: "auto", borderBottom: "1px solid #21262d" }}>
                  {TABS.map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{
                      ...mapStyles.panelTab,
                      color: activeTab === tab ? "#58a6ff" : "#8b949e",
                      borderBottomColor: activeTab === tab ? "#58a6ff" : "transparent",
                    }}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div style={{ padding: "12px 16px", overflowY: "auto", flex: 1 }}>
                  {activeTab === "overview" && p && (
                    <div>
                      {/* Compliance Score */}
                      {rules && (
                        <div style={{ background: "#161b22", borderRadius: 8, padding: 12, marginBottom: 12, border: "1px solid #21262d" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: "#8b949e", textTransform: "uppercase", letterSpacing: 1 }}>Compliance</span>
                            <span style={{ fontSize: 18, fontWeight: 700, color: STATUS_COLORS[rules.status] }}>{rules.compliance_score}%</span>
                          </div>
                          <div style={{ height: 4, background: "#30363d", borderRadius: 4, marginTop: 6, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${rules.compliance_score}%`, background: STATUS_COLORS[rules.status], borderRadius: 4, transition: "width 0.5s" }} />
                          </div>
                        </div>
                      )}
                      {[
                        ["Parcel ID", p.parcel_id?.substring(0, 8) + "..."],
                        ["Survey / Khesra", p.survey_number],
                        ["Area", `${Number(p.area).toLocaleString()} ${p.area_unit || "sqm"}`],
                        ["Land Type", p.land_type],
                        ["District", p.district_code],
                      ].map(([l, v]) => (
                        <div key={l} style={mapStyles.field}>
                          <span style={mapStyles.fieldLabel}>{l}</span>
                          <span style={mapStyles.fieldValue}>{v}</span>
                        </div>
                      ))}

                      {/* Alerts */}
                      {rules?.alerts?.map((a: any, i: number) => (
                        <div key={i} style={{ padding: "6px 10px", borderRadius: 6, marginTop: 6, fontSize: 11, background: a.severity === "CRITICAL" ? "#f8514922" : "#d2992222", color: a.severity === "CRITICAL" ? "#f85149" : "#d29922", border: `1px solid ${a.severity === "CRITICAL" ? "#f8514933" : "#d2992233"}` }}>
                          {a.severity === "CRITICAL" ? "🚨" : "⚠️"} {a.message}
                        </div>
                      ))}

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
                        <Link href={`/parcel/${p.parcel_id}`} style={{ textAlign: "center", padding: "8px 12px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                          Full Land 360° →
                        </Link>
                        <Link href={`/services/ownership-verification?parcel=${p.ulpin}`} style={{ textAlign: "center", padding: "8px 12px", background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-default)", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                          Verify Title
                        </Link>
                      </div>
                    </div>
                  )}

                  {activeTab === "ownership" && (
                    <div>
                      {selectedParcel.ownership?.length > 0 ? selectedParcel.ownership.map((o: any, i: number) => (
                        <div key={i} style={{ background: "#161b22", borderRadius: 8, padding: 12, marginBottom: 8, border: "1px solid #21262d" }}>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{o.name}</div>
                          <div style={{ fontSize: 11, color: "#8b949e", marginTop: 2 }}>
                            {o.ownership_type || o.owner_type} • Share: {o.ownership_share ? `${(o.ownership_share * 100).toFixed(0)}%` : "—"}
                          </div>
                        </div>
                      )) : <p style={{ color: "#484f58", textAlign: "center", padding: 20 }}>No ownership records</p>}
                    </div>
                  )}

                  {activeTab === "ror" && (
                    <div>
                      {selectedParcel.ror ? (
                        <>
                          {[
                            ["Khata", selectedParcel.ror.khata_number],
                            ["Khesra", selectedParcel.ror.khesra_number],
                            ["Classification", selectedParcel.ror.land_classification],
                            ["Area", `${selectedParcel.ror.area} ${selectedParcel.ror.area_unit}`],
                            ["Revenue", `₹${selectedParcel.ror.revenue_amount}`],
                          ].map(([l, v]) => (
                            <div key={l} style={mapStyles.field}><span style={mapStyles.fieldLabel}>{l}</span><span style={mapStyles.fieldValue}>{v}</span></div>
                          ))}
                          <div style={mapStyles.field}>
                            <span style={mapStyles.fieldLabel}>Revenue Status</span>
                            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: selectedParcel.ror.revenue_status === "Paid" ? "#2ea04322" : "#f8514922", color: selectedParcel.ror.revenue_status === "Paid" ? "#2ea043" : "#f85149" }}>
                              {selectedParcel.ror.revenue_status}
                            </span>
                          </div>
                        </>
                      ) : <p style={{ color: "#484f58", textAlign: "center", padding: 20 }}>No RoR records</p>}
                    </div>
                  )}

                  {activeTab === "registration" && (
                    <div>
                      {selectedParcel.registrations?.length > 0 ? selectedParcel.registrations.map((r: any, i: number) => (
                        <div key={i} style={{ background: "#161b22", borderRadius: 8, padding: 12, marginBottom: 8, border: "1px solid #21262d" }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{r.transaction_type}</span>
                            <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 10, background: "#2ea04322", color: "#2ea043" }}>{r.status}</span>
                          </div>
                          <div style={{ fontSize: 11, color: "#8b949e", marginTop: 4 }}>
                            {r.registration_date} • ₹{Number(r.consideration_amount || 0).toLocaleString()} • {r.document_number}
                          </div>
                        </div>
                      )) : <p style={{ color: "#484f58", textAlign: "center", padding: 20 }}>No registrations</p>}
                    </div>
                  )}

                  {activeTab === "encumbrance" && (
                    <div>
                      {selectedParcel.encumbrances?.length > 0 ? selectedParcel.encumbrances.map((e: any, i: number) => (
                        <div key={i} style={{ background: "#161b22", borderRadius: 8, padding: 12, marginBottom: 8, border: "1px solid #21262d", borderLeft: `3px solid ${e.status === "Active" ? "#f85149" : "#2ea043"}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{e.encumbrance_type}</span>
                            <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 10, background: e.status === "Active" ? "#f8514922" : "#2ea04322", color: e.status === "Active" ? "#f85149" : "#2ea043" }}>{e.status}</span>
                          </div>
                          <div style={{ fontSize: 11, color: "#8b949e", marginTop: 4 }}>
                            {e.institution} • ₹{Number(e.amount || 0).toLocaleString()}
                          </div>
                        </div>
                      )) : <p style={{ color: "#2ea043", textAlign: "center", padding: 20, fontWeight: 600 }}>✅ No registered encumbrance found</p>}
                    </div>
                  )}

                  {activeTab === "building" && (
                    <div>
                      {selectedParcel.building_permissions?.length > 0 ? selectedParcel.building_permissions.map((b: any, i: number) => (
                        <div key={i} style={{ background: "#161b22", borderRadius: 8, padding: 12, marginBottom: 8, border: "1px solid #21262d" }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{b.building_type}</span>
                            <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 10, background: b.status === "Approved" ? "#2ea04322" : "#d2992222", color: b.status === "Approved" ? "#2ea043" : "#d29922" }}>{b.status}</span>
                          </div>
                          <div style={{ fontSize: 11, color: "#8b949e", marginTop: 4 }}>
                            {b.application_number} • {b.approved_area} sqm • {b.floors} floors
                          </div>
                        </div>
                      )) : <p style={{ color: "#484f58", textAlign: "center", padding: 20 }}>No building permissions</p>}
                    </div>
                  )}

                  {activeTab === "landuse" && (
                    <div>
                      {selectedParcel.spatial?.land_use?.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "#484f58", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Land Use Zones</div>
                          {selectedParcel.spatial.land_use.map((lu: any, i: number) => (
                            <div key={i} style={{ fontSize: 12, padding: "4px 8px", background: "#FFA72622", color: "#FFA726", borderRadius: 4, marginBottom: 4, display: "inline-block", marginRight: 4 }}>{lu.zone_name}</div>
                          ))}
                        </div>
                      )}
                      {selectedParcel.spatial?.master_plan?.length > 0 && (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "#484f58", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Master Plan</div>
                          {selectedParcel.spatial.master_plan.map((mp: any, i: number) => (
                            <div key={i} style={mapStyles.field}>
                              <span style={mapStyles.fieldLabel}>{mp.zone_name}</span>
                              <span style={mapStyles.fieldValue}>FAR: {mp.max_far || "—"}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {!selectedParcel.spatial?.land_use?.length && !selectedParcel.spatial?.master_plan?.length && (
                        <p style={{ color: "#484f58", textAlign: "center", padding: 20 }}>No land use data</p>
                      )}
                    </div>
                  )}

                  {activeTab === "tax" && (
                    <div>
                      {selectedParcel.tax?.length > 0 ? selectedParcel.tax.map((t: any, i: number) => (
                        <div key={i} style={mapStyles.field}>
                          <span style={mapStyles.fieldLabel}>{t.assessment_year}</span>
                          <span style={mapStyles.fieldValue}>₹{Number(t.tax_amount || 0).toLocaleString()} <span style={{ fontSize: 10, color: t.status === "Paid" ? "#2ea043" : "#f85149" }}>({t.status})</span></span>
                        </div>
                      )) : <p style={{ color: "#484f58", textAlign: "center", padding: 20 }}>No tax records</p>}
                    </div>
                  )}

                  {activeTab === "restrictions" && (
                    <div>
                      {selectedParcel.spatial?.restrictions?.length > 0 ? selectedParcel.spatial.restrictions.map((r: any, i: number) => (
                        <div key={i} style={{ padding: "8px 10px", borderRadius: 6, marginBottom: 6, fontSize: 12, background: r.severity === "HIGH" ? "#f8514922" : "#d2992222", color: r.severity === "HIGH" ? "#f85149" : "#d29922", border: `1px solid ${r.severity === "HIGH" ? "#f8514933" : "#d2992233"}` }}>
                          <div style={{ fontWeight: 600 }}>{r.restriction_name}</div>
                          <div style={{ fontSize: 11, marginTop: 2 }}>{r.restriction_type} • {r.severity}</div>
                        </div>
                      )) : <p style={{ color: "#2ea043", textAlign: "center", padding: 20, fontWeight: 600 }}>✅ No restrictions</p>}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}

export default function MapPage() {
  return (
    <div className="app-content no-padding" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>Loading map...</div>}>
        <MapContent />
      </Suspense>
    </div>
  );
}

const mapStyles: Record<string, React.CSSProperties> = {
  searchBar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 16px",
    background: "var(--bg-elevated)",
    borderBottom: "1px solid var(--border-default)",
    position: "relative",
    zIndex: 10,
  },
  searchInput: {
    flex: 1,
    background: "var(--bg-input)",
    border: "1px solid var(--border-default)",
    borderRadius: 8,
    padding: "8px 14px",
    color: "var(--text-primary)",
    fontSize: 13,
    fontFamily: "Inter, sans-serif",
    outline: "none",
  },
  basemapBtn: {
    padding: "5px 10px",
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 6,
    border: "1px solid var(--border-default)",
    background: "var(--bg-elevated)",
    color: "var(--text-secondary)",
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  },
  searchDropdown: {
    position: "absolute",
    top: "100%",
    left: 40,
    right: 320,
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-default)",
    borderRadius: 8,
    maxHeight: 320,
    overflowY: "auto" as const,
    zIndex: 20,
    boxShadow: "var(--shadow-md)",
  },
  searchResult: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    cursor: "pointer",
    borderBottom: "1px solid var(--border-subtle)",
    transition: "background 150ms",
  },
  layerPanel: {
    width: 220,
    background: "var(--bg-elevated)",
    borderRight: "1px solid var(--border-default)",
    overflowY: "auto" as const,
    flexShrink: 0,
  },
  layerItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "5px 0",
    cursor: "pointer",
    fontSize: 12,
  },
  detailPanel: {
    width: 380,
    background: "var(--bg-elevated)",
    borderLeft: "1px solid var(--border-default)",
    overflowY: "auto" as const,
    display: "flex",
    flexDirection: "column" as const,
    flexShrink: 0,
  },
  panelTab: {
    padding: "8px 10px",
    fontSize: 10,
    fontWeight: 500,
    background: "none",
    border: "none",
    borderBottom: "2px solid transparent",
    cursor: "pointer",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    fontFamily: "Inter, sans-serif",
    whiteSpace: "nowrap" as const,
  },
  ghostBtn: {
    background: "none",
    border: "none",
    color: "#8b949e",
    fontSize: 16,
    cursor: "pointer",
    padding: 4,
  },
  field: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "7px 0",
    borderBottom: "1px solid #21262d22",
  },
  fieldLabel: {
    fontSize: 11,
    color: "#8b949e",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 13,
    color: "#c9d1d9",
    fontWeight: 500,
  },
};
