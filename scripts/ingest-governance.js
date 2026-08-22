/**
 * LandStack — Step 7 Governance Data Ingestion (Fixed)
 * Maps Hindi/Bihar field names → canonical schema columns
 * 
 * Run: node scripts/ingest-governance.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function loadJSON(relPath) {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8'));
  return Array.isArray(raw) ? raw : raw.records || raw.data || [];
}

function loadGeoJSON(relPath) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8'));
}

async function buildParcelLookup(client) {
  const res = await client.query('SELECT parcel_id, ulpin, survey_number FROM gis.parcels');
  const byUlpin = {};
  const byKhesra = {};
  for (const r of res.rows) {
    if (r.ulpin) byUlpin[r.ulpin] = r.parcel_id;
    if (r.survey_number) byKhesra[r.survey_number] = r.parcel_id;
  }
  return { byUlpin, byKhesra };
}

async function run() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  LandStack — Step 7: Governance Data Ingestion       ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  const client = await pool.connect();
  try {
    const { byUlpin, byKhesra } = await buildParcelLookup(client);
    console.log(`📍 Loaded ${Object.keys(byUlpin).length} parcels for lookup\n`);

    // ========================================================
    // CLEANUP existing governance data
    // ========================================================
    console.log('🧹 Cleaning governance tables...');
    const cleanTables = [
      'governance.registrations', 'governance.encumbrances',
      'governance.building_permissions', 'governance.disputes',
      'governance.property_tax', 'governance.circle_rates',
      'gis.land_use_zones', 'gis.master_plan_zones',
    ];
    for (const t of cleanTables) {
      await client.query(`DELETE FROM ${t}`);
    }
    // Don't delete restriction_zones if already ingested
    console.log('   ✅ Clean\n');

    // ========================================================
    // PART A — Registrations
    // Schema: registration_id, parcel_id, document_number, registration_date,
    //         transaction_type, seller_reference, buyer_reference,
    //         consideration_amount, stamp_duty, registration_fee, status, source_system
    // Data:   registration_id, ulpin, khesra_no, dastavej_no, prakar,
    //         vikreta, kreta, mulya, bazaar_mulya, stamp_shulk,
    //         nibandhan_shulk, nibandhan_tarikh, sthiti
    // ========================================================
    console.log('📋 Part A: Registration Records...');
    const regs = loadJSON('data/bihar/essential_layer/registration_records.json');
    console.log(`   Source: ${regs.length} records`);
    let regInserted = 0;
    for (const r of regs) {
      const parcelId = byUlpin[r.ulpin] || byKhesra[r.khesra_no];
      if (!parcelId) continue;
      try {
        await client.query(
          `INSERT INTO governance.registrations 
           (parcel_id, document_number, registration_date, transaction_type, 
            seller_reference, buyer_reference, consideration_amount, 
            stamp_duty, registration_fee, status, source_system)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
           ON CONFLICT DO NOTHING`,
          [
            parcelId,
            r.dastavej_no,
            r.nibandhan_tarikh || null,
            r.prakar || 'SALE',
            r.vikreta || null,
            r.kreta || null,
            r.bazaar_mulya || r.mulya || 0,
            r.stamp_shulk || 0,
            r.nibandhan_shulk || 0,
            r.sthiti || 'Registered',
            'SYNTHETIC_BIHAR_REG',
          ]
        );
        regInserted++;
      } catch (e) { /* skip */ }
    }
    console.log(`   ✅ Registrations: ${regInserted}\n`);

    // ========================================================
    // PART B — Encumbrances
    // Schema: encumbrance_id, parcel_id, encumbrance_type, institution,
    //         reference_number, amount, outstanding, interest_rate,
    //         start_date, end_date, status, source_system
    // Data:   encumbrance_id, ulpin, khesra_no, prakar, bhumi_swami,
    //         rindaata, rin_rashi, bakaya_rashi, byaj_dar,
    //         avadhi_varsh, praarambh_tarikh, paripakva_tarikh, sthiti
    // ========================================================
    console.log('📋 Part B: Encumbrance Records...');
    const encs = loadJSON('data/bihar/essential_layer/encumbrance_records.json');
    console.log(`   Source: ${encs.length} records`);
    let encInserted = 0;
    for (const e of encs) {
      const parcelId = byUlpin[e.ulpin] || byKhesra[e.khesra_no];
      if (!parcelId) continue;
      try {
        await client.query(
          `INSERT INTO governance.encumbrances 
           (parcel_id, encumbrance_type, institution, reference_number,
            amount, outstanding, interest_rate, start_date, end_date, status, source_system)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
           ON CONFLICT DO NOTHING`,
          [
            parcelId,
            e.prakar || 'Mortgage',
            e.rindaata || 'Bank',
            e.encumbrance_id,
            e.rin_rashi || 0,
            e.bakaya_rashi || 0,
            e.byaj_dar || 0,
            e.praarambh_tarikh || null,
            e.paripakva_tarikh || null,
            e.sthiti || 'Active',
            'SYNTHETIC_BIHAR_ENC',
          ]
        );
        encInserted++;
      } catch (err) { /* skip */ }
    }
    console.log(`   ✅ Encumbrances: ${encInserted}\n`);

    // ========================================================
    // PART C — Building Permissions
    // Schema: permission_id, parcel_id, application_number, applicant,
    //         building_type, approved_area, floors, application_date,
    //         approval_date, status, source_system
    // Data:   permission_id, ulpin, khesra_no, avedan_karta, bhavan_prakar,
    //         prastavit_manjil, prastavit_kshetrafal_sqm, bhukhand_kshetrafal_sqm,
    //         avedan_tarikh, anumodan_tarikh, vaidhata_tarikh, sthiti
    // ========================================================
    console.log('📋 Part C: Building Permissions...');
    const bps = loadJSON('data/bihar/essential_layer/building_permissions.json');
    console.log(`   Source: ${bps.length} records`);
    let bpInserted = 0;
    for (const b of bps) {
      const parcelId = byUlpin[b.ulpin] || byKhesra[b.khesra_no];
      if (!parcelId) continue;
      try {
        await client.query(
          `INSERT INTO governance.building_permissions 
           (parcel_id, application_number, applicant, building_type,
            approved_area, floors, application_date, approval_date, status, source_system)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           ON CONFLICT DO NOTHING`,
          [
            parcelId,
            b.permission_id,
            b.avedan_karta || null,
            b.bhavan_prakar || 'Residential',
            b.prastavit_kshetrafal_sqm || 0,
            b.prastavit_manjil || 1,
            b.avedan_tarikh || null,
            b.anumodan_tarikh || null,
            b.sthiti || 'Approved',
            'SYNTHETIC_BIHAR_BP',
          ]
        );
        bpInserted++;
      } catch (err) { /* skip */ }
    }
    console.log(`   ✅ Building Permissions: ${bpInserted}\n`);

    // ========================================================
    // PART D — Land Use Zones (aggregate parcels by master_plan_zone)
    // Schema: zone_id, zone_code, zone_name, source_system, geom
    // ========================================================
    console.log('🗺️  Part D: Land Use Zones...');
    const landUse = loadJSON('data/bihar/essential_layer/land_use.json');
    // Get unique zone names from the per-parcel land use data
    const zoneNames = [...new Set(landUse.map(lu => lu.master_plan_zone || lu.permitted_use || lu.actual_use).filter(Boolean))];
    console.log(`   Zone types: ${zoneNames.join(', ')}`);
    
    // For each zone, union the geometries of parcels with that zone type
    let luInserted = 0;
    for (const zn of zoneNames) {
      const khesras = landUse.filter(lu => (lu.master_plan_zone || lu.permitted_use || lu.actual_use) === zn).map(lu => lu.khesra_no);
      try {
        const res = await client.query(
          `INSERT INTO gis.land_use_zones (zone_code, zone_name, source_system, geom)
           SELECT $1, $2, 'SYNTHETIC_BIHAR_LU',
                  ST_Multi(ST_ConvexHull(ST_Collect(p.geom)))
           FROM gis.parcels p
           WHERE p.survey_number = ANY($3)
           HAVING COUNT(*) > 0
           RETURNING zone_id`,
          [zn.substring(0, 10), zn, khesras]
        );
        if (res.rowCount > 0) luInserted++;
      } catch (err) { console.error('   LU:', err.message.substring(0, 60)); }
    }
    console.log(`   ✅ Land Use Zones: ${luInserted}\n`);

    // ========================================================
    // PART E — Master Plan Zones (GeoJSON with geometry)
    // Schema: zone_id, plan_id, zone_code, zone_name, permitted_use,
    //         max_far, max_height_m, source_system, geom
    // ========================================================
    console.log('🗺️  Part E: Master Plan Zones...');
    const zoning = loadGeoJSON('data/bihar/essential_layer/zoning_master_plan.geojson');
    let mpInserted = 0;
    for (const feature of zoning.features) {
      const p = feature.properties;
      try {
        await client.query(
          `INSERT INTO gis.master_plan_zones 
           (zone_code, zone_name, permitted_use, max_far, max_height_m, source_system, geom)
           VALUES ($1,$2,$3,$4,$5,$6, ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($7), 4326)))
           ON CONFLICT DO NOTHING`,
          [
            p.zone_code || p.zone_id || 'Z' + mpInserted,
            p.zone_name || 'Zone ' + mpInserted,
            p.permitted_uses || p.zone_name || null,
            p.max_far || null,
            p.max_height || null,
            'SYNTHETIC_BIHAR_MP',
            JSON.stringify(feature.geometry),
          ]
        );
        mpInserted++;
      } catch (err) { console.error('   MP:', err.message.substring(0, 80)); }
    }
    console.log(`   ✅ Master Plan Zones: ${mpInserted}\n`);

    // ========================================================
    // PART F — Restriction Zones (GeoJSON with geometry)
    // Already partially loaded — reload cleanly
    // ========================================================
    console.log('🗺️  Part F: Restriction Zones...');
    await client.query('DELETE FROM gis.restriction_zones');
    const envZones = loadGeoJSON('data/bihar/usecase_layer/environmental_zones.geojson');
    let rzInserted = 0;
    for (const feature of envZones.features) {
      const p = feature.properties;
      try {
        await client.query(
          `INSERT INTO gis.restriction_zones 
           (restriction_type, restriction_name, severity, description, source_system, geom)
           VALUES ($1,$2,$3,$4,$5, ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($6), 4326)))
           ON CONFLICT DO NOTHING`,
          [
            p.zone_type || p.zone_name || 'Environmental',
            p.zone_name,
            p.severity || 'MEDIUM',
            p.restrictions || p.description || '',
            'SYNTHETIC_BIHAR_ENV',
            JSON.stringify(feature.geometry),
          ]
        );
        rzInserted++;
      } catch (err) { console.error('   RZ:', err.message.substring(0, 80)); }
    }
    console.log(`   ✅ Restriction Zones: ${rzInserted}\n`);

    // ========================================================
    // PART G — Disputes
    // Schema: dispute_id, parcel_id, dispute_type, case_number, court,
    //         petitioner, respondent, filing_date, next_hearing, status,
    //         stay_order, affects_transfer, source_system
    // Data:   case_id, ulpin, khesra_no, vivad_prakar, muqaddama_no,
    //         nyayalaya, vaadi, prativaadi, dakhil_tarikh, agla_sunvai,
    //         sthiti, stay_order, hast_antaranh_prabhav
    // ========================================================
    console.log('📋 Part G: Disputes...');
    const disputes = loadJSON('data/bihar/usecase_layer/dispute_records.json');
    console.log(`   Source: ${disputes.length} records`);
    let dispInserted = 0;
    for (const d of disputes) {
      const parcelId = byUlpin[d.ulpin] || byKhesra[d.khesra_no];
      if (!parcelId) continue;
      try {
        await client.query(
          `INSERT INTO governance.disputes 
           (parcel_id, dispute_type, case_number, court, petitioner, respondent,
            filing_date, next_hearing, status, stay_order, affects_transfer, source_system)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
           ON CONFLICT DO NOTHING`,
          [
            parcelId,
            d.vivad_prakar || 'Ownership',
            d.muqaddama_no || d.case_id,
            d.nyayalaya || 'Civil Court',
            d.vaadi || null,
            d.prativaadi || null,
            d.dakhil_tarikh || null,
            d.agla_sunvai || null,
            d.sthiti || 'Pending',
            d.stay_order === true || d.stay_order === 'Yes',
            d.hast_antaranh_prabhav === true || d.hast_antaranh_prabhav === 'Yes',
            'SYNTHETIC_BIHAR_DISP',
          ]
        );
        dispInserted++;
      } catch (err) { /* skip */ }
    }
    console.log(`   ✅ Disputes: ${dispInserted}\n`);

    // ========================================================
    // PART H — Property Tax
    // Schema: tax_id, parcel_id, assessment_year, owner_name, annual_value,
    //         tax_amount, paid_amount, due_amount, arrears, status, source_system
    // Data:   tax_id, ulpin, khesra_no, assessment_year, sampatti_swami,
    //         varshik_mulya, kul_kar, bhugtan_sthiti, bakaya
    // ========================================================
    console.log('📋 Part H: Property Tax...');
    const taxes = loadJSON('data/bihar/usecase_layer/property_tax.json');
    console.log(`   Source: ${taxes.length} records`);
    let taxInserted = 0;
    for (const t of taxes) {
      const parcelId = byUlpin[t.ulpin] || byKhesra[t.khesra_no];
      if (!parcelId) continue;
      try {
        await client.query(
          `INSERT INTO governance.property_tax 
           (parcel_id, assessment_year, owner_name, annual_value,
            tax_amount, paid_amount, due_amount, arrears, status, source_system)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           ON CONFLICT DO NOTHING`,
          [
            parcelId,
            t.assessment_year || '2024-25',
            t.sampatti_swami || null,
            t.varshik_mulya || 0,
            t.kul_kar || t.sampatti_kar || 0,
            0, // paid_amount — calculate from status
            t.bakaya || 0,
            t.bakaya || 0,
            t.bhugtan_sthiti || 'Pending',
            'SYNTHETIC_BIHAR_TAX',
          ]
        );
        taxInserted++;
      } catch (err) { /* skip */ }
    }
    console.log(`   ✅ Property Tax: ${taxInserted}\n`);

    // ========================================================
    // PART I — Circle Rates
    // Schema: rate_id, zone_name, land_type, rate_per_unit, unit,
    //         effective_date, valid_till, source_system
    // ========================================================
    console.log('📋 Part I: Circle Rates...');
    const crFile = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data/bihar/usecase_layer/circle_rates.json'), 'utf8'));
    const circleRates = crFile.circle_rates || crFile.records || (Array.isArray(crFile) ? crFile : []);
    let crInserted = 0;
    for (const cr of circleRates) {
      try {
        await client.query(
          `INSERT INTO governance.circle_rates 
           (zone_name, land_type, rate_per_unit, unit, effective_date, source_system)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT DO NOTHING`,
          [
            cr.kshetra || cr.zone || 'Arghawa',
            cr.bhumi_prakar || cr.land_type || 'General',
            cr.dar || cr.rate_per_sqm || 0,
            cr.ikai || cr.unit || 'per_sqm',
            cr.prabhav_tarikh || cr.effective_from || '2024-01-01',
            'SYNTHETIC_BIHAR_CR',
          ]
        );
        crInserted++;
      } catch (err) { /* skip */ }
    }
    console.log(`   ✅ Circle Rates: ${crInserted}\n`);

    // ========================================================
    // Create spatial indexes
    // ========================================================
    console.log('🔍 Creating spatial indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS parcels_geom_idx ON gis.parcels USING GIST (geom)',
      'CREATE INDEX IF NOT EXISTS land_use_geom_idx ON gis.land_use_zones USING GIST (geom)',
      'CREATE INDEX IF NOT EXISTS master_plan_geom_idx ON gis.master_plan_zones USING GIST (geom)',
      'CREATE INDEX IF NOT EXISTS restriction_geom_idx ON gis.restriction_zones USING GIST (geom)',
    ];
    for (const idx of indexes) {
      try { await client.query(idx); } catch (e) { /* already exists */ }
    }
    console.log('   ✅ Spatial indexes OK\n');

    // ========================================================
    // Register data sources
    // ========================================================
    const sources = [
      ['SYNTHETIC_BIHAR_REG', 'Registration Department', 'BR', 'Registration Records', 'JSON'],
      ['SYNTHETIC_BIHAR_ENC', 'Registration Department', 'BR', 'Encumbrance Records', 'JSON'],
      ['SYNTHETIC_BIHAR_BP', 'Municipal Authority', 'BR', 'Building Permissions', 'JSON'],
      ['SYNTHETIC_BIHAR_LU', 'Planning Department', 'BR', 'Land Use Classification', 'JSON'],
      ['SYNTHETIC_BIHAR_MP', 'Planning Department', 'BR', 'Master Plan Zones', 'GeoJSON'],
      ['SYNTHETIC_BIHAR_ENV', 'Environment Department', 'BR', 'Environmental Zones', 'GeoJSON'],
      ['SYNTHETIC_BIHAR_DISP', 'Judiciary', 'BR', 'Dispute Records', 'JSON'],
      ['SYNTHETIC_BIHAR_TAX', 'Municipal Authority', 'BR', 'Property Tax Records', 'JSON'],
      ['SYNTHETIC_BIHAR_CR', 'Revenue Department', 'BR', 'Circle Rates', 'JSON'],
    ];
    for (const [sys, dept, state, name, fmt] of sources) {
      await client.query(
        `INSERT INTO metadata.data_sources (system_name, department, state_code, dataset_name, format, notes)
         VALUES ($1,$2,$3,$4,$5, 'Synthetic data for SIH 2026') ON CONFLICT DO NOTHING`,
        [sys, dept, state, name, fmt]
      );
    }

    // ========================================================
    // FINAL SUMMARY
    // ========================================================
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║  📊 GOVERNANCE DATA SUMMARY                         ║');
    console.log('╚══════════════════════════════════════════════════════╝');

    const tables = [
      ['governance.registrations', 'Registrations'],
      ['governance.encumbrances', 'Encumbrances'],
      ['governance.building_permissions', 'Building Permissions'],
      ['governance.disputes', 'Disputes'],
      ['governance.property_tax', 'Property Tax'],
      ['governance.circle_rates', 'Circle Rates'],
      ['gis.land_use_zones', 'Land Use Zones'],
      ['gis.master_plan_zones', 'Master Plan Zones'],
      ['gis.restriction_zones', 'Restriction Zones'],
      ['metadata.data_sources', 'Data Sources'],
    ];
    for (const [t, label] of tables) {
      const r = await client.query(`SELECT COUNT(*) AS c FROM ${t}`);
      console.log(`   ${label.padEnd(25)} ${r.rows[0].c.toString().padStart(5)} rows`);
    }

    // Test spatial join
    console.log('\n🧪 Spatial join test (first 3 parcels):');
    const spatialTest = await client.query(`
      SELECT p.ulpin,
        (SELECT string_agg(DISTINCT lu.zone_name, ', ') FROM gis.land_use_zones lu WHERE ST_Intersects(p.geom, lu.geom)) AS land_use,
        (SELECT string_agg(DISTINCT mp.zone_name, ', ') FROM gis.master_plan_zones mp WHERE ST_Intersects(p.geom, mp.geom)) AS master_plan,
        (SELECT string_agg(DISTINCT rz.restriction_name, ', ') FROM gis.restriction_zones rz WHERE ST_Intersects(p.geom, rz.geom)) AS restrictions
      FROM gis.parcels p LIMIT 3
    `);
    for (const r of spatialTest.rows) {
      console.log(`   ${r.ulpin}`);
      console.log(`     LU: ${r.land_use || '—'}`);
      console.log(`     MP: ${r.master_plan || '—'}`);
      console.log(`     RZ: ${r.restrictions || '—'}`);
    }

    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║  ✅ STEP 7 COMPLETE — All governance layers loaded! ║');
    console.log('╚══════════════════════════════════════════════════════╝');

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error(err.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
