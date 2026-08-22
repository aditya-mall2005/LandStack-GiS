/**
 * LandStack — State Adapter & Canonical Schema Types (Step 15)
 */

export interface CanonicalParcel {
  parcel_id?: string;
  ulpin?: string;
  state_code: string;
  district: string;
  subdistrict: string;
  village: string;
  survey_number: string;
  original_area: number;
  original_unit: string;
  area_sq_m: number;
  land_use: string;
  owner_name: string;
  father_husband?: string;
  source_system: string;
  source_record_id: string;
  raw_payload: Record<string, any>;
  data_quality_score: number;
  created_at?: string;
}

export interface StateAdapterConfig {
  state_code: string;
  state_name: string;
  ror_system_name: string;
  measurement_unit: string;
  admin_hierarchy: string[];
  field_mapping: Record<string, string>;
  unit_conversions: Record<string, number>;
  land_type_mapping: Record<string, string>;
  sample_payload: Record<string, any>;
}

export interface DataQualityReport {
  completeness: number; // % of required fields present
  consistency: number;  // % valid formats
  validity: number;     // % within geometric / numeric bounds
  overall_score: number;
  issues: string[];
}
