/**
 * LandStack — Satellite Change Detection Engine (Step 14)
 * Analyzes Sentinel-2 / Landsat spectral changes and flags physical land modifications
 */

export interface SatelliteDetectionResult {
  parcel_id: string;
  ulpin: string;
  survey_number: string;
  change_type: "BUILT_UP_INCREASE" | "VEGETATION_LOSS" | "WATER_BODY_ENCROACHMENT" | "NEW_ROAD_ACCESS";
  confidence: number;
  area_affected_sqm: number;
  change_percentage: number;
  alert_level: "HIGH" | "MEDIUM" | "LOW";
  before_date: string;
  after_date: string;
  source_sensor: string;
  model_version: string;
  official_land_use: string;
  detected_land_use: string;
  explainability: string[];
}

export const SAMPLE_SATELLITE_DETECTIONS: Record<string, SatelliteDetectionResult> = {
  default: {
    parcel_id: "demo-p0",
    ulpin: "IN-BR-10-00000001-62",
    survey_number: "1420",
    change_type: "BUILT_UP_INCREASE",
    confidence: 0.89,
    area_affected_sqm: 450.0,
    change_percentage: 31.7,
    alert_level: "HIGH",
    before_date: "2024-03-10",
    after_date: "2026-08-12",
    source_sensor: "Sentinel-2 Multispectral (10m Bands 2,3,4,8) + YOLOv8-Seg",
    model_version: "land-change-v1.4",
    official_land_use: "Agricultural (Dhanhar-1)",
    detected_land_use: "Built-up Structure (RCC / Masonry)",
    explainability: [
      "NDVI dropped from +0.64 (dense crop) to +0.12 (impervious surface).",
      "Normalized Difference Built-up Index (NDBI) increased by +0.58.",
      "Building footprint segmentation detected a 2-storey rectangular outline of 450 sqm.",
      "Zero municipal building permission record found in governance schema."
    ]
  }
};
