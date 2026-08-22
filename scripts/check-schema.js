const { Pool } = require('pg');
require('dotenv').config();
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const tables = [
  'governance.registrations', 'governance.encumbrances',
  'governance.building_permissions', 'governance.disputes',
  'governance.property_tax', 'governance.circle_rates',
  'gis.master_plan_zones', 'gis.land_use_zones', 'gis.restriction_zones'
];

async function main() {
  for (const t of tables) {
    const [schema, table] = t.split('.');
    const r = await p.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2 ORDER BY ordinal_position`,
      [schema, table]
    );
    console.log(`${t}: ${r.rows.map(x => x.column_name).join(', ')}`);
  }
  
  // Also check sample registration data
  const reg = require('../data/bihar/essential_layer/registration_records.json');
  const recs = Array.isArray(reg) ? reg : reg.records || [];
  console.log('\nReg sample keys:', Object.keys(recs[0]).join(', '));
  
  const enc = require('../data/bihar/essential_layer/encumbrance_records.json');
  const erecs = Array.isArray(enc) ? enc : enc.records || [];
  console.log('Enc sample keys:', Object.keys(erecs[0]).join(', '));
  
  const bp = require('../data/bihar/essential_layer/building_permissions.json');
  const brecs = Array.isArray(bp) ? bp : bp.records || [];
  console.log('BP sample keys:', Object.keys(brecs[0]).join(', '));
  
  const disp = require('../data/bihar/usecase_layer/dispute_records.json');
  const drecs = Array.isArray(disp) ? disp : disp.records || [];
  console.log('Dispute sample keys:', Object.keys(drecs[0]).join(', '));
  
  const tax = require('../data/bihar/usecase_layer/property_tax.json');
  const trecs = Array.isArray(tax) ? tax : tax.records || [];
  console.log('Tax sample keys:', Object.keys(trecs[0]).join(', '));
  
  await p.end();
}
main();
