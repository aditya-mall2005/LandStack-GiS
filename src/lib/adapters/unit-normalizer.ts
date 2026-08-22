/**
 * LandStack — Unit Normalization Engine (Step 15)
 * Converts all regional Indian land measurement units to canonical square meters (sq_m)
 */

export const UNIT_FACTORS_TO_SQM: Record<string, number> = {
  // Metric & International
  sq_m: 1,
  sqm: 1,
  "sq.m": 1,
  "square meter": 1,
  "square meters": 1,
  sq_ft: 0.092903,
  sqft: 0.092903,
  "square feet": 0.092903,
  acre: 4046.8564224,
  acres: 4046.8564224,
  hectare: 10000,
  hectares: 10000,
  ha: 10000,

  // Eastern India (Bihar, Bengal, Jharkhand)
  decimal: 40.4686,
  katha: 126.46, // Standard Bihar katha (approx 1361.25 sqft)
  bigha: 2529.28, // Standard Bihar bigha (20 katha)
  dhur: 6.32,

  // Southern India (Tamil Nadu, Karnataka, Andhra)
  cent: 40.4686, // 1/100th of an acre
  cents: 40.4686,
  ground: 222.967, // 2400 sqft
  guntha: 101.17, // 1/40th of an acre
  gunta: 101.17,
  ankanam: 6.689,

  // Northern India (Punjab, Haryana, Chandigarh, UP)
  marla: 25.2928, // Standard marla
  kanal: 505.857, // 20 marlas
  biswa: 41.8,
  killa: 4046.86,
};

export function normalizeArea(
  value: number | string,
  unit: string
): { area_sq_m: number; original_area: number; original_unit: string } {
  const numVal = typeof value === "number" ? value : parseFloat(String(value).replace(/,/g, "")) || 0;
  const cleanUnit = (unit || "sq_m").toLowerCase().trim();
  const factor = UNIT_FACTORS_TO_SQM[cleanUnit] || 1;
  const area_sq_m = Math.round(numVal * factor * 100) / 100;

  return {
    area_sq_m,
    original_area: numVal,
    original_unit: unit || "sq_m",
  };
}
