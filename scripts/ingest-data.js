/**
 * LandStack — Batch Data Ingestion (Supabase-optimized)
 * Uses batch SQL for speed over remote connections
 * 
 * Run: node scripts/ingest-data.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set in .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  LandStack — Batch Data Ingestion (Supabase)     ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  const client = await pool.connect();

  try {
    // ========================================
    // CLEANUP — remove any partial data
    // ========================================
    console.log('🧹 Cleaning up partial data...');
    await client.query('BEGIN');
    await client.query('DELETE FROM land.ror_records');
    await client.query('DELETE FROM land.parcel_ownership');
    await client.query('DELETE FROM land.owners');
    await client.query('DELETE FROM gis.parcel_identifiers');
    await client.query('DELETE FROM gis.parcels');
    // Drop staging/integration tables if exist
    await client.query('DROP TABLE IF EXISTS integration.parcel_matches CASCADE');
    await client.query('DROP TABLE IF EXISTS staging.ror_raw CASCADE');
    await client.query('DROP SCHEMA IF EXISTS staging CASCADE');
    await client.query('DROP SCHEMA IF EXISTS integration CASCADE');
    await client.query('COMMIT');
    console.log('   ✅ Clean slate\n');

    // ========================================
    // STEP 5: Cadastral Parcels (batch insert)
    // ========================================
    console.log('📍 STEP 5: Ingesting Cadastral Parcels...');
    const geojsonPath = path.join(__dirname, '..', 'data', 'bihar', 'base_layer', 'cadastral_parcels.geojson');
    const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
    console.log(`   Features: ${geojson.features.length}`);

    // Build batch INSERT for parcels
    const parcelValues = [];
    const parcelParams = [];
    let pi = 1;

    for (const feature of geojson.features) {
      const p = feature.properties;
      parcelValues.push(
        `($${pi++}, $${pi++}, $${pi++}, $${pi++}, $${pi++}, $${pi++}, $${pi++}, $${pi++}, $${pi++}, ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($${pi++}), 4326)))`
      );
      parcelParams.push(
        p.ulpin, 'BR', p.district || 'Madhubani', p.sub_division || 'Jaynagar',
        p.mauza_code || '33', p.khesra_no, p.rakba_sqm, 'sq_meters',
        p.kisam, JSON.stringify(feature.geometry)
      );
    }

    await client.query('BEGIN');
    await client.query(
      `INSERT INTO gis.parcels (ulpin, state_code, district_code, subdistrict_code, village_code, survey_number, area, area_unit, land_type, geom)
       VALUES ${parcelValues.join(',')}
       ON CONFLICT DO NOTHING`,
      parcelParams
    );
    await client.query('COMMIT');

    const parcelCount = await client.query('SELECT COUNT(*) AS c FROM gis.parcels');
    console.log(`   ✅ Inserted: ${parcelCount.rows[0].c} parcels\n`);

    // ========================================
    // Parcel identifiers (batch)
    // ========================================
    console.log('🏷️  Creating parcel identifiers...');
    
    // Get all parcel_ids with ulpins
    const parcels = await client.query('SELECT parcel_id, ulpin, survey_number FROM gis.parcels');
    
    // Build ULPIN identifiers
    const idValues = [];
    const idParams = [];
    let ii = 1;

    // Get khata from original data for each ULPIN
    const khataMap = {};
    for (const f of geojson.features) {
      khataMap[f.properties.ulpin] = { khata: f.properties.khata_no, plot: f.properties.plot_id };
    }

    for (const row of parcels.rows) {
      // ULPIN
      idValues.push(`($${ii++}, $${ii++}, $${ii++}, $${ii++}, $${ii++})`);
      idParams.push(row.parcel_id, 'ULPIN', row.ulpin, 'SYNTHETIC_BIHAR_CADASTRAL', true);

      // KHESRA
      idValues.push(`($${ii++}, $${ii++}, $${ii++}, $${ii++}, $${ii++})`);
      idParams.push(row.parcel_id, 'KHESRA', row.survey_number, 'SYNTHETIC_BIHAR_CADASTRAL', false);

      // KHATA
      const extra = khataMap[row.ulpin];
      if (extra?.khata) {
        idValues.push(`($${ii++}, $${ii++}, $${ii++}, $${ii++}, $${ii++})`);
        idParams.push(row.parcel_id, 'KHATA', extra.khata, 'SYNTHETIC_BIHAR_CADASTRAL', false);
      }
      if (extra?.plot) {
        idValues.push(`($${ii++}, $${ii++}, $${ii++}, $${ii++}, $${ii++})`);
        idParams.push(row.parcel_id, 'PLOT_ID', extra.plot, 'SYNTHETIC_BIHAR_CADASTRAL', false);
      }
    }

    // Supabase has a param limit, chunk if needed
    const CHUNK = 500;
    for (let c = 0; c < idValues.length; c += CHUNK) {
      const chunk = idValues.slice(c, c + CHUNK);
      const chunkParamsPerItem = 5;
      const startIdx = c * chunkParamsPerItem;
      const endIdx = (c + CHUNK) * chunkParamsPerItem;
      const chunkParams = idParams.slice(startIdx, endIdx);

      // Renumber params for this chunk
      let renum = 1;
      const renumbered = chunk.map(v => {
        return v.replace(/\$\d+/g, () => `$${renum++}`);
      });

      await client.query(
        `INSERT INTO gis.parcel_identifiers (parcel_id, identifier_type, identifier_value, source_system, is_primary)
         VALUES ${renumbered.join(',')}
         ON CONFLICT DO NOTHING`,
        chunkParams
      );
    }

    const idCount = await client.query('SELECT COUNT(*) AS c FROM gis.parcel_identifiers');
    console.log(`   ✅ Identifiers: ${idCount.rows[0].c}\n`);

    // ========================================
    // Verify Step 5
    // ========================================
    console.log('📊 Step 5 Verification:');
    const geomType = await client.query('SELECT GeometryType(geom) AS t, COUNT(*) AS c FROM gis.parcels GROUP BY GeometryType(geom)');
    const srid = await client.query('SELECT ST_SRID(geom) AS srid FROM gis.parcels LIMIT 1');
    const bbox = await client.query('SELECT ST_XMin(e) AS x1, ST_YMin(e) AS y1, ST_XMax(e) AS x2, ST_YMax(e) AS y2 FROM (SELECT ST_Extent(geom) AS e FROM gis.parcels) t');

    console.log(`   Geometry: ${geomType.rows.map(r => `${r.t}(${r.c})`).join(', ')}`);
    console.log(`   SRID: ${srid.rows[0]?.srid}`);
    const b = bbox.rows[0];
    if (b) console.log(`   BBox: [${Number(b.x1).toFixed(4)}, ${Number(b.y1).toFixed(4)}] → [${Number(b.x2).toFixed(4)}, ${Number(b.y2).toFixed(4)}]`);

    // Spatial query test
    const spatial = await client.query(`
      SELECT parcel_id, ulpin, survey_number
      FROM gis.parcels
      WHERE ST_Contains(geom, ST_SetSRID(ST_Point(86.12, 26.365), 4326))
      LIMIT 1
    `);
    if (spatial.rows.length > 0) {
      console.log(`   Spatial test: ✅ Found ${spatial.rows[0].ulpin} at (86.12, 26.365)`);
    } else {
      console.log(`   Spatial test: ⚠️ No parcel at test point`);
    }

    // ========================================
    // STEP 6: RoR + Owners
    // ========================================
    console.log('\n📋 STEP 6: RoR Integration...');

    // Create staging + integration schemas
    await client.query(`
      CREATE SCHEMA IF NOT EXISTS staging;
      CREATE SCHEMA IF NOT EXISTS integration;

      CREATE TABLE IF NOT EXISTS staging.ror_raw (
        raw_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        jamabandi_id TEXT UNIQUE,
        ulpin TEXT,
        khata_number TEXT,
        khesra_number TEXT,
        owner_name TEXT,
        father_husband TEXT,
        owner_type TEXT,
        co_owners TEXT,
        kisam TEXT,
        area_decimal NUMERIC,
        area_sqm NUMERIC,
        lagaan NUMERIC,
        lagaan_status TEXT,
        mauza TEXT,
        halka TEXT,
        anchal TEXT,
        district TEXT,
        jamabandi_date TEXT,
        has_conflict BOOLEAN DEFAULT FALSE,
        source_file TEXT,
        imported_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS integration.parcel_matches (
        match_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        parcel_id UUID NOT NULL,
        source_system TEXT NOT NULL,
        source_record_id TEXT NOT NULL,
        match_method TEXT NOT NULL,
        match_score NUMERIC,
        status TEXT NOT NULL DEFAULT 'MATCHED',
        area_diff_pct NUMERIC,
        matched_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (parcel_id) REFERENCES gis.parcels(parcel_id) ON DELETE CASCADE
      );
    `);

    // Stage RoR (batch)
    const rorPath = path.join(__dirname, '..', 'data', 'bihar', 'essential_layer', 'jamabandi_ror.json');
    const rorFile = JSON.parse(fs.readFileSync(rorPath, 'utf8'));
    const rorData = Array.isArray(rorFile) ? rorFile : rorFile.records || rorFile.data || [];
    console.log(`   RoR records: ${rorData.length}`);

    const rorValues = [];
    const rorParams = [];
    let ri = 1;

    for (const r of rorData) {
      rorValues.push(`($${ri++},$${ri++},$${ri++},$${ri++},$${ri++},$${ri++},$${ri++},$${ri++},$${ri++},$${ri++},$${ri++},$${ri++},$${ri++},$${ri++},$${ri++},$${ri++},$${ri++},$${ri++},$${ri++})`);
      rorParams.push(
        r.jamabandi_id, r.ulpin, r.khata_no, r.khesra_no,
        r.raiyat_name, r.pita_pati_name, r.raiyat_type, r.co_raiyats || null,
        r.kisam, r.rakba_decimal, r.rakba_decimal * 40.4686,
        r.lagaan, r.lagaan_status,
        r.mauza, r.halka, r.anchal, r.district,
        r.jamabandi_date || null, r._has_conflict || false
      );
    }

    await client.query(
      `INSERT INTO staging.ror_raw (jamabandi_id, ulpin, khata_number, khesra_number, owner_name, father_husband, owner_type, co_owners, kisam, area_decimal, area_sqm, lagaan, lagaan_status, mauza, halka, anchal, district, jamabandi_date, has_conflict)
       VALUES ${rorValues.join(',')}
       ON CONFLICT (jamabandi_id) DO NOTHING`,
      rorParams
    );
    const stagedCount = await client.query('SELECT COUNT(*) AS c FROM staging.ror_raw');
    console.log(`   ✅ Staged: ${stagedCount.rows[0].c} RoR records`);

    // Match RoR → Parcels (ULPIN exact match)
    console.log('\n🔗 Matching RoR → Parcels...');
    const matchResult = await client.query(`
      INSERT INTO integration.parcel_matches (parcel_id, source_system, source_record_id, match_method, match_score, status, area_diff_pct)
      SELECT
        p.parcel_id,
        'JAMABANDI_ROR',
        r.jamabandi_id,
        'EXACT_ULPIN',
        100,
        'MATCHED',
        CASE WHEN p.area > 0 THEN ABS(p.area - r.area_sqm) / p.area * 100 ELSE 0 END
      FROM gis.parcels p
      JOIN staging.ror_raw r ON p.ulpin = r.ulpin
      ON CONFLICT DO NOTHING
      RETURNING match_id
    `);
    console.log(`   ✅ Matched: ${matchResult.rowCount} (ULPIN exact)`);

    // Level 2: Village + Khesra for unmatched
    const surveyMatch = await client.query(`
      INSERT INTO integration.parcel_matches (parcel_id, source_system, source_record_id, match_method, match_score, status)
      SELECT p.parcel_id, 'JAMABANDI_ROR', r.jamabandi_id, 'VILLAGE_SURVEY', 95, 'MATCHED'
      FROM gis.parcels p
      JOIN staging.ror_raw r ON p.survey_number = r.khesra_number AND p.village_code = '33' AND r.mauza = 'Arghawa'
      WHERE NOT EXISTS (SELECT 1 FROM integration.parcel_matches m WHERE m.source_record_id = r.jamabandi_id)
      ON CONFLICT DO NOTHING
      RETURNING match_id
    `);
    console.log(`   ✅ Matched: ${surveyMatch.rowCount} (Village+Survey)`);

    const totalMatched = await client.query("SELECT COUNT(*) AS c FROM integration.parcel_matches WHERE source_system = 'JAMABANDI_ROR'");
    const unmatched = rorData.length - totalMatched.rows[0].c;
    const matchRate = ((totalMatched.rows[0].c / rorData.length) * 100).toFixed(1);
    console.log(`   Match rate: ${matchRate}% (${totalMatched.rows[0].c}/${rorData.length}, ${unmatched} unmatched)`);

    // Create owners
    console.log('\n👤 Creating owners...');
    const ownerResult = await client.query(`
      INSERT INTO land.owners (owner_type, name, father_husband, source_system)
      SELECT DISTINCT COALESCE(r.owner_type, 'Individual'), r.owner_name, r.father_husband, 'JAMABANDI_ROR'
      FROM staging.ror_raw r
      JOIN integration.parcel_matches m ON m.source_record_id = r.jamabandi_id
      WHERE r.owner_name IS NOT NULL AND r.owner_name != ''
      ON CONFLICT DO NOTHING
      RETURNING owner_id
    `);
    console.log(`   ✅ Owners: ${ownerResult.rowCount}`);

    // Create ownership links
    const ownershipResult = await client.query(`
      INSERT INTO land.parcel_ownership (parcel_id, owner_id, ownership_type, ownership_share, valid_from, source_system)
      SELECT m.parcel_id, o.owner_id, r.owner_type, 1.0, r.jamabandi_date::date, 'JAMABANDI_ROR'
      FROM integration.parcel_matches m
      JOIN staging.ror_raw r ON m.source_record_id = r.jamabandi_id
      JOIN land.owners o ON o.name = r.owner_name AND o.source_system = 'JAMABANDI_ROR'
      WHERE m.source_system = 'JAMABANDI_ROR'
      ON CONFLICT DO NOTHING
      RETURNING parcel_id
    `);
    console.log(`   ✅ Ownership links: ${ownershipResult.rowCount}`);

    // Create RoR records
    console.log('\n📜 Creating RoR records...');
    const rorResult = await client.query(`
      INSERT INTO land.ror_records (parcel_id, khata_number, khesra_number, land_classification, area, area_unit, revenue_amount, revenue_status, effective_from, source_system)
      SELECT m.parcel_id, r.khata_number, r.khesra_number, r.kisam, r.area_decimal, 'decimal', r.lagaan, r.lagaan_status, r.jamabandi_date::date, 'JAMABANDI_ROR'
      FROM integration.parcel_matches m
      JOIN staging.ror_raw r ON m.source_record_id = r.jamabandi_id
      WHERE m.source_system = 'JAMABANDI_ROR'
      ON CONFLICT DO NOTHING
      RETURNING ror_id
    `);
    console.log(`   ✅ RoR records: ${rorResult.rowCount}`);

    // Register data sources
    await client.query(`
      INSERT INTO metadata.data_sources (system_name, department, state_code, dataset_name, format, notes)
      VALUES
        ('SYNTHETIC_BIHAR_CADASTRAL', 'Revenue Department', 'BR', 'Cadastral Parcels (Arghawa)', 'GeoJSON', 'Synthetic data for SIH 2026 prototype'),
        ('JAMABANDI_ROR', 'Revenue Department', 'BR', 'Jamabandi/RoR (Arghawa)', 'JSON', 'Synthetic Jamabandi records for SIH 2026')
      ON CONFLICT DO NOTHING
    `);

    // ========================================
    // FINAL SUMMARY
    // ========================================
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║  📊 FINAL DATABASE STATE                         ║');
    console.log('╚══════════════════════════════════════════════════╝');

    const tables = [
      ['gis.parcels', 'Cadastral parcels'],
      ['gis.parcel_identifiers', 'Cross-dept IDs'],
      ['land.owners', 'Owners'],
      ['land.parcel_ownership', 'Ownership links'],
      ['land.ror_records', 'RoR records'],
      ['staging.ror_raw', 'Staged RoR (raw)'],
      ['integration.parcel_matches', 'Matches'],
      ['metadata.data_sources', 'Data sources'],
    ];

    for (const [table, desc] of tables) {
      const r = await client.query(`SELECT COUNT(*) AS c FROM ${table}`);
      console.log(`   ${desc.padEnd(22)} ${r.rows[0].c.toString().padStart(5)} rows`);
    }

    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║  ✅ INGESTION COMPLETE — Ready for API + Map!   ║');
    console.log('╚══════════════════════════════════════════════════╝');

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    await client.query('ROLLBACK').catch(() => {});
  } finally {
    client.release();
    await pool.end();
  }
}

run();
