/**
 * LandStack — Database Connection Test
 * Run: node scripts/test-db.js
 *
 * Tests:
 * 1. PostgreSQL connection
 * 2. PostGIS extension
 * 3. First spatial query (ST_Distance)
 * 4. GeoJSON conversion (ST_AsGeoJSON)
 */

const { Pool } = require('pg');

// Load environment variables from .env
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not set. Create a .env file with DATABASE_URL=postgresql://...');
  process.exit(1);
}


async function testDatabase() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  LandStack — Database Connection Test            ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Test 1: Basic connection
    console.log('1️⃣  Testing PostgreSQL connection...');
    const pgRes = await pool.query('SELECT version()');
    console.log(`   ✅ ${pgRes.rows[0].version.split(',')[0]}\n`);

    // Test 2: PostGIS extension
    console.log('2️⃣  Testing PostGIS extension...');
    const gisRes = await pool.query('SELECT PostGIS_Full_Version()');
    console.log(`   ✅ ${gisRes.rows[0].postgis_full_version.substring(0, 80)}\n`);

    // Test 3: Create test table + spatial query
    console.log('3️⃣  Testing spatial operations...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS gis_test_points (
        id SERIAL PRIMARY KEY,
        name TEXT,
        geom GEOMETRY(Point, 4326)
      )
    `);

    await pool.query(`
      INSERT INTO gis_test_points (name, geom)
      VALUES (
        'Arghawa Village Center',
        ST_SetSRID(ST_MakePoint(86.12, 26.36), 4326)
      )
      ON CONFLICT DO NOTHING
    `);

    const distRes = await pool.query(`
      SELECT
        ST_Distance(
          geom::geography,
          ST_SetSRID(ST_MakePoint(86.13, 26.37)::geography, 4326)
        ) AS distance_meters
      FROM gis_test_points
      LIMIT 1
    `);
    console.log(`   ✅ ST_Distance works: ${Math.round(distRes.rows[0].distance_meters)}m between two points\n`);

    // Test 4: GeoJSON output
    console.log('4️⃣  Testing GeoJSON conversion...');
    const gjRes = await pool.query(`
      SELECT ST_AsGeoJSON(geom)::json AS geojson
      FROM gis_test_points
      LIMIT 1
    `);
    console.log(`   ✅ ST_AsGeoJSON: ${JSON.stringify(gjRes.rows[0].geojson)}\n`);

    // Cleanup
    await pool.query('DROP TABLE IF EXISTS gis_test_points');

    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║  ✅ ALL TESTS PASSED — PostGIS is ready!        ║');
    console.log('╚══════════════════════════════════════════════════╝');

  } catch (err) {
    console.error(`\n❌ ERROR: ${err.message}`);

    if (err.message.includes('connect') || err.message.includes('ENOTFOUND')) {
      console.error('\n💡 Database connection failed. Try:');
      console.error('   1. Verify DATABASE_URL in your .env file');
      console.error('   2. Ensure the Supabase project is active and using the IPv4 pooler endpoint');
      console.error('   3. Run: node scripts/test-db.js');
    } else if (err.message.includes('postgis')) {
      console.error('\n💡 PostGIS extension not found. Enable PostGIS in Supabase SQL Editor:');
      console.error('   CREATE EXTENSION IF NOT EXISTS postgis;');
    }
  } finally {
    await pool.end();
  }
}

testDatabase();
