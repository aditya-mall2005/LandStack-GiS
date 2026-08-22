/**
 * LandStack — State Adapter Framework (Step 15)
 * Transforms heterogeneous state schemas & payloads into Canonical LandStack entities
 */

import { CanonicalParcel, StateAdapterConfig, DataQualityReport } from "./types";
import { normalizeArea } from "./unit-normalizer";

export const STATE_ADAPTER_REGISTRY: Record<string, StateAdapterConfig> = {
  BR: {
    state_code: "BR",
    state_name: "Bihar",
    ror_system_name: "Bihar Bhumi (Jamabandi / Khatiyan)",
    measurement_unit: "Decimal / Katha",
    admin_hierarchy: ["State (Bihar)", "District (Zila)", "Subdivision (Anumandal)", "Circle (Anchal)", "Village (Mauza)"],
    field_mapping: {
      survey_no: "khesra_number",
      khata_no: "khata_number",
      owner: "raiyat_name",
      father: "pita_ka_naam",
      area: "rakba",
      unit: "ikayi",
      land_type: "zamin_prakar",
      district: "zila",
      subdistrict: "anchal",
      village: "mauza",
      record_id: "jamabandi_panji_no"
    },
    unit_conversions: {
      decimal_to_sqm: 40.4686,
      katha_to_sqm: 126.46,
      bigha_to_sqm: 2529.28,
      acre_to_sqm: 4046.86
    },
    land_type_mapping: {
      "Dhanhar-1": "Agricultural (Paddy)",
      "Bhit": "Agricultural (Highland)",
      "Makaan": "Residential",
      "Dokan": "Commercial",
      "Pokhar": "Pond/Water Body",
      "Parti": "Wasteland"
    },
    sample_payload: {
      zila: "Madhubani",
      anchal: "Basopatti",
      mauza: "Arghawa",
      khesra_number: "1420",
      khata_number: "45",
      raiyat_name: "Rameshwar Prasad Yadav",
      pita_ka_naam: "Late Jamun Yadav",
      rakba: 35.5,
      ikayi: "decimal",
      zamin_prakar: "Dhanhar-1",
      jamabandi_panji_no: "JB-2026-BR-09881",
      bhu_lagan_status: "PAID_2025_26"
    }
  },
  TN: {
    state_code: "TN",
    state_name: "Tamil Nadu",
    ror_system_name: "Anyror / Tamil Nilam (Patta / Chitta)",
    measurement_unit: "Cent / Ground",
    admin_hierarchy: ["State (Tamil Nadu)", "District (Mavattam)", "Taluk (Vattam)", "Revenue Village (Gramam)"],
    field_mapping: {
      survey_no: "survey_subdivision",
      khata_no: "patta_number",
      owner: "urimaialar_peyar",
      father: "thantai_peyar",
      area: "parappalavu",
      unit: "alavu_alaghu",
      land_type: "nilam_vagai",
      district: "mavattam",
      subdistrict: "vattam",
      village: "gramam",
      record_id: "chitta_thodar_enn"
    },
    unit_conversions: {
      cent_to_sqm: 40.4686,
      ground_to_sqm: 222.967,
      acre_to_sqm: 4046.86,
      sqft_to_sqm: 0.0929
    },
    land_type_mapping: {
      "Nanjai": "Agricultural (Wet)",
      "Punjai": "Agricultural (Dry)",
      "Manai": "Residential Plot",
      "Kollai": "Orchard/Garden",
      "Poramboke": "Government Land"
    },
    sample_payload: {
      mavattam: "Coimbatore",
      vattam: "Sulur",
      gramam: "Kalangal",
      survey_subdivision: "248/1A",
      patta_number: "1104",
      urimaialar_peyar: "K. Subramanian",
      thantai_peyar: "Kandasamy",
      parappalavu: 52.0,
      alavu_alaghu: "cent",
      nilam_vagai: "Nanjai",
      chitta_thodar_enn: "TN-CHIT-2026-8812",
      kist_status: "CLEARED"
    }
  },
  CH: {
    state_code: "CH",
    state_name: "Chandigarh / Punjab",
    ror_system_name: "Jamabandi / Farz Record",
    measurement_unit: "Marla / Kanal",
    admin_hierarchy: ["UT / State", "District", "Tehsil", "Sub-Tehsil", "Hadbast / Village"],
    field_mapping: {
      survey_no: "khasra_number",
      khata_no: "khewat_khatoni",
      owner: "khatedar_malik",
      father: "walid_naam",
      area: "rakba_area",
      unit: "paimana",
      land_type: "qism_zameen",
      district: "zila_district",
      subdistrict: "tehsil",
      village: "mauza_hadbast",
      record_id: "inteqal_order_no"
    },
    unit_conversions: {
      marla_to_sqm: 25.2928,
      kanal_to_sqm: 505.857,
      biswa_to_sqm: 41.8,
      bigha_to_sqm: 836.1,
      acre_to_sqm: 4046.86
    },
    land_type_mapping: {
      "Nehri": "Agricultural (Canal Irrigated)",
      "Chahi": "Agricultural (Well Irrigated)",
      "Gair Mumkin": "Built-up / Non-Agricultural",
      "Barani": "Agricultural (Rainfed)"
    },
    sample_payload: {
      zila_district: "Chandigarh (U.T.)",
      tehsil: "Chandigarh",
      mauza_hadbast: "Mani Majra",
      khasra_number: "88/12/1",
      khewat_khatoni: "104/230",
      khatedar_malik: "Harpreet Singh Sandhu",
      walid_naam: "S. Balwant Singh",
      rakba_area: 16.0,
      paimana: "marla",
      qism_zameen: "Gair Mumkin",
      inteqal_order_no: "INT-CH-2026-4401",
      fard_issued: "YES"
    }
  }
};

