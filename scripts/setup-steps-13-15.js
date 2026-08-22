require('dotenv').config();
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();
  try {
    console.log('--- Initializing Step 13, 14, 15 Schema & Seed Data ---');

    await client.query(`
      CREATE SCHEMA IF NOT EXISTS governance;
      CREATE SCHEMA IF NOT EXISTS land;
      CREATE SCHEMA IF NOT EXISTS metadata;
      CREATE SCHEMA IF NOT EXISTS audit;

      -- 1. Workflow Definitions & Steps (Step 13)
      CREATE TABLE IF NOT EXISTS governance.workflow_definitions (
        workflow_id VARCHAR(64) PRIMARY KEY,
        workflow_name VARCHAR(128) NOT NULL,
        description TEXT,
        target_sla_days INT DEFAULT 5,
        steps JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 2. Enhanced Service Requests table
      CREATE TABLE IF NOT EXISTS governance.service_requests (
        request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_no VARCHAR(64) UNIQUE NOT NULL,
        service_type VARCHAR(64) NOT NULL,
        parcel_id UUID REFERENCES gis.parcels(parcel_id) ON DELETE SET NULL,
        parcel_ulpin VARCHAR(64),
        applicant_name VARCHAR(128) NOT NULL DEFAULT 'Ramesh Kumar',
        applicant_email VARCHAR(128),
        applicant_phone VARCHAR(32),
        department VARCHAR(64) NOT NULL,
        purpose VARCHAR(256),
        details JSONB DEFAULT '{}'::jsonb,
        priority VARCHAR(16) DEFAULT 'NORMAL',
        status VARCHAR(32) DEFAULT 'SUBMITTED',
        current_step VARCHAR(64) DEFAULT 'Document Verification',
        assigned_officer VARCHAR(128),
        target_sla_days INT DEFAULT 5,
        sla_deadline TIMESTAMPTZ,
        sla_status VARCHAR(32) DEFAULT 'ON_TRACK',
        escalated BOOLEAN DEFAULT FALSE,
        escalation_reason TEXT,
        precheck_results JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Add columns if table already existed
      ALTER TABLE governance.service_requests ADD COLUMN IF NOT EXISTS current_step VARCHAR(64) DEFAULT 'Document Verification';
      ALTER TABLE governance.service_requests ADD COLUMN IF NOT EXISTS target_sla_days INT DEFAULT 5;
      ALTER TABLE governance.service_requests ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMPTZ;
      ALTER TABLE governance.service_requests ADD COLUMN IF NOT EXISTS sla_status VARCHAR(32) DEFAULT 'ON_TRACK';
      ALTER TABLE governance.service_requests ADD COLUMN IF NOT EXISTS escalated BOOLEAN DEFAULT FALSE;
      ALTER TABLE governance.service_requests ADD COLUMN IF NOT EXISTS escalation_reason TEXT;
      ALTER TABLE governance.service_requests ADD COLUMN IF NOT EXISTS precheck_results JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE governance.service_requests ADD COLUMN IF NOT EXISTS applicant_email VARCHAR(128);
      ALTER TABLE governance.service_requests ADD COLUMN IF NOT EXISTS applicant_phone VARCHAR(32);

      -- 3. Application History / Audit Trail
      CREATE TABLE IF NOT EXISTS governance.application_history (
        history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_no VARCHAR(64) NOT NULL,
        status VARCHAR(32) NOT NULL,
        action VARCHAR(256) NOT NULL,
        performed_by VARCHAR(128) NOT NULL,
        role VARCHAR(64) DEFAULT 'OFFICER',
        department VARCHAR(64),
        comments TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE governance.application_history ADD COLUMN IF NOT EXISTS role VARCHAR(64) DEFAULT 'OFFICER';
      ALTER TABLE governance.application_history ADD COLUMN IF NOT EXISTS department VARCHAR(64);
      ALTER TABLE governance.application_history ADD COLUMN IF NOT EXISTS comments TEXT;

      -- 4. Document Intelligence & Extractions (Step 14)
      CREATE TABLE IF NOT EXISTS governance.document_extractions (
        extraction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_name VARCHAR(256) NOT NULL,
        document_type VARCHAR(64) NOT NULL,
        parcel_id UUID REFERENCES gis.parcels(parcel_id) ON DELETE SET NULL,
        extracted_fields JSONB NOT NULL,
        verification_status VARCHAR(32) DEFAULT 'PENDING',
        confidence_score NUMERIC(5,2) DEFAULT 0.95,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE land.data_conflicts ALTER COLUMN source_a TYPE VARCHAR(128);
      ALTER TABLE land.data_conflicts ALTER COLUMN source_b TYPE VARCHAR(128);
      ALTER TABLE land.data_conflicts ALTER COLUMN conflict_type TYPE VARCHAR(128);
      ALTER TABLE land.data_conflicts ALTER COLUMN severity TYPE VARCHAR(64);

      ALTER TABLE land.satellite_detections ALTER COLUMN source TYPE VARCHAR(128);
      ALTER TABLE land.satellite_detections ALTER COLUMN change_type TYPE VARCHAR(128);

      -- 5. Transaction Anomalies & Risk Scoring (Step 14)
      CREATE TABLE IF NOT EXISTS land.transaction_anomalies (
        anomaly_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        parcel_id UUID REFERENCES gis.parcels(parcel_id) ON DELETE CASCADE,
        parcel_ulpin VARCHAR(64),
        risk_score INT DEFAULT 0,
        risk_level VARCHAR(16) DEFAULT 'LOW',
        anomaly_type VARCHAR(64) NOT NULL,
        contributing_factors JSONB NOT NULL,
        recommended_action TEXT,
        status VARCHAR(32) DEFAULT 'OPEN',
        detected_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Fetch sample parcels for realistic linkages
    const parcelsRes = await client.query('SELECT parcel_id, ulpin, survey_number, land_type, area FROM gis.parcels LIMIT 15');
    const pList = parcelsRes.rows;
    console.log(`Found ${pList.length} parcels for Step 13-15 seed linkages.`);

    const p0 = pList[0] || { parcel_id: null, ulpin: 'IN-BR-10-00000001-62', survey_number: '1420' };
    const p1 = pList[1] || { parcel_id: null, ulpin: 'IN-BR-10-00000002-73', survey_number: '389' };
    const p2 = pList[2] || { parcel_id: null, ulpin: 'IN-BR-10-00000003-84', survey_number: '822' };
    const p3 = pList[3] || { parcel_id: null, ulpin: 'IN-BR-10-00000004-95', survey_number: '1032' };
    const p4 = pList[4] || { parcel_id: null, ulpin: 'IN-BR-10-00000005-06', survey_number: '1465' };

    // Seed Workflow Definitions
    await client.query(`
      INSERT INTO governance.workflow_definitions (workflow_id, workflow_name, description, target_sla_days, steps)
      VALUES 
      ('ownership_verification', 'Ownership Verification', 'Cross-verifies Record of Rights (Jamabandi), registered deeds, and physical cadastral boundary.', 3, 
       '[
         {"order": 1, "name": "Document Verification", "department": "Revenue", "required_role": "LAND_OFFICER"},
         {"order": 2, "name": "Spatial & RoR Cross-Check", "department": "Revenue", "required_role": "LAND_OFFICER"},
         {"order": 3, "name": "Final Certification", "department": "Revenue", "required_role": "LAND_OFFICER"}
       ]'::jsonb),
      ('mutation', 'Property Mutation', 'Ownership title transfer following sale, inheritance, or partition with mandatory dispute check.', 7,
       '[
         {"order": 1, "name": "Application & Deed Intake", "department": "Revenue", "required_role": "LAND_OFFICER"},
         {"order": 2, "name": "Dispute & Encumbrance Clearance", "department": "Registration", "required_role": "REGISTRATION_OFFICER"},
         {"order": 3, "name": "Field Inspection & Notice", "department": "Revenue", "required_role": "SURVEYOR"},
         {"order": 4, "name": "RoR Jamabandi Update", "department": "Revenue", "required_role": "LAND_OFFICER"}
       ]'::jsonb),
      ('building_permission', 'Building Construction Permission', 'Multi-department statutory approval across Planning, Municipality, and Environment.', 10,
       '[
         {"order": 1, "name": "Zoning & Land Use Check", "department": "Planning", "required_role": "PLANNING_OFFICER"},
         {"order": 2, "name": "Structural & FAR Compliance", "department": "Municipality", "required_role": "MUNICIPALITY_OFFICER"},
         {"order": 3, "name": "Environmental Buffer Clearance", "department": "Environment", "required_role": "PLANNING_OFFICER"},
         {"order": 4, "name": "Sanction Order Issuance", "department": "Municipality", "required_role": "MUNICIPALITY_OFFICER"}
       ]'::jsonb),
      ('encumbrance_certificate', 'Encumbrance Certificate (Non-Encumbrance)', 'Search and certification of registered liabilities, mortgages, and bank attachments.', 2,
       '[
         {"order": 1, "name": "Deed Index Search (13+ Yrs)", "department": "Registration", "required_role": "REGISTRATION_OFFICER"},
         {"order": 2, "name": "Bank Charge Clearance", "department": "Registration", "required_role": "REGISTRATION_OFFICER"},
         {"order": 3, "name": "Digital Certificate Issuance", "department": "Registration", "required_role": "REGISTRATION_OFFICER"}
       ]'::jsonb)
      ON CONFLICT (workflow_id) DO UPDATE SET 
        workflow_name = EXCLUDED.workflow_name,
        steps = EXCLUDED.steps;
    `);

    // Seed Applications across departments with SLA statuses
    await client.query(`
      INSERT INTO governance.service_requests 
      (application_no, service_type, parcel_id, parcel_ulpin, applicant_name, applicant_email, applicant_phone, department, purpose, details, priority, status, current_step, assigned_officer, target_sla_days, sla_deadline, sla_status, escalated, escalation_reason, precheck_results, created_at, updated_at)
      VALUES
      ('LS-2026-00123', 'Ownership Verification', $1, $2, 'Ramesh Kumar', 'ramesh.kumar@bihar.gov.in', '+91 98765 43210', 'Revenue', 'Bank loan collateral verification', 
       '{"requested_by": "State Bank of India", "loan_account": "SBI-AGRI-88992"}'::jsonb, 
       'NORMAL', 'UNDER_REVIEW', 'Spatial & RoR Cross-Check', 'Vikram Singh', 3, NOW() + INTERVAL '1 day', 'ON_TRACK', FALSE, NULL,
       '{"ownership_match": true, "ror_match": true, "encumbrance_flag": false, "flood_zone_flag": false, "overall_status": "PASS"}'::jsonb,
       NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 hours'),

      ('LS-2026-00120', 'Property Mutation', $3, $4, 'Sita Devi', 'sita.devi@outlook.com', '+91 98112 33445', 'Revenue', 'Inheritance mutation under Jamabandi',
       '{"mutation_type": "Varasat (Inheritance)", "prior_owner": "Late Ramadhar Singh", "legal_heir_count": 2}'::jsonb,
       'HIGH', 'UNDER_REVIEW', 'Dispute & Encumbrance Clearance', 'Vikram Singh', 7, NOW() - INTERVAL '2 days', 'SLA_BREACHED', TRUE, 'Pending bank NOC verification for over 7 business days. Escalated to District Revenue Head.',
       '{"ownership_match": true, "ror_match": true, "encumbrance_flag": true, "dispute_flag": false, "overall_status": "REQUIRES_REVIEW"}'::jsonb,
       NOW() - INTERVAL '9 days', NOW() - INTERVAL '1 day'),

      ('LS-2026-00115', 'Building Permission', $5, $6, 'Sunil Sharma', 'sunil.sharma@gmail.com', '+91 99001 22334', 'Municipality', 'G+2 Residential construction sanction',
       '{"floors": 3, "proposed_builtup_sqm": 320, "structure": "RCC Frame", "parking_slots": 2}'::jsonb,
       'HIGH', 'DOCUMENT_VERIFICATION', 'Structural & FAR Compliance', 'Sunita Rao', 10, NOW() + INTERVAL '3 days', 'ON_TRACK', FALSE, NULL,
       '{"land_use_match": true, "far_allowed": 2.5, "far_proposed": 1.8, "flood_buffer_conflict": true, "overall_status": "CONFLICT_DETECTED"}'::jsonb,
       NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 hours'),

      ('LS-2026-00118', 'Encumbrance Certificate', $7, $8, 'Mohan Prasad', 'mohan.prasad@yahoo.com', '+91 97766 55443', 'Registration', 'Sale deed title search 2012-2026',
       '{"search_period_years": 14, "purpose": "Property Sale"}'::jsonb,
       'NORMAL', 'SUBMITTED', 'Deed Index Search (13+ Yrs)', 'Priya Sharma', 2, NOW() + INTERVAL '12 hours', 'APPROACHING_SLA', FALSE, NULL,
       '{"registered_deeds": 2, "mortgage_found": false, "overall_status": "PASS"}'::jsonb,
       NOW() - INTERVAL '1.5 days', NOW() - INTERVAL '1.5 days'),

      ('LS-2026-00116', 'Land Use Certificate', $9, $10, 'Geeta Devi', 'geeta.devi@gmail.com', '+91 94556 12345', 'Planning', 'Zoning verification for agro-processing warehouse',
       '{"proposed_use": "Agro-processing Unit", "power_required_kva": 25}'::jsonb,
       'NORMAL', 'APPROVED', 'Sanction Order Issuance', 'Anand Verma', 5, NOW() - INTERVAL '1 day', 'COMPLETED', FALSE, NULL,
       '{"master_plan_zone": "Agro-Industrial Subzone", "permitted": true, "overall_status": "PASS"}'::jsonb,
       NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day')
      ON CONFLICT (application_no) DO UPDATE SET
        status = EXCLUDED.status,
        precheck_results = EXCLUDED.precheck_results,
        sla_status = EXCLUDED.sla_status,
        escalated = EXCLUDED.escalated;
    `, [
      p0.parcel_id, p0.ulpin,
      p1.parcel_id, p1.ulpin,
      p2.parcel_id, p2.ulpin,
      p3.parcel_id, p3.ulpin,
      p4.parcel_id, p4.ulpin
    ]);

    // Seed Data Conflicts (Step 14)
    await client.query(`
      INSERT INTO land.data_conflicts (parcel_id, conflict_type, severity, source_a, value_a, source_b, value_b, detected_at, resolved)
      VALUES
      ($1, 'AREA_MISMATCH', 'HIGH', 'Cadastral GIS (Spatial)', '1,420.00 sqm', 'Registration Deed (Sub-Registrar)', '1,350.00 sqm (Difference: 70 sqm)', NOW() - INTERVAL '3 days', FALSE),
      ($2, 'OWNERSHIP_MISMATCH', 'CRITICAL', 'Jamabandi RoR (Revenue)', 'Sita Devi & Late Ramadhar Singh', 'Bank Mortgage Lien (State Bank)', 'Late Ramadhar Singh (Single Holder)', NOW() - INTERVAL '2 days', FALSE),
      ($3, 'LAND_USE_VIOLATION', 'HIGH', 'Official RoR Classification', 'Agricultural (Fasli)', 'Master Plan 2035 Zoning', 'Commercial Arterial Corridor (Mixed Use)', NOW() - INTERVAL '5 days', FALSE),
      ($4, 'UNAUTHORIZED_DEVELOPMENT', 'CRITICAL', 'Municipality Sanction DB', 'No Approved Building Permission', 'Satellite AI Detection (Sentinel-2)', '320 sqm 2-Storey RCC Structure Detected', NOW() - INTERVAL '1 day', FALSE)
      ON CONFLICT DO NOTHING;
    `, [p0.parcel_id, p1.parcel_id, p2.parcel_id, p3.parcel_id]);

    // Seed Satellite Change Detections (Step 14)
    await client.query(`
      INSERT INTO land.satellite_detections (parcel_id, detection_date, change_type, confidence, area_affected_sqm, alert_level, before_date, after_date, source, verified)
      VALUES
      ($1, '2026-08-15', 'BUILT_UP_INCREASE', 0.89, 450.0, 'HIGH', '2024-03-10', '2026-08-12', 'Sentinel-2 Multispectral + YOLOv8 Building Segmentation', FALSE),
      ($2, '2026-08-10', 'VEGETATION_LOSS', 0.93, 310.5, 'MEDIUM', '2024-05-20', '2026-08-01', 'Landsat-8 NDVI Difference Index (-0.42 drop)', FALSE),
      ($3, '2026-07-28', 'NEW_ROAD_ACCESS', 0.86, 120.0, 'LOW', '2024-01-15', '2026-07-20', 'High-Resolution Orthomosaic Feature Extraction', TRUE)
      ON CONFLICT DO NOTHING;
    `, [p0.parcel_id, p3.parcel_id, p4.parcel_id]);

    // Seed Transaction Anomalies & Risk Scoring (Step 14)
    await client.query(`
      INSERT INTO land.transaction_anomalies (parcel_id, parcel_ulpin, risk_score, risk_level, anomaly_type, contributing_factors, recommended_action, status, detected_at)
      VALUES
      ($1, $2, 87, 'HIGH', 'RAPID_RESALE_UNDERVALUATION', 
       '{"factors": ["3 transfers within 90 days", "Declared transaction value 42% below Circle Rate", "Power of Attorney transfer sequence"], "resale_frequency_days": 28, "circle_rate_gap_percent": 42}'::jsonb,
       'Direct physical site inspection by Revenue Inspector and cross-examination of Sub-Registrar stamp valuation.', 'OPEN', NOW() - INTERVAL '2 days'),
      ($3, $4, 74, 'HIGH', 'ENCUMBRANCE_STACKING',
       '{"factors": ["2 concurrent bank liens active", "Secondary private credit charge registered", "Pending mutation objection in court"], "active_liens": 3, "dispute_flag": true}'::jsonb,
       'Issue notice to applicant to submit certified No-Objection Certificates from primary lending institution.', 'OPEN', NOW() - INTERVAL '4 days'),
      ($5, $6, 32, 'LOW', 'STANDARD_VALUATION_VARIANCE',
       '{"factors": ["Transaction value matches circle rate benchmark", "Single owner for > 12 years", "Zero encumbrances"], "risk_multiplier": 1.0}'::jsonb,
       'Routine automated processing permitted.', 'RESOLVED', NOW() - INTERVAL '6 days')
      ON CONFLICT DO NOTHING;
    `, [p0.parcel_id, p0.ulpin, p1.parcel_id, p1.ulpin, p2.parcel_id, p2.ulpin]);

    // Seed State Adapters in metadata (Step 15)
    await client.query(`
      INSERT INTO metadata.state_adapters (state_code, state_name, field_mapping, unit_conversions, land_type_mapping, admin_hierarchy, ror_system_name, measurement_unit)
      VALUES
      ('BR', 'Bihar', 
       '{"survey_no": "khesra_number", "khata_no": "khata_number", "owner": "raiyat_name", "father": "pita_ka_naam", "area": "rakba", "unit": "ikayi"}'::jsonb,
       '{"decimal_to_sqm": 40.4686, "katha_to_sqm": 126.46, "bigha_to_sqm": 2529.28, "acre_to_sqm": 4046.86}'::jsonb,
       '{"Dhanhar-1": "Agricultural (Paddy)", "Bhit": "Agricultural (Highland)", "Makaan": "Residential", "Dokan": "Commercial", "Pokhar": "Pond/Water Body"}'::jsonb,
       ARRAY['State (Bihar)', 'District (Zila)', 'Subdivision (Anumandal)', 'Circle (Anchal)', 'Village (Mauza)'],
       'Bihar Bhumi (Jamabandi / Khatiyan)', 'Decimal / Katha'),

      ('TN', 'Tamil Nadu',
       '{"survey_no": "survey_subdivision", "khata_no": "patta_number", "owner": "urimaialar_peyar", "father": "thantai_peyar", "area": "parappalavu", "unit": "alavu_alaghu"}'::jsonb,
       '{"cent_to_sqm": 40.4686, "ground_to_sqm": 222.96, "acre_to_sqm": 4046.86, "sqft_to_sqm": 0.0929}'::jsonb,
       '{"Nanjai": "Wet Agricultural", "Punjai": "Dry Agricultural", "Manai": "Residential Plot", "Kollai": "Garden/Orchard", "Poramboke": "Government Land"}'::jsonb,
       ARRAY['State (Tamil Nadu)', 'District (Mavattam)', 'Taluk (Vattam)', 'Revenue Village (Gramam)'],
       'Anyror / Tamil Nilam (Patta / Chitta)', 'Cent / Ground'),

      ('CH', 'Chandigarh / Punjab',
       '{"survey_no": "khasra_number", "khata_no": "khewat_khatoni", "owner": "khatedar_malik", "father": "walid_naam", "area": "rakba_area", "unit": "paimana"}'::jsonb,
       '{"biswa_to_sqm": 41.8, "bigha_to_sqm": 836.1, "marla_to_sqm": 25.29, "kanal_to_sqm": 505.85, "acre_to_sqm": 4046.86}'::jsonb,
       '{"Nehri": "Canal Irrigated", "Chahi": "Well Irrigated", "Gair Mumkin": "Built-up/Non-Agri", "Barani": "Rainfed"}'::jsonb,
       ARRAY['UT/State', 'District', 'Tehsil', 'Sub-Tehsil', 'Hadbast/Village'],
       'Jamabandi / Farz Record', 'Marla / Kanal')
      ON CONFLICT (state_code) DO UPDATE SET
        field_mapping = EXCLUDED.field_mapping,
        unit_conversions = EXCLUDED.unit_conversions,
        land_type_mapping = EXCLUDED.land_type_mapping;
    `);

    console.log('✅ Successfully seeded Step 13, 14, 15 database tables and sample instances!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
