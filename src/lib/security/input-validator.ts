/**
 * LandStack — Input Validation & SQL Injection Guard (Step 16.15, 16.16)
 */

export interface ValidationResult {
  valid: boolean;
  sanitizedValue?: any;
  error?: string;
}

export function validateBbox(bboxStr: string): ValidationResult {
  if (!bboxStr) return { valid: false, error: "Bounding box required (minLon,minLat,maxLon,maxLat)" };
  const parts = bboxStr.split(",").map((p) => parseFloat(p.trim()));
  if (parts.length !== 4 || parts.some((n) => isNaN(n))) {
    return { valid: false, error: "Invalid bbox format. Expected 4 floating point numbers: minLon,minLat,maxLon,maxLat" };
  }

  const [minLon, minLat, maxLon, maxLat] = parts;

  // Longitude range: -180 to +180
  if (minLon < -180 || maxLon > 180 || minLon > maxLon) {
    return { valid: false, error: "Longitude must be within [-180, 180] and minLon <= maxLon" };
  }

  // Latitude range: -90 to +90
  if (minLat < -90 || maxLat > 90 || minLat > maxLat) {
    return { valid: false, error: "Latitude must be within [-90, 90] and minLat <= maxLat" };
  }

  return { valid: true, sanitizedValue: [minLon, minLat, maxLon, maxLat] };
}

export function validateUlpin(ulpin: string): ValidationResult {
  if (!ulpin) return { valid: false, error: "ULPIN required" };
  const clean = ulpin.trim();
  // Standard ULPIN format e.g. IN-BR-10-00000001-62 or alphanumeric 14-24 chars
  const ulpinRegex = /^[A-Z0-9\-_]{6,32}$/i;
  if (!ulpinRegex.test(clean)) {
    return { valid: false, error: "Invalid ULPIN format. Must be alphanumeric (6-32 chars)." };
  }
  return { valid: true, sanitizedValue: clean };
}

export function sanitizeText(input: string): string {
  if (!input) return "";
  return String(input)
    .replace(/[<>'"`;]/g, "") // Strip potential script / injection chars
    .trim();
}
