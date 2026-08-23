require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function dumpSeed() {
  let connStr = process.env.DATABASE_URL || "";
  if (connStr.includes(":5432")) {
    connStr = connStr.replace(":5432", ":6543");
  }

  const client = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  console.log('Fetching live database records for SQL seed generation...');
  const parcels = await client.query('SELECT parcel_id, ulpin, survey_number, area, area_unit, land_type, state_code, district_code, subdistrict_code, village_code, source_system, ST_AsGeoJSON(geom) as geom_json FROM gis.parcels ORDER BY CAST(survey_number AS INT) ASC');
  const owners = await client.query('SELECT * FROM land.owners ORDER BY owner_id ASC');
  const ownership = await client.query('SELECT * FROM land.parcel_ownership ORDER BY parcel_id ASC');
  const identifiers = await client.query('SELECT * FROM gis.parcel_identifiers ORDER BY parcel_id ASC');
  const ror = await client.query('SELECT * FROM land.ror_records ORDER BY parcel_id ASC');
  const registrations = await client.query('SELECT * FROM governance.registrations ORDER BY parcel_id ASC');
  const conflicts = await client.query('SELECT * FROM land.data_conflicts ORDER BY parcel_id ASC');
  const disputes = await client.query('SELECT * FROM governance.disputes ORDER BY parcel_id ASC');
  const encumbrances = await client.query('SELECT * FROM governance.encumbrances ORDER BY parcel_id ASC');
  const taxes = await client.query('SELECT * FROM governance.property_tax ORDER BY parcel_id ASC');
  const buildingPerms = await client.query('SELECT * FROM governance.building_permissions ORDER BY parcel_id ASC');

  let sql = '-- =========================================================\n';
  sql += '-- LANDSTACK AUTHENTIC CADASTRAL SEED FILE (PERMANENT LOCK)\n';
  sql += '-- Generated At: ' + new Date().toISOString() + '\n';
  sql += '-- Total Parcels: ' + parcels.rows.length + ' (P-1001 to P-' + (1000 + parcels.rows.length) + ')\n';
  sql += '-- =========================================================\n\n';

  sql += 'TRUNCATE TABLE \n  land.data_conflicts,\n  governance.disputes,\n  governance.property_tax,\n  governance.building_permissions,\n  governance.encumbrances,\n  governance.registrations,\n  land.ror_records,\n  land.parcel_ownership,\n  gis.parcel_identifiers,\n  gis.parcels,\n  land.owners\nCASCADE;\n\n';

  // Owners
  sql += '-- 1. Owners\n';
  for (const o of owners.rows) {
    sql += `INSERT INTO land.owners (owner_id, name, owner_type, identifier_ref, father_husband, source_system) VALUES ('${o.owner_id}', '${o.name.replace(/'/g, "''")}', '${o.owner_type}', '${o.identifier_ref}', '${(o.father_husband || '').replace(/'/g, "''")}', '${o.source_system}');\n`;
  }

  // Parcels
  sql += '\n-- 2. Cadastral Parcels\n';
  for (const p of parcels.rows) {
    sql += `INSERT INTO gis.parcels (parcel_id, ulpin, survey_number, area, area_unit, land_type, state_code, district_code, subdistrict_code, village_code, source_system, geom) VALUES ('${p.parcel_id}', '${p.ulpin}', '${p.survey_number}', ${p.area}, '${p.area_unit}', '${p.land_type}', '${p.state_code}', '${p.district_code}', '${p.subdistrict_code}', '${p.village_code}', '${p.source_system}', ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON('${p.geom_json}'), 4326)));\n`;
  }

  // Ownership
  sql += '\n-- 3. Parcel Ownership\n';
  for (const po of ownership.rows) {
    sql += `INSERT INTO land.parcel_ownership (ownership_id, parcel_id, owner_id, ownership_type, ownership_share, valid_from) VALUES ('${po.ownership_id}', '${po.parcel_id}', '${po.owner_id}', '${po.ownership_type}', ${po.ownership_share}, '${new Date(po.valid_from).toISOString().split('T')[0]}');\n`;
  }

  // Identifiers
  sql += '\n-- 4. Parcel Identifiers\n';
  for (const pi of identifiers.rows) {
    sql += `INSERT INTO gis.parcel_identifiers (id, parcel_id, identifier_type, identifier_value, source_system, is_primary) VALUES ('${pi.id}', '${pi.parcel_id}', '${pi.identifier_type}', '${pi.identifier_value}', '${pi.source_system}', ${pi.is_primary});\n`;
  }

  // RoR
  sql += '\n-- 5. RoR Khatiyan Records\n';
  for (const r of ror.rows) {
    sql += `INSERT INTO land.ror_records (ror_id, parcel_id, khata_number, khesra_number, land_classification, area, area_unit, revenue_amount, revenue_status, effective_from, source_system) VALUES ('${r.ror_id}', '${r.parcel_id}', '${r.khata_number}', '${r.khesra_number}', '${r.land_classification}', ${r.area}, '${r.area_unit}', ${r.revenue_amount}, '${r.revenue_status}', '${new Date(r.effective_from).toISOString().split('T')[0]}', '${r.source_system}');\n`;
  }

  // Registrations
  sql += '\n-- 6. Registered Deeds\n';
  for (const reg of registrations.rows) {
    sql += `INSERT INTO governance.registrations (registration_id, parcel_id, document_number, registration_date, transaction_type, seller_reference, buyer_reference, consideration_amount, stamp_duty, registration_fee, status, source_system) VALUES ('${reg.registration_id}', '${reg.parcel_id}', '${reg.document_number}', '${new Date(reg.registration_date).toISOString().split('T')[0]}', '${reg.transaction_type}', '${reg.seller_reference.replace(/'/g, "''")}', '${reg.buyer_reference.replace(/'/g, "''")}', ${reg.consideration_amount}, ${reg.stamp_duty}, ${reg.registration_fee}, '${reg.status}', '${reg.source_system}');\n`;
  }

  // Conflicts
  sql += '\n-- 7. Data Conflicts\n';
  for (const c of conflicts.rows) {
    sql += `INSERT INTO land.data_conflicts (conflict_id, parcel_id, conflict_type, severity, source_a, value_a, source_b, value_b, resolved) VALUES ('${c.conflict_id}', '${c.parcel_id}', '${c.conflict_type}', '${c.severity}', '${c.source_a}', '${c.value_a}', '${c.source_b}', '${c.value_b}', ${c.resolved});\n`;
  }

  // Disputes
  sql += '\n-- 8. Disputes / Court Cases\n';
  for (const d of disputes.rows) {
    const nextH = d.next_hearing ? `'${new Date(d.next_hearing).toISOString().split('T')[0]}'` : 'NULL';
    sql += `INSERT INTO governance.disputes (dispute_id, parcel_id, dispute_type, case_number, court, petitioner, respondent, filing_date, next_hearing, status, stay_order) VALUES ('${d.dispute_id}', '${d.parcel_id}', '${d.dispute_type}', '${d.case_number}', '${d.court}', '${d.petitioner.replace(/'/g, "''")}', '${d.respondent.replace(/'/g, "''")}', '${new Date(d.filing_date).toISOString().split('T')[0]}', ${nextH}, '${d.status}', ${d.stay_order});\n`;
  }

  // Encumbrances
  sql += '\n-- 9. Encumbrances\n';
  for (const e of encumbrances.rows) {
    sql += `INSERT INTO governance.encumbrances (encumbrance_id, parcel_id, encumbrance_type, institution, reference_number, amount, outstanding, interest_rate, start_date, status, source_system) VALUES ('${e.encumbrance_id}', '${e.parcel_id}', '${e.encumbrance_type}', '${e.institution.replace(/'/g, "''")}', '${e.reference_number}', ${e.amount}, ${e.outstanding}, ${e.interest_rate}, '${new Date(e.start_date).toISOString().split('T')[0]}', '${e.status}', '${e.source_system}');\n`;
  }

  // Taxes
  sql += '\n-- 10. Property Taxes\n';
  for (const t of taxes.rows) {
    sql += `INSERT INTO governance.property_tax (tax_id, parcel_id, assessment_year, owner_name, annual_value, tax_amount, paid_amount, due_amount, arrears, status, source_system) VALUES ('${t.tax_id}', '${t.parcel_id}', '${t.assessment_year}', '${t.owner_name.replace(/'/g, "''")}', ${t.annual_value}, ${t.tax_amount}, ${t.paid_amount}, ${t.due_amount}, ${t.arrears}, '${t.status}', '${t.source_system}');\n`;
  }

  // Building Permissions
  sql += '\n-- 11. Building Permissions\n';
  for (const bp of buildingPerms.rows) {
    const appDate = bp.approval_date ? `'${new Date(bp.approval_date).toISOString().split('T')[0]}'` : 'NULL';
    sql += `INSERT INTO governance.building_permissions (permission_id, parcel_id, application_number, applicant, building_type, approved_area, floors, application_date, approval_date, status, source_system) VALUES ('${bp.permission_id}', '${bp.parcel_id}', '${bp.application_number}', '${bp.applicant.replace(/'/g, "''")}', '${bp.building_type}', ${bp.approved_area}, ${bp.floors}, '${new Date(bp.application_date).toISOString().split('T')[0]}', ${appDate}, '${bp.status}', '${bp.source_system}');\n`;
  }

  const outDir = path.join(process.cwd(), 'database', 'seeds');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const targetFile = path.join(outDir, '001_authentic_cadastre_seed.sql');
  fs.writeFileSync(targetFile, sql);
  console.log(`✓ Successfully exported permanent seed: ${targetFile} (${(sql.length / 1024).toFixed(1)} KB)`);

  await client.end();
}

dumpSeed().catch(console.error);