/**
 * Calculates Data Quality Score for a payload
 */
export function evaluateDataQuality(
  raw: Record<string, any>,
  config: StateAdapterConfig
): DataQualityReport {
  const issues: string[] = [];
  const fm = config.field_mapping;

  // 1. Completeness Check
  const requiredKeys = [fm.survey_no, fm.owner, fm.area, fm.unit, fm.district, fm.village];
  let presentCount = 0;
  for (const key of requiredKeys) {
    if (raw[key] !== undefined && raw[key] !== null && String(raw[key]).trim() !== "") {
      presentCount++;
    } else {
      issues.push(`Missing essential field: ${key}`);
    }
  }
  const completeness = Math.round((presentCount / requiredKeys.length) * 100);

  // 2. Consistency & Format Check
  let consistencyPoints = 100;
  const areaVal = parseFloat(String(raw[fm.area] || 0));
  if (isNaN(areaVal) || areaVal <= 0) {
    consistencyPoints -= 40;
    issues.push(`Invalid area value: ${raw[fm.area]}`);
  }
  if (!raw[fm.survey_no] || !/^[0-9a-zA-Z\/\-_]+$/.test(String(raw[fm.survey_no]))) {
    consistencyPoints -= 20;
    issues.push(`Survey number format warning: ${raw[fm.survey_no]}`);
  }
  const consistency = Math.max(0, consistencyPoints);

  // 3. Validity (Zoning / Unit Check)
  let validityPoints = 100;
  const unit = String(raw[fm.unit] || "").toLowerCase();
  if (!config.unit_conversions[`${unit}_to_sqm`] && unit !== "sq_m" && unit !== "sqm") {
    validityPoints -= 30;
    issues.push(`Unrecognized unit '${raw[fm.unit]}' mapped using fallback factor.`);
  }
  const validity = Math.max(0, validityPoints);

  const overall_score = Math.round((completeness * 0.45) + (consistency * 0.35) + (validity * 0.20));

  return {
    completeness,
    consistency,
    validity,
    overall_score,
    issues
  };
}

/**
 * Transforms any state-specific raw payload into canonical LandStack entity
 */
export function normalizeStatePayload(
  stateCode: string,
  rawPayload: Record<string, any>
): { canonical: CanonicalParcel; quality: DataQualityReport; config: StateAdapterConfig } {
  const config = STATE_ADAPTER_REGISTRY[stateCode] || STATE_ADAPTER_REGISTRY.BR;
  const fm = config.field_mapping;
  const quality = evaluateDataQuality(rawPayload, config);

  const rawArea = rawPayload[fm.area] || 0;
  const rawUnit = rawPayload[fm.unit] || config.measurement_unit.split("/")[0].trim();
  const normalizedArea = normalizeArea(rawArea, rawUnit);

  const rawLandType = rawPayload[fm.land_type] || "General";
  const mappedLandType = config.land_type_mapping[rawLandType] || rawLandType;

  const canonical: CanonicalParcel = {
    state_code: config.state_code,
    district: rawPayload[fm.district] || "Unknown District",
    subdistrict: rawPayload[fm.subdistrict] || "Unknown Subdistrict",
    village: rawPayload[fm.village] || "Unknown Village",
    survey_number: String(rawPayload[fm.survey_no] || ""),
    original_area: normalizedArea.original_area,
    original_unit: normalizedArea.original_unit,
    area_sq_m: normalizedArea.area_sq_m,
    land_use: mappedLandType,
    owner_name: rawPayload[fm.owner] || "Unassigned Holder",
    father_husband: rawPayload[fm.father] || undefined,
    source_system: config.ror_system_name,
    source_record_id: String(rawPayload[fm.record_id] || `REC-${Date.now()}`),
    raw_payload: rawPayload,
    data_quality_score: quality.overall_score,
    created_at: new Date().toISOString()
  };

  return { canonical, quality, config };
}
