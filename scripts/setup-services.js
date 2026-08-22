require('dotenv').config();
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const sql = `
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
      assigned_officer VARCHAR(128),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS governance.application_history (
      history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      application_no VARCHAR(64) NOT NULL,
      status VARCHAR(32) NOT NULL,
      action VARCHAR(256) NOT NULL,
      performed_by VARCHAR(128) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Seed initial demo applications if empty
    INSERT INTO governance.service_requests (application_no, service_type, parcel_ulpin, applicant_name, department, priority, status, assigned_officer, created_at, updated_at)
    VALUES 
      ('LS-2026-00123', 'Ownership Verification', 'IN-BR-10-00000001-62', 'Ramesh Kumar', 'Revenue Department', 'NORMAL', 'UNDER_REVIEW', 'Vikram Singh', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '2 hours'),
      ('LS-2026-00120', 'Property Mutation', 'IN-BR-10-00000025-C4', 'Sita Devi', 'Revenue Department', 'HIGH', 'UNDER_REVIEW', 'Vikram Singh', NOW() - INTERVAL '1 day', NOW() - INTERVAL '18 hours'),
      ('LS-2026-00119', 'RoR Extract', 'IN-BR-10-00000042-A3', 'Ramesh Kumar', 'Revenue Department', 'NORMAL', 'COMPLETED', 'Priya Sharma', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
      ('LS-2026-00118', 'Encumbrance Certificate', 'IN-BR-10-00000042-A3', 'Mohan Prasad', 'Registration Department', 'NORMAL', 'SUBMITTED', NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
      ('LS-2026-00116', 'Land Use Certificate', 'IN-BR-10-00000010-5B', 'Geeta Devi', 'Planning Department', 'LOW', 'DOCUMENT_VERIFICATION', NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
      ('LS-2026-00115', 'Building Permission', 'IN-BR-10-00000015-7E', 'Ramesh Kumar', 'Municipal Authority', 'HIGH', 'DOCUMENT_VERIFICATION', NULL, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days')
    ON CONFLICT (application_no) DO NOTHING;

    INSERT INTO governance.application_history (application_no, status, action, performed_by, created_at)
    VALUES
      ('LS-2026-00123', 'SUBMITTED', 'Application submitted by citizen', 'Ramesh Kumar', NOW() - INTERVAL '4 hours'),
      ('LS-2026-00123', 'DOCUMENT_VERIFICATION', 'Automated document verification passed', 'System', NOW() - INTERVAL '3 hours'),
      ('LS-2026-00123', 'UNDER_REVIEW', 'Assigned to Land Officer Vikram Singh', 'System', NOW() - INTERVAL '2 hours')
    ON CONFLICT DO NOTHING;
  `;

  await pool.query(sql);
  console.log('✅ Service requests & application history tables initialized successfully!');
  await pool.end();
}

main().catch(err => {
  console.error('Failed migration:', err);
  process.exit(1);
});
