/**
 * LandStack — Supabase Schema Migration
 * Run: node scripts/migrate-supabase.js
 */

const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set in .env');
  process.exit(1);
}

async function migrate() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  LandStack — Supabase Schema Migration           ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Read schema SQL
    const sql = fs.readFileSync('database/migrations/001_initial_schema.sql', 'utf8');

    console.log('1️⃣  Running schema migration...');
    await pool.query(sql);
    console.log('   ✅ Schema created!\n');

    // Verify
    console.log('2️⃣  Verifying tables...');
    const res = await pool.query(
      "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('gis','land','governance','metadata','audit') ORDER BY table_schema, table_name"
    );

    for (const row of res.rows) {
      console.log(`   📋 ${row.table_schema}.${row.table_name}`);
    }

    console.log(`\n   Total: ${res.rows.length} tables\n`);

    // Test PostGIS
    console.log('3️⃣  Testing PostGIS...');
    const gis = await pool.query('SELECT PostGIS_Version() AS v');
    console.log(`   ✅ PostGIS ${gis.rows[0].v}\n`);

    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║  ✅ MIGRATION COMPLETE — Supabase ready!        ║');
    console.log('╚══════════════════════════════════════════════════╝');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
