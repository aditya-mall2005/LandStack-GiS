/**
 * Land Stack - Complete Missing Data Generator
 * SIH 2026 | PS #26014
 *
 * Generates ALL remaining datasets that were missing:
 * 
 * BIHAR missing:
 *   - Building permissions
 *   - Circle rates / valuation
 *   - Zoning / master plan (GeoJSON)
 *   - Environmental / restriction zones (GeoJSON)
 *   - Dispute / court records
 *   - Infrastructure (roads, water, utilities) GeoJSON
 *   - Utilities per parcel
 *
 * PROJECT-WIDE missing:
 *   - Tamil Nadu sample data (small set for adapter demo)
 *   - Audit trail sample
 *   - RBAC users & roles
 *   - Workflow sample (mutation, registration)
 *   - Satellite change detection mock
 *   - PostGIS seed SQL
 *   - API specification (OpenAPI-style)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function randomBetween(min, max) { return Math.random() * (max - min) + min; }
function randomInt(min, max) { return Math.floor(randomBetween(min, max + 1)); }
function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomDate(sy, ey) {
  const d = new Date(sy, 0, 1);
  d.setTime(d.getTime() + Math.random() * (new Date(ey, 11, 31).getTime() - d.getTime()));
  return d.toISOString().split('T')[0];
}
function writeJSON(relPath, data) {
  const fullPath = path.join(__dirname, '..', relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf8');
}
function writeText(relPath, text) {
  const fullPath = path.join(__dirname, '..', relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, text, 'utf8');
}

const NAMES_FIRST = ['Ramesh','Suresh','Rajesh','Dinesh','Mukesh','Anil','Sanjay','Vijay','Manoj','Ravi','Deepak','Santosh','Umesh','Ram','Shyam','Mohan','Gopal','Krishna','Ashok','Amit','Sunita','Geeta','Meena','Rekha','Savitri','Kiran','Priya','Anita'];
const NAMES_LAST = ['Kumar','Prasad','Singh','Yadav','Mishra','Jha','Sharma','Pandey','Tiwari','Chaudhary','Mandal','Sah','Gupta','Verma','Das','Sinha','Lal','Thakur','Dubey','Roy'];
function randomName() { return `${randomChoice(NAMES_FIRST)} ${randomChoice(NAMES_LAST)}`; }

// Read Bihar parcels to link data
const biharParcelsPath = path.join(__dirname, '..', 'data/bihar/base_layer/cadastral_parcels.geojson');
const biharParcels = JSON.parse(fs.readFileSync(biharParcelsPath, 'utf8'));
const parcels = biharParcels.features;

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║  Land Stack - Complete Missing Data Generator               ║');
console.log('║  Filling ALL gaps for Bihar + Project-wide files            ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ============================================================================
// 1. BIHAR: BUILDING PERMISSIONS
// ============================================================================
(function() {
  console.log('🏗️  Bihar: Building Permissions...');
  const buildable = parcels.filter(f => ['Residential','Commercial','Mixed Use'].includes(f.properties.kisam));
  const selected = buildable.filter(() => Math.random() > 0.3);
  
  const records = selected.map((f, i) => {
    const p = f.properties;
    const floors = p.kisam === 'Commercial' ? randomInt(1, 4) : randomInt(1, 3);
    const builtUp = Math.round(p.rakba_sqm * randomBetween(0.3, 0.7) * floors);
    return {
      permission_id: `BP-BR-${String(i+1).padStart(5,'0')}`,
      ulpin: p.ulpin,
      khesra_no: p.khesra_no,
      avedan_karta: p.raiyat_name,
      bhavan_prakar: p.kisam === 'Residential' ? randomChoice(['Aavaasiy Bhavan','Kachcha Ghar','Pucca Ghar']) :
                    randomChoice(['Dukaan','Godown','Karyalaya']),
      prastavit_manjil: floors,
      prastavit_kshetrafal_sqm: builtUp,
      bhukhand_kshetrafal_sqm: p.rakba_sqm,
      avedan_tarikh: randomDate(2020, 2025),
      anumodan_tarikh: randomDate(2021, 2026),
      vaidhata_tarikh: randomDate(2027, 2031),
      sthiti: randomChoice(['Approved','Approved','Approved','Conditionally Approved','Pending','Rejected']),
      agni_noc: Math.random() > 0.3,
      paryavaran_anumodan: p.rakba_sqm > 1000 ? (Math.random() > 0.4) : 'Not Required',
      pradhikaran: 'Nagar Panchayat, Basopatti / Block Development Office',
      mauza: p.mauza, halka: p.halka, district: p.district,
    };
  });
  writeJSON('data/bihar/essential_layer/building_permissions.json', {
    metadata: { description: 'Building Permissions — Bihar', disclaimer: 'DEMO DATA', total_records: records.length, date_created: new Date().toISOString() },
    records,
  });
  console.log(`   ✅ ${records.length} building permission records`);
})();

// ============================================================================
// 2. BIHAR: CIRCLE RATES / VALUATION
// ============================================================================
(function() {
  console.log('📊  Bihar: Circle Rates / Valuation...');
  const rates = [
    { area: 'Arghawa Village (Agricultural)', agricultural_per_decimal: 15000, residential_per_sqft: null },
    { area: 'Arghawa Market Area', agricultural_per_decimal: null, residential_per_sqft: 800, commercial_per_sqft: 1200 },
    { area: 'Basopatti Block HQ', agricultural_per_decimal: null, residential_per_sqft: 1000, commercial_per_sqft: 1500 },
    { area: 'NH-57 Corridor (Near Arghawa)', agricultural_per_decimal: 25000, residential_per_sqft: 600, commercial_per_sqft: 900 },
    { area: 'Interior Agricultural Land', agricultural_per_decimal: 8000, residential_per_sqft: null },
    { area: 'Pond/Low-lying Area', agricultural_per_decimal: 5000, residential_per_sqft: null },
  ];
  const circleRates = rates.map((r, i) => ({
    zone_id: `CRZ-BR-${String(i+1).padStart(3,'0')}`,
    zone_name: r.area,
    rates: {
      agricultural: r.agricultural_per_decimal ? { rate_per_decimal: r.agricultural_per_decimal, unit: 'INR per decimal' } : null,
      residential: r.residential_per_sqft ? { rate_per_sqft: r.residential_per_sqft, rate_per_sqm: Math.round(r.residential_per_sqft * 10.764), unit: 'INR per sq.ft' } : null,
      commercial: r.commercial_per_sqft ? { rate_per_sqft: r.commercial_per_sqft, rate_per_sqm: Math.round(r.commercial_per_sqft * 10.764), unit: 'INR per sq.ft' } : null,
    },
    effective_date: '2025-04-01',
    valid_till: '2026-03-31',
    notification: `DC/MVR/${randomInt(100,999)}/2025`,
    authority: 'District Collector, Madhubani',
  }));
  writeJSON('data/bihar/usecase_layer/circle_rates.json', {
    metadata: { description: 'Circle Rates / Minimum Valuation Rates — Bihar Madhubani', disclaimer: 'DEMO DATA', financial_year: '2025-26', date_created: new Date().toISOString() },
    circle_rates: circleRates,
  });
  console.log(`   ✅ ${circleRates.length} circle rate zones`);
})();

// ============================================================================
// 3. BIHAR: ZONING / MASTER PLAN
// ============================================================================
(function() {
  console.log('🗂️  Bihar: Zoning / Master Plan...');
  const lat = 26.36, lng = 86.12;
  const zones = [
    { name: 'Agricultural Zone', code: 'AG', color: '#4CAF50', lat: lat+0.008, lng: lng-0.003, size: 0.012, type: 'Agricultural' },
    { name: 'Residential Zone', code: 'RS', color: '#2196F3', lat: lat+0.002, lng: lng+0.002, size: 0.006, type: 'Residential' },
    { name: 'Commercial Zone (Market)', code: 'CM', color: '#FF9800', lat: lat+0.002, lng: lng-0.006, size: 0.004, type: 'Commercial' },
    { name: 'Mixed Use Zone', code: 'MX', color: '#9C27B0', lat: lat-0.002, lng: lng-0.002, size: 0.005, type: 'Mixed Use' },
    { name: 'Green / Open Space', code: 'GR', color: '#1B5E20', lat: lat-0.008, lng: lng+0.006, size: 0.008, type: 'Green' },
    { name: 'Water Body / Wetland', code: 'WB', color: '#0D47A1', lat: lat-0.006, lng: lng-0.008, size: 0.005, type: 'Water' },
    { name: 'Government / Institutional', code: 'GI', color: '#607D8B', lat: lat+0.005, lng: lng+0.006, size: 0.004, type: 'Institutional' },
    { name: 'Transport Corridor (NH)', code: 'TR', color: '#795548', lat: lat, lng: lng+0.010, size: 0.003, type: 'Transport' },
  ];
  const features = zones.map((z, i) => {
    const s = z.size;
    return {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [[[z.lng-s,z.lat-s*0.8],[z.lng+s,z.lat-s*0.8],[z.lng+s*1.1,z.lat+s*0.9],[z.lng-s*0.9,z.lat+s],[z.lng-s,z.lat-s*0.8]]] },
      properties: { zone_id: `ZONE-BR-${String(i+1).padStart(3,'0')}`, zone_name: z.name, zone_code: z.code, zone_type: z.type, color: z.color, master_plan_year: 2031, authority: 'Block Development Office, Basopatti' },
    };
  });
  writeJSON('data/bihar/essential_layer/zoning_master_plan.geojson', {
    type: 'FeatureCollection', name: 'Bihar_Arghawa_Zoning',
    metadata: { description: 'Zoning / Master Plan — Bihar Arghawa', disclaimer: 'DEMO DATA', date_created: new Date().toISOString() },
    features,
  });
  console.log(`   ✅ ${features.length} zoning areas`);
})();

// ============================================================================
// 4. BIHAR: ENVIRONMENTAL / RESTRICTION ZONES
// ============================================================================
(function() {
  console.log('🌳  Bihar: Environmental Zones...');
  const lat = 26.36, lng = 86.12;
  const zones = [
    { name: 'Kamla River Flood Plain', type: 'Flood Zone', lat: lat+0.015, lng: lng-0.005, radius: 0.012, restrictions: ['No permanent habitation','Flood-resistant construction only','Mandatory insurance'], severity: 'High' },
    { name: 'Wetland Conservation Area', type: 'Wetland Buffer', lat: lat-0.008, lng: lng-0.010, radius: 0.008, restrictions: ['No construction within 100m','No industrial discharge','Wetland Protection Act applies'], severity: 'High' },
    { name: 'Village Common Grazing Land', type: 'Gair Mazarua Protection', lat: lat+0.005, lng: lng+0.008, radius: 0.006, restrictions: ['No encroachment','No commercial use','Community access required'], severity: 'Medium' },
    { name: 'Ancient Mound / Archaeological', type: 'Heritage Zone', lat: lat-0.003, lng: lng+0.005, radius: 0.003, restrictions: ['No excavation without ASI permission','Height restriction 10m','Buffer zone 100m'], severity: 'Medium' },
    { name: 'NH-57 Road Buffer', type: 'Road Buffer Zone', lat: lat, lng: lng+0.012, radius: 0.004, restrictions: ['No construction within 45m of NH center','NHAI clearance required'], severity: 'Low' },
  ];
  const features = zones.map((z, i) => {
    const pts = 20, coords = [];
    for (let j = 0; j <= pts; j++) {
      const a = (j/pts)*2*Math.PI;
      coords.push([z.lng+z.radius*Math.cos(a)*(1+randomBetween(-0.05,0.05)), z.lat+z.radius*0.8*Math.sin(a)*(1+randomBetween(-0.05,0.05))]);
    }
    coords[coords.length-1] = [...coords[0]];
    return {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [coords] },
      properties: { zone_id: `ENV-BR-${String(i+1).padStart(3,'0')}`, zone_name: z.name, zone_type: z.type, restrictions: z.restrictions, severity: z.severity,
        color: z.type.includes('Flood') ? '#E65100' : z.type.includes('Wetland') ? '#0D47A1' : z.type.includes('Heritage') ? '#4A148C' : z.type.includes('Road') ? '#455A64' : '#33691E',
        authority: z.type.includes('Flood') ? 'District Disaster Management, Madhubani' : z.type.includes('Heritage') ? 'ASI / State Archaeology' : 'District Administration, Madhubani',
      },
    };
  });
  writeJSON('data/bihar/usecase_layer/environmental_zones.geojson', {
    type: 'FeatureCollection', name: 'Bihar_Arghawa_Environmental_Zones',
    metadata: { description: 'Environmental / Restriction Zones — Bihar Arghawa', disclaimer: 'DEMO DATA', total_zones: features.length, date_created: new Date().toISOString() },
    features,
  });
  console.log(`   ✅ ${features.length} environmental zones`);
})();

// ============================================================================
// 5. BIHAR: DISPUTE / COURT RECORDS
// ============================================================================
(function() {
  console.log('⚖️  Bihar: Dispute Records...');
  const disputed = parcels.filter(() => Math.random() > 0.85);
  const courts = ['Civil Court, Madhubani','Revenue Court, Jaynagar','Munsif Court, Basopatti','District Court, Madhubani','High Court, Patna','Lok Adalat, Madhubani'];
  const types = ['Ownership Dispute','Boundary Dispute','Inheritance Dispute','Encroachment','Partition Suit','Mutation Objection','Eviction'];
  const records = disputed.map((f, i) => {
    const p = f.properties;
    return {
      case_id: `CASE-BR-${String(i+1).padStart(5,'0')}`,
      ulpin: p.ulpin, khesra_no: p.khesra_no,
      vivad_prakar: randomChoice(types),
      muqaddama_no: `CS-${randomInt(100,9999)}/${randomInt(2018,2026)}`,
      nyayalaya: randomChoice(courts),
      vaadi: randomName(), prativaadi: p.raiyat_name,
      vaadi_vakil: `Adv. ${randomName()}`, prativaadi_vakil: `Adv. ${randomName()}`,
      dakhil_tarikh: randomDate(2018, 2025),
      agla_sunvai: randomDate(2026, 2027),
      sthiti: randomChoice(['Pending','Pending','Under Hearing','Stay Order','Disposed','Settled']),
      stay_order: Math.random() > 0.7,
      hast_antaranh_prabhav: Math.random() > 0.4,
      vivaran: `Dispute regarding ${randomChoice(['ownership','boundary','possession','partition'])} of land at ${p.mauza}, ${p.halka}`,
    };
  });
  writeJSON('data/bihar/usecase_layer/dispute_records.json', {
    metadata: { description: 'Land Dispute / Court Records — Bihar', disclaimer: 'DEMO DATA', total_records: records.length, date_created: new Date().toISOString() },
    records,
  });
  console.log(`   ✅ ${records.length} dispute records`);
})();

// ============================================================================
// 6. BIHAR: INFRASTRUCTURE (Roads, Water, Utilities)
// ============================================================================
(function() {
  console.log('🛣️  Bihar: Infrastructure...');
  const lat = 26.36, lng = 86.12;

  // Roads
  const roads = {
    type: 'FeatureCollection', name: 'Bihar_Arghawa_Roads',
    metadata: { description: 'Road network — Bihar Arghawa (mock). For real data: use Overpass Turbo', note: 'Use https://overpass-turbo.eu/ with bbox 26.34,86.10,26.38,86.14', date_created: new Date().toISOString() },
    features: [
      { type:'Feature', geometry:{type:'LineString',coordinates:[[lng-0.02,lat],[lng,lat],[lng+0.02,lat]]}, properties:{name:'NH-57 (Muzaffarpur-Darbhanga-Forbesganj)',road_type:'primary',lanes:2,surface:'asphalt',width_m:10} },
      { type:'Feature', geometry:{type:'LineString',coordinates:[[lng,lat-0.015],[lng,lat],[lng,lat+0.015]]}, properties:{name:'Basopatti-Arghawa Road',road_type:'secondary',lanes:2,surface:'asphalt',width_m:7} },
      { type:'Feature', geometry:{type:'LineString',coordinates:[[lng-0.008,lat+0.005],[lng,lat+0.005],[lng+0.008,lat+0.005]]}, properties:{name:'Arghawa Village Internal Road',road_type:'tertiary',lanes:1,surface:'gravel',width_m:4} },
      { type:'Feature', geometry:{type:'LineString',coordinates:[[lng-0.005,lat-0.008],[lng-0.005,lat],[lng-0.005,lat+0.008]]}, properties:{name:'Kachcha Rasta (Farm Track)',road_type:'track',lanes:1,surface:'unpaved',width_m:3} },
      { type:'Feature', geometry:{type:'LineString',coordinates:[[lng+0.003,lat-0.005],[lng+0.003,lat+0.010]]}, properties:{name:'Market Road',road_type:'tertiary',lanes:1,surface:'asphalt',width_m:5} },
      { type:'Feature', geometry:{type:'LineString',coordinates:[[lng-0.012,lat+0.002],[lng-0.005,lat+0.002]]}, properties:{name:'Aahar Canal Service Road',road_type:'track',lanes:1,surface:'unpaved',width_m:3} },
    ],
  };

  // Water bodies
  const water = {
    type: 'FeatureCollection', name: 'Bihar_Arghawa_Water',
    metadata: { description: 'Water bodies — Bihar Arghawa', date_created: new Date().toISOString() },
    features: [
      { type:'Feature', geometry:{type:'Polygon',coordinates:[[[lng-0.012,lat+0.012],[lng-0.008,lat+0.011],[lng-0.006,lat+0.013],[lng-0.008,lat+0.015],[lng-0.011,lat+0.014],[lng-0.012,lat+0.012]]]}, properties:{name:'Kamla Nadi (River)',type:'River',status:'Seasonal'} },
      { type:'Feature', geometry:{type:'Polygon',coordinates:[[[lng+0.004,lat-0.006],[lng+0.006,lat-0.005],[lng+0.005,lat-0.003],[lng+0.003,lat-0.004],[lng+0.004,lat-0.006]]]}, properties:{name:'Village Pond (Pokhra)',type:'Pond',status:'Perennial'} },
      { type:'Feature', geometry:{type:'LineString',coordinates:[[lng-0.015,lat+0.003],[lng-0.008,lat+0.003],[lng,lat+0.002],[lng+0.010,lat+0.001]]}, properties:{name:'Aahar (Irrigation Canal)',type:'Canal',status:'Seasonal',maintained_by:'Water Resources Dept, Bihar'} },
    ],
  };

  // Utility points
  const utilities = {
    type: 'FeatureCollection', name: 'Bihar_Arghawa_Utilities',
    metadata: { description: 'Utility infrastructure — Bihar Arghawa', date_created: new Date().toISOString() },
    features: [
      { type:'Feature', geometry:{type:'Point',coordinates:[lng+0.003,lat+0.002]}, properties:{name:'Arghawa Electricity Substation',type:'Electricity',operator:'Bihar State Power Holding Co.',status:'Operational'} },
      { type:'Feature', geometry:{type:'Point',coordinates:[lng-0.002,lat+0.001]}, properties:{name:'Village Handpump (Chapakal)',type:'Water Supply',operator:'PHE Dept, Bihar',status:'Operational'} },
      { type:'Feature', geometry:{type:'Point',coordinates:[lng+0.001,lat-0.003]}, properties:{name:'Community Bore Well',type:'Water Supply',operator:'Gram Panchayat',status:'Operational'} },
      { type:'Feature', geometry:{type:'Point',coordinates:[lng-0.005,lat+0.004]}, properties:{name:'Solar Micro Grid',type:'Renewable Energy',operator:'BREDA',status:'Operational'} },
      { type:'Feature', geometry:{type:'Point',coordinates:[lng+0.002,lat+0.005]}, properties:{name:'Mobile Tower (Jio)',type:'Telecom',operator:'Reliance Jio',status:'Operational'} },
      { type:'Feature', geometry:{type:'Point',coordinates:[lng-0.001,lat-0.001]}, properties:{name:'Primary Health Sub-Centre',type:'Health',operator:'Govt of Bihar',status:'Operational'} },
      { type:'Feature', geometry:{type:'Point',coordinates:[lng+0.004,lat-0.002]}, properties:{name:'Anganwadi Centre',type:'Social',operator:'ICDS, Bihar',status:'Operational'} },
      { type:'Feature', geometry:{type:'Point',coordinates:[lng-0.003,lat+0.006]}, properties:{name:'Primary School',type:'Education',operator:'Bihar Education Dept',status:'Operational'} },
    ],
  };

  // Per-parcel utility connections
  const connections = parcels.filter(f => ['Residential','Commercial','Mixed Use'].includes(f.properties.kisam)).map((f, i) => ({
    utility_id: `UTIL-BR-${String(i+1).padStart(5,'0')}`,
    ulpin: f.properties.ulpin, khesra_no: f.properties.khesra_no,
    bijli: { connection: Math.random() > 0.15, meter_no: Math.random() > 0.15 ? `BM-${randomInt(100000,999999)}` : null, load_kw: randomBetween(1, 5).toFixed(1), provider: 'SBPDCL' },
    jal: { connection: Math.random() > 0.3, source: randomChoice(['Handpump','Borewell','Piped','None']), jal_jeevan_mission: Math.random() > 0.4 },
    shauchalay: { swachh_bharat: Math.random() > 0.3, type: randomChoice(['Twin Pit','Septic Tank','None','None']) },
    gas: { pmuy_connection: Math.random() > 0.5, provider: Math.random() > 0.5 ? 'HP Gas' : 'Indane' },
  }));

  writeJSON('data/bihar/usecase_layer/roads.geojson', roads);
  writeJSON('data/bihar/usecase_layer/water_bodies.geojson', water);
  writeJSON('data/bihar/usecase_layer/utility_infrastructure.geojson', utilities);
  writeJSON('data/bihar/usecase_layer/utility_connections.json', {
    metadata: { description: 'Per-parcel utility connections — Bihar', disclaimer: 'DEMO DATA', total_records: connections.length, date_created: new Date().toISOString() },
    records: connections,
  });

  console.log(`   ✅ ${roads.features.length} road segments`);
  console.log(`   ✅ ${water.features.length} water features`);
  console.log(`   ✅ ${utilities.features.length} utility points`);
  console.log(`   ✅ ${connections.length} per-parcel utility connections`);
})();

// ============================================================================
// 7. TAMIL NADU: SMALL SAMPLE DATA (for adapter demo)
// ============================================================================
(function() {
  console.log('🏛️  Tamil Nadu: Sample Data (Adapter Demo)...');
  const tnLat = 12.92, tnLng = 79.13; // Near Kancheepuram
  const tnParcels = [];
  for (let i = 1; i <= 30; i++) {
    const lat = tnLat + randomBetween(-0.005, 0.005);
    const lng = tnLng + randomBetween(-0.005, 0.005);
    const areaC = randomBetween(5, 200); // cents
    const sizeM = Math.sqrt(areaC * 40.4686);
    const latOff = sizeM / 111320 * randomBetween(0.8,1.2);
    const lngOff = sizeM / (111320 * Math.cos(lat*Math.PI/180)) * randomBetween(0.8,1.2);
    const j = () => randomBetween(-0.1,0.1);
    const coords = [[
      [lng-lngOff/2+lngOff*j(), lat-latOff/2+latOff*j()],
      [lng+lngOff/2+lngOff*j(), lat-latOff/2+latOff*j()],
      [lng+lngOff/2+lngOff*j(), lat+latOff/2+latOff*j()],
      [lng-lngOff/2+lngOff*j(), lat+latOff/2+latOff*j()],
    ]];
    coords[0].push([...coords[0][0]]);
    
    const tnFirst = ['Murugan','Senthil','Karthik','Rajan','Lakshmi','Meena','Selvi','Sundari','Anand','Bala','Chithra','Devi','Ezhil','Gopi','Hari','Iniyan','Jaya','Kavitha','Malathi','Nila'];
    const tnLast = ['Nadar','Pillai','Thevar','Mudaliar','Gounder','Iyer','Iyengar','Chettiar','Raja','Mani','Subramanian','Krishnan','Venkatesh','Pandian','Selvam'];
    const name = `${randomChoice(tnFirst)} ${randomChoice(tnLast)}`;
    
    tnParcels.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: coords },
      properties: {
        ulpin: `IN-TN-27-${String(i).padStart(8,'0')}-${crypto.randomBytes(1).toString('hex').substring(0,2).toUpperCase()}`,
        survey_no: `${randomInt(1,500)}/${randomInt(1,10)}`,
        sub_div_no: String(randomInt(1,5)),
        patta_no: String(randomInt(1,200)),
        pattadhar: name,
        thandai: `${randomChoice(tnFirst)} ${randomChoice(tnLast)}`,
        nanjai_punjai: randomChoice(['Nanjai','Punjai','Manal','Thottam','Poramboke']),
        parappu_cents: parseFloat(areaC.toFixed(2)),
        parappu_hectare: parseFloat((areaC * 0.00404686).toFixed(4)),
        parappu_sqm: Math.round(areaC * 40.4686),
        kiramanam: 'Orikkai',
        taluk: 'Kancheepuram',
        district: 'Kancheepuram',
        state: 'Tamil Nadu',
      },
    });
  }
  
  writeJSON('data/tamilnadu/base_layer/cadastral_parcels.geojson', {
    type: 'FeatureCollection', name: 'TN_Orikkai_Sample_Parcels',
    metadata: { description: 'Sample cadastral parcels — Tamil Nadu (for State Adapter demo)', disclaimer: 'DEMO DATA', total_parcels: tnParcels.length, pilot: 'Orikkai village, Kancheepuram', date_created: new Date().toISOString() },
    features: tnParcels,
  });

  // TN Chitta (RoR equivalent)
  const tnChitta = tnParcels.map((f, i) => ({
    chitta_id: `CHT-TN-${String(i+1).padStart(5,'0')}`,
    ulpin: f.properties.ulpin,
    survey_no: f.properties.survey_no,
    patta_no: f.properties.patta_no,
    pattadhar: f.properties.pattadhar,
    thandai: f.properties.thandai,
    nanjai_punjai: f.properties.nanjai_punjai,
    parappu_cents: f.properties.parappu_cents,
    varuvaai: randomInt(100, 5000),
    nilam_vakai: f.properties.nanjai_punjai === 'Nanjai' ? 'Wet Land (Paddy)' : f.properties.nanjai_punjai === 'Punjai' ? 'Dry Land' : f.properties.nanjai_punjai,
    sthiti: randomChoice(['Active','Active','Active','Under Revision']),
  }));
  writeJSON('data/tamilnadu/essential_layer/chitta_ror.json', {
    metadata: { description: 'Chitta (RoR) — Tamil Nadu Sample', disclaimer: 'DEMO DATA', total_records: tnChitta.length, date_created: new Date().toISOString() },
    records: tnChitta,
  });

  console.log(`   ✅ ${tnParcels.length} Tamil Nadu sample parcels`);
  console.log(`   ✅ ${tnChitta.length} Tamil Nadu Chitta (RoR) records`);
})();

// ============================================================================
// 8. AUDIT TRAIL SAMPLE
// ============================================================================
(function() {
  console.log('📝  Audit Trail Sample...');
  const events = [];
  const actions = ['VIEW_PARCEL','UPDATE_OWNER','CREATE_MUTATION','APPROVE_MUTATION','VIEW_ROR','UPDATE_REGISTRATION','APPROVE_BUILDING_PERMIT','VIEW_TAX','UPDATE_ENCUMBRANCE','EXPORT_DATA','LOGIN','LOGOUT'];
  const officers = [
    { id: 'OFF-001', name: 'Demo Revenue Officer', role: 'Revenue Officer', department: 'Revenue' },
    { id: 'OFF-002', name: 'Demo Registration Officer', role: 'Registration Officer', department: 'Registration' },
    { id: 'OFF-003', name: 'Demo Planning Officer', role: 'Planning Officer', department: 'Planning' },
    { id: 'CIT-001', name: 'Demo Citizen', role: 'Citizen', department: null },
    { id: 'ADM-001', name: 'Demo Administrator', role: 'Administrator', department: 'IT' },
  ];

  for (let i = 0; i < 200; i++) {
    const officer = randomChoice(officers);
    const action = randomChoice(actions);
    const parcel = randomChoice(parcels);
    const timestamp = new Date(2026, randomInt(0,7), randomInt(1,28), randomInt(8,20), randomInt(0,59), randomInt(0,59));
    
    events.push({
      audit_id: `AUD-${String(i+1).padStart(6,'0')}`,
      timestamp: timestamp.toISOString(),
      user_id: officer.id,
      user_name: officer.name,
      user_role: officer.role,
      department: officer.department,
      action: action,
      resource_type: action.includes('PARCEL') || action.includes('OWNER') ? 'Parcel' : action.includes('ROR') || action.includes('MUTATION') ? 'RoR' : action.includes('REGISTRATION') ? 'Registration' : action.includes('TAX') ? 'Tax' : action.includes('BUILDING') ? 'Building Permission' : 'System',
      resource_id: parcel.properties.ulpin,
      details: action === 'UPDATE_OWNER' ? { old_value: randomName(), new_value: parcel.properties.raiyat_name, reason: `Mutation Order #MUT-${randomInt(1000,9999)}` } :
               action === 'APPROVE_MUTATION' ? { mutation_id: `MUT-BR-${randomInt(1000,9999)}`, status: 'Approved' } :
               action === 'LOGIN' ? { ip: `192.168.${randomInt(1,255)}.${randomInt(1,255)}`, device: 'Chrome/Windows' } :
               { note: `${action} performed on ${parcel.properties.ulpin}` },
      ip_address: `192.168.${randomInt(1,255)}.${randomInt(1,255)}`,
      status: 'SUCCESS',
    });
  }

  events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  writeJSON('data/project/audit_trail.json', {
    metadata: { description: 'Audit Trail — LandStack Demo', total_events: events.length, date_created: new Date().toISOString() },
    events,
  });
  console.log(`   ✅ ${events.length} audit trail events`);
})();

// ============================================================================
// 9. RBAC USERS & ROLES
// ============================================================================
(function() {
  console.log('👥  RBAC Users & Roles...');
  const rbac = {
    metadata: { description: 'Role-Based Access Control Configuration — LandStack', date_created: new Date().toISOString() },
    roles: [
      { role_id: 'citizen', role_name: 'Citizen', description: 'Public user — can search parcels, view public info, verify ownership, track applications',
        permissions: ['parcel:search','parcel:view_public','ownership:verify','application:track','service:request','tax:view_own'] },
      { role_id: 'revenue_officer', role_name: 'Revenue Officer', description: 'Manages RoR, mutations, land classification',
        permissions: ['parcel:view_all','parcel:edit','ror:view','ror:edit','mutation:create','mutation:approve','encumbrance:view','land_use:view','dispute:view','audit:view_own'] },
      { role_id: 'registration_officer', role_name: 'Registration Officer', description: 'Manages property registration, deed verification',
        permissions: ['parcel:view_all','registration:view','registration:create','registration:approve','encumbrance:view','encumbrance:create','stamp_duty:calculate','audit:view_own'] },
      { role_id: 'planning_officer', role_name: 'Planning Officer', description: 'Manages building permissions, master plan, land-use',
        permissions: ['parcel:view_all','land_use:view','land_use:edit','building_permission:view','building_permission:approve','master_plan:view','master_plan:edit','satellite:view','violation:flag','audit:view_own'] },
      { role_id: 'tax_officer', role_name: 'Tax Officer', description: 'Manages property tax assessment and collection',
        permissions: ['parcel:view_all','tax:view','tax:assess','tax:collect','valuation:view','valuation:update','audit:view_own'] },
      { role_id: 'administrator', role_name: 'System Administrator', description: 'Full system access — user management, configuration, audit',
        permissions: ['*:*','user:manage','system:configure','audit:view_all','data:export','adapter:manage'] },
    ],
    demo_users: [
      { user_id: 'CIT-001', name: 'Ramesh Kumar (Citizen)', role: 'citizen', state: 'Bihar', email: 'demo.citizen@landstack.gov.in' },
      { user_id: 'CIT-002', name: 'Selvi Mudaliar (Citizen)', role: 'citizen', state: 'Tamil Nadu', email: 'demo.citizen2@landstack.gov.in' },
      { user_id: 'OFF-001', name: 'Rajesh Prasad (Revenue)', role: 'revenue_officer', state: 'Bihar', department: 'Revenue', posting: 'Basopatti Circle' },
      { user_id: 'OFF-002', name: 'Dinesh Mishra (Registration)', role: 'registration_officer', state: 'Bihar', department: 'Registration', posting: 'SRO Jaynagar' },
      { user_id: 'OFF-003', name: 'Sanjay Tiwari (Planning)', role: 'planning_officer', state: 'Bihar', department: 'Planning', posting: 'Block Dev Office, Basopatti' },
      { user_id: 'OFF-004', name: 'Vijay Jha (Tax)', role: 'tax_officer', state: 'Bihar', department: 'Revenue', posting: 'Nagar Panchayat, Basopatti' },
      { user_id: 'ADM-001', name: 'System Admin', role: 'administrator', state: null, department: 'IT' },
    ],
  };
  writeJSON('data/project/rbac_config.json', rbac);
  console.log(`   ✅ ${rbac.roles.length} roles, ${rbac.demo_users.length} demo users`);
})();

// ============================================================================
// 10. WORKFLOW SAMPLES (Mutation, Registration)
// ============================================================================
(function() {
  console.log('🔀  Workflow Samples...');
  const workflows = {
    metadata: { description: 'Workflow Definitions and Sample Instances — LandStack', date_created: new Date().toISOString() },
    workflow_definitions: [
      {
        workflow_id: 'WF-MUTATION',
        name: 'Land Mutation Workflow',
        description: 'Process for transferring ownership in RoR/Jamabandi',
        steps: [
          { step: 1, name: 'Application Submission', actor: 'Citizen', action: 'Submit mutation application with supporting documents', next: 2 },
          { step: 2, name: 'Document Verification', actor: 'Revenue Officer', action: 'Verify sale deed/inheritance proof/court order', next_on_pass: 3, next_on_fail: 'REJECT' },
          { step: 3, name: 'Field Verification', actor: 'Revenue Officer', action: 'Physical verification of land and current possession', next: 4 },
          { step: 4, name: 'Objection Period', actor: 'System', action: '30-day notice period for objections', next_if_no_objection: 5, next_if_objection: 6 },
          { step: 5, name: 'Approval', actor: 'Revenue Officer', action: 'Approve mutation and update RoR', next: 7 },
          { step: 6, name: 'Dispute Resolution', actor: 'Revenue Court', action: 'Resolve objection/dispute', next: 5 },
          { step: 7, name: 'RoR Update', actor: 'System', action: 'Update Jamabandi with new owner, generate audit entry', next: 'COMPLETE' },
        ],
        sla_days: 45,
      },
      {
        workflow_id: 'WF-REGISTRATION',
        name: 'Property Registration Workflow',
        description: 'Process for registering a property transaction (sale/gift/lease)',
        steps: [
          { step: 1, name: 'Appointment Booking', actor: 'Citizen', action: 'Book slot at Sub-Registrar Office', next: 2 },
          { step: 2, name: 'Encumbrance Check', actor: 'System', action: 'Verify no active encumbrances/liens/disputes', next_if_clear: 3, next_if_blocked: 'HOLD' },
          { step: 3, name: 'Stamp Duty Payment', actor: 'Citizen', action: 'Pay stamp duty and registration fee', next: 4 },
          { step: 4, name: 'Document Execution', actor: 'Registration Officer', action: 'Execute deed with biometric/Aadhaar verification of parties', next: 5 },
          { step: 5, name: 'Registration', actor: 'Registration Officer', action: 'Register document and issue registration number', next: 6 },
          { step: 6, name: 'Mutation Trigger', actor: 'System', action: 'Auto-trigger mutation workflow for RoR update', next: 'COMPLETE' },
        ],
        sla_days: 7,
      },
      {
        workflow_id: 'WF-BUILDING-PERMIT',
        name: 'Building Permission Workflow',
        steps: [
          { step: 1, name: 'Application', actor: 'Citizen', action: 'Submit building plan with architect certificate' },
          { step: 2, name: 'Zoning Check', actor: 'System', action: 'Verify land-use compliance with master plan' },
          { step: 3, name: 'Setback/FAR Check', actor: 'Planning Officer', action: 'Verify building norms compliance' },
          { step: 4, name: 'NOC Collection', actor: 'System', action: 'Collect Fire/Environment/Airport NOCs if applicable' },
          { step: 5, name: 'Approval', actor: 'Planning Officer', action: 'Approve or reject with conditions' },
        ],
        sla_days: 30,
      },
    ],
    sample_instances: Array.from({length: 15}, (_, i) => {
      const wf = randomChoice(['WF-MUTATION','WF-REGISTRATION','WF-BUILDING-PERMIT']);
      const parcel = randomChoice(parcels);
      return {
        instance_id: `INST-${String(i+1).padStart(5,'0')}`,
        workflow_id: wf,
        ulpin: parcel.properties.ulpin,
        applicant: parcel.properties.raiyat_name,
        submitted_date: randomDate(2025, 2026),
        current_step: randomInt(1, wf === 'WF-MUTATION' ? 7 : 5),
        status: randomChoice(['In Progress','In Progress','Completed','Pending Review','On Hold']),
        assigned_to: randomChoice(['OFF-001','OFF-002','OFF-003']),
      };
    }),
  };
  writeJSON('data/project/workflows.json', workflows);
  console.log(`   ✅ ${workflows.workflow_definitions.length} workflow definitions, ${workflows.sample_instances.length} instances`);
})();

// ============================================================================
// 11. SATELLITE CHANGE DETECTION MOCK
// ============================================================================
(function() {
  console.log('🛰️  Satellite Change Detection Mock...');
  const detections = parcels.filter(() => Math.random() > 0.92).map((f, i) => {
    const p = f.properties;
    const changeType = randomChoice(['New Construction','Structure Expansion','Land Clearing','Water Body Change','Road Construction']);
    return {
      detection_id: `SAT-${String(i+1).padStart(5,'0')}`,
      ulpin: p.ulpin, khesra_no: p.khesra_no,
      detection_date: randomDate(2025, 2026),
      change_type: changeType,
      confidence: parseFloat(randomBetween(0.72, 0.98).toFixed(2)),
      source_imagery: { before: { date: randomDate(2024, 2025), source: 'Sentinel-2' }, after: { date: randomDate(2025, 2026), source: 'Sentinel-2' } },
      area_affected_sqm: randomInt(50, 2000),
      master_plan_zone: p.kisam,
      building_permission_status: randomChoice(['Approved','No Permission','No Permission','Not Checked']),
      alert_level: changeType === 'New Construction' && p.kisam === 'Agricultural' ? 'CRITICAL' :
                  changeType === 'New Construction' ? 'HIGH' : 'MEDIUM',
      auto_action: changeType === 'New Construction' && p.kisam === 'Agricultural' ? 'Flag for Planning Officer — potential agricultural land conversion' :
                  changeType === 'New Construction' ? 'Cross-reference with building permission database' :
                  'Log for monitoring',
      verified: Math.random() > 0.7,
    };
  });
  writeJSON('data/project/satellite_change_detection.json', {
    metadata: { description: 'Satellite-based Change Detection Results (Mock)', purpose: 'Demonstrates AI/ML feature — comparison of temporal satellite imagery to detect unauthorized changes', total_detections: detections.length, date_created: new Date().toISOString() },
    detections,
  });
  console.log(`   ✅ ${detections.length} satellite change detections`);
})();

// ============================================================================
// 12. API SPECIFICATION
// ============================================================================
(function() {
  console.log('📄  API Specification...');
  const apiSpec = {
    openapi: '3.0.0',
    info: { title: 'LandStack API', version: '1.0.0', description: 'Integrated GIS-based Digital Public Infrastructure for Land Governance', contact: { name: 'SIH 2026 Team', email: 'team@landstack.dev' } },
    servers: [{ url: 'http://localhost:3000/api/v1', description: 'Development' }],
    paths: {
      '/parcels': { get: { summary: 'Search parcels', parameters: [
        { name: 'ulpin', in: 'query', schema: { type: 'string' } },
        { name: 'survey_number', in: 'query', schema: { type: 'string' } },
        { name: 'owner', in: 'query', schema: { type: 'string' } },
        { name: 'district', in: 'query', schema: { type: 'string' } },
        { name: 'village', in: 'query', schema: { type: 'string' } },
        { name: 'land_type', in: 'query', schema: { type: 'string' } },
        { name: 'bbox', in: 'query', schema: { type: 'string' }, description: 'Bounding box: minLng,minLat,maxLng,maxLat' },
      ]}},
      '/parcels/{ulpin}': { get: { summary: 'Get parcel by ULPIN' } },
      '/parcels/{ulpin}/land360': { get: { summary: 'Get complete Land 360° profile' } },
      '/parcels/{ulpin}/ownership': { get: { summary: 'Get ownership / RoR details' } },
      '/parcels/{ulpin}/registration': { get: { summary: 'Get registration / transaction history' } },
      '/parcels/{ulpin}/encumbrances': { get: { summary: 'Get encumbrance / mortgage records' } },
      '/parcels/{ulpin}/building-permissions': { get: { summary: 'Get building permission records' } },
      '/parcels/{ulpin}/tax': { get: { summary: 'Get property tax records' } },
      '/parcels/{ulpin}/land-use': { get: { summary: 'Get land-use / zoning information' } },
      '/parcels/{ulpin}/utilities': { get: { summary: 'Get utility connection details' } },
      '/parcels/{ulpin}/disputes': { get: { summary: 'Get dispute / court records' } },
      '/parcels/{ulpin}/restrictions': { get: { summary: 'Get environmental / restriction zones affecting parcel' } },
      '/parcels/{ulpin}/audit': { get: { summary: 'Get audit trail for parcel', security: [{ bearerAuth: [] }] } },
      '/parcels/{ulpin}/conflicts': { get: { summary: 'Get AI-detected data conflicts for parcel' } },
      '/parcels/geojson': { get: { summary: 'Get parcels as GeoJSON FeatureCollection', parameters: [{ name: 'bbox', in: 'query', schema: { type: 'string' } }] } },
      '/analytics/dashboard': { get: { summary: 'Get analytics dashboard data', security: [{ bearerAuth: [] }] } },
      '/analytics/conflicts': { get: { summary: 'Get all data conflicts summary' } },
      '/analytics/land-use': { get: { summary: 'Get land-use distribution statistics' } },
      '/workflows': { get: { summary: 'List workflow instances' }, post: { summary: 'Create new workflow instance' } },
      '/workflows/{id}': { get: { summary: 'Get workflow status' }, patch: { summary: 'Update workflow step' } },
      '/adapters': { get: { summary: 'List available state adapters' } },
      '/adapters/{state}/transform': { post: { summary: 'Transform state-specific data to canonical schema' } },
      '/auth/login': { post: { summary: 'Login with credentials' } },
      '/auth/verify': { get: { summary: 'Verify JWT token' } },
      '/satellite/detections': { get: { summary: 'Get satellite change detections' } },
    },
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    },
  };
  writeJSON('data/project/api_specification.json', apiSpec);
  console.log('   ✅ API specification (OpenAPI 3.0)');
})();

// ============================================================================
// 13. POSTGIS SEED SQL
// ============================================================================
(function() {
  console.log('🗄️  PostGIS Seed SQL...');
  const sql = `-- ============================================================
-- LandStack — PostGIS Database Schema
-- SIH 2026 | PS #26014
-- Run: psql -d landstack -f seed.sql
-- ============================================================

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- SCHEMAS
-- ============================================================
CREATE SCHEMA IF NOT EXISTS spatial;
CREATE SCHEMA IF NOT EXISTS land;
CREATE SCHEMA IF NOT EXISTS planning;
CREATE SCHEMA IF NOT EXISTS fiscal;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS audit;

-- ============================================================
-- SPATIAL TABLES
-- ============================================================

-- Cadastral Parcels (Core table — everything links here)
CREATE TABLE spatial.parcels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ulpin VARCHAR(30) UNIQUE NOT NULL,
    survey_number VARCHAR(50),
    account_number VARCHAR(50),
    owner_name VARCHAR(255) NOT NULL,
    father_husband_name VARCHAR(255),
    owner_type VARCHAR(50) DEFAULT 'Individual',
    area_sq_meters NUMERIC(12,2),
    area_hectares NUMERIC(10,4),
    area_local_unit NUMERIC(10,2),
    local_unit_name VARCHAR(20),
    land_type VARCHAR(50),
    village VARCHAR(100),
    sub_district VARCHAR(100),
    district VARCHAR(100),
    state VARCHAR(50) NOT NULL,
    state_code VARCHAR(5),
    verification_status VARCHAR(30) DEFAULT 'Pending',
    geom GEOMETRY(Polygon, 4326) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_parcels_ulpin ON spatial.parcels(ulpin);
CREATE INDEX idx_parcels_geom ON spatial.parcels USING GIST(geom);
CREATE INDEX idx_parcels_state ON spatial.parcels(state);
CREATE INDEX idx_parcels_district ON spatial.parcels(district);
CREATE INDEX idx_parcels_village ON spatial.parcels(village);
CREATE INDEX idx_parcels_owner ON spatial.parcels(owner_name);

-- Administrative Boundaries
CREATE TABLE spatial.admin_boundaries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    level VARCHAR(50), -- state, district, subdistrict, village
    state VARCHAR(50),
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_admin_geom ON spatial.admin_boundaries USING GIST(geom);

-- Roads
CREATE TABLE spatial.roads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    road_type VARCHAR(50),
    surface VARCHAR(50),
    lanes INTEGER,
    width_m NUMERIC(5,1),
    geom GEOMETRY(LineString, 4326)
);
CREATE INDEX idx_roads_geom ON spatial.roads USING GIST(geom);

-- Water Bodies
CREATE TABLE spatial.water_bodies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    type VARCHAR(50),
    status VARCHAR(50),
    geom GEOMETRY(Geometry, 4326)
);
CREATE INDEX idx_water_geom ON spatial.water_bodies USING GIST(geom);

-- Zoning
CREATE TABLE spatial.zones (
    id SERIAL PRIMARY KEY,
    zone_name VARCHAR(255),
    zone_code VARCHAR(10),
    zone_type VARCHAR(50),
    max_far NUMERIC(4,2),
    max_height_m NUMERIC(5,1),
    geom GEOMETRY(Polygon, 4326)
);
CREATE INDEX idx_zones_geom ON spatial.zones USING GIST(geom);

-- Environmental Restriction Zones
CREATE TABLE spatial.restriction_zones (
    id SERIAL PRIMARY KEY,
    zone_name VARCHAR(255),
    zone_type VARCHAR(100),
    severity VARCHAR(20),
    restrictions TEXT[],
    authority VARCHAR(255),
    geom GEOMETRY(Polygon, 4326)
);
CREATE INDEX idx_restrict_geom ON spatial.restriction_zones USING GIST(geom);

-- ============================================================
-- LAND GOVERNANCE TABLES
-- ============================================================

-- Record of Rights (RoR)
CREATE TABLE land.ror (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ror_id VARCHAR(50) UNIQUE,
    parcel_id UUID REFERENCES spatial.parcels(id),
    ulpin VARCHAR(30) NOT NULL,
    owner_name VARCHAR(255),
    owner_type VARCHAR(50),
    land_classification VARCHAR(100),
    area_sq_meters NUMERIC(12,2),
    revenue_amount NUMERIC(10,2),
    revenue_status VARCHAR(30),
    entry_date DATE,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_ror_ulpin ON land.ror(ulpin);

-- Mutations
CREATE TABLE land.mutations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mutation_id VARCHAR(50) UNIQUE,
    parcel_id UUID REFERENCES spatial.parcels(id),
    ulpin VARCHAR(30),
    mutation_type VARCHAR(50),
    previous_owner VARCHAR(255),
    new_owner VARCHAR(255),
    mutation_date DATE,
    order_number VARCHAR(100),
    status VARCHAR(30) DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registration
CREATE TABLE land.registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_id VARCHAR(50) UNIQUE,
    parcel_id UUID REFERENCES spatial.parcels(id),
    ulpin VARCHAR(30),
    transaction_type VARCHAR(100),
    seller VARCHAR(255),
    buyer VARCHAR(255),
    consideration_amount NUMERIC(15,2),
    stamp_duty NUMERIC(12,2),
    registration_fee NUMERIC(10,2),
    registration_date DATE,
    document_number VARCHAR(100),
    status VARCHAR(30) DEFAULT 'Pending'
);
CREATE INDEX idx_reg_ulpin ON land.registrations(ulpin);

-- Encumbrances
CREATE TABLE land.encumbrances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encumbrance_id VARCHAR(50) UNIQUE,
    parcel_id UUID REFERENCES spatial.parcels(id),
    ulpin VARCHAR(30),
    encumbrance_type VARCHAR(50),
    institution VARCHAR(255),
    amount NUMERIC(15,2),
    outstanding NUMERIC(15,2),
    interest_rate NUMERIC(5,2),
    start_date DATE,
    end_date DATE,
    status VARCHAR(30) DEFAULT 'Active'
);
CREATE INDEX idx_enc_ulpin ON land.encumbrances(ulpin);

-- ============================================================
-- PLANNING TABLES
-- ============================================================

CREATE TABLE planning.building_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permission_id VARCHAR(50) UNIQUE,
    parcel_id UUID REFERENCES spatial.parcels(id),
    ulpin VARCHAR(30),
    applicant VARCHAR(255),
    building_type VARCHAR(100),
    proposed_floors INTEGER,
    built_up_area NUMERIC(10,2),
    status VARCHAR(30),
    application_date DATE,
    approval_date DATE
);

CREATE TABLE planning.land_use (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID REFERENCES spatial.parcels(id),
    ulpin VARCHAR(30),
    master_plan_zone VARCHAR(50),
    actual_use VARCHAR(100),
    is_violation BOOLEAN DEFAULT FALSE,
    violation_detail TEXT
);

-- ============================================================
-- FISCAL TABLES
-- ============================================================

CREATE TABLE fiscal.property_tax (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tax_id VARCHAR(50) UNIQUE,
    parcel_id UUID REFERENCES spatial.parcels(id),
    ulpin VARCHAR(30),
    assessment_year VARCHAR(10),
    owner_name VARCHAR(255),
    annual_value NUMERIC(12,2),
    tax_amount NUMERIC(10,2),
    payment_status VARCHAR(30),
    arrears NUMERIC(10,2) DEFAULT 0
);
CREATE INDEX idx_tax_ulpin ON fiscal.property_tax(ulpin);

CREATE TABLE fiscal.circle_rates (
    id SERIAL PRIMARY KEY,
    zone_name VARCHAR(255),
    land_type VARCHAR(50),
    rate_per_unit NUMERIC(12,2),
    unit VARCHAR(30),
    effective_date DATE,
    valid_till DATE
);

-- ============================================================
-- DISPUTES
-- ============================================================

CREATE TABLE land.disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id VARCHAR(50) UNIQUE,
    parcel_id UUID REFERENCES spatial.parcels(id),
    ulpin VARCHAR(30),
    dispute_type VARCHAR(100),
    case_number VARCHAR(100),
    court VARCHAR(255),
    petitioner VARCHAR(255),
    respondent VARCHAR(255),
    filing_date DATE,
    status VARCHAR(30),
    stay_order BOOLEAN DEFAULT FALSE
);

-- ============================================================
-- AUTH & AUDIT
-- ============================================================

CREATE TABLE auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(30) UNIQUE,
    name VARCHAR(255),
    email VARCHAR(255),
    role VARCHAR(50),
    department VARCHAR(100),
    state VARCHAR(50),
    password_hash VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit.events (
    id BIGSERIAL PRIMARY KEY,
    audit_id VARCHAR(50),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_id VARCHAR(30),
    user_role VARCHAR(50),
    action VARCHAR(100),
    resource_type VARCHAR(50),
    resource_id VARCHAR(50),
    details JSONB,
    ip_address INET,
    status VARCHAR(20) DEFAULT 'SUCCESS'
);
CREATE INDEX idx_audit_resource ON audit.events(resource_id);
CREATE INDEX idx_audit_user ON audit.events(user_id);
CREATE INDEX idx_audit_time ON audit.events(timestamp);

-- ============================================================
-- AI / CONFLICT DETECTION
-- ============================================================

CREATE TABLE land.data_conflicts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ulpin VARCHAR(30),
    conflict_type VARCHAR(50),
    severity VARCHAR(20),
    source_a VARCHAR(50),
    value_a TEXT,
    source_b VARCHAR(50),
    value_b TEXT,
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by VARCHAR(30),
    resolved_at TIMESTAMPTZ
);
CREATE INDEX idx_conflicts_ulpin ON land.data_conflicts(ulpin);

-- ============================================================
-- SATELLITE CHANGE DETECTION
-- ============================================================

CREATE TABLE land.satellite_detections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ulpin VARCHAR(30),
    detection_date DATE,
    change_type VARCHAR(100),
    confidence NUMERIC(4,2),
    area_affected_sqm NUMERIC(10,2),
    alert_level VARCHAR(20),
    verified BOOLEAN DEFAULT FALSE,
    before_date DATE,
    after_date DATE,
    source VARCHAR(50)
);

-- ============================================================
-- VIEWS
-- ============================================================

-- Land 360° View
CREATE OR REPLACE VIEW land.land_360 AS
SELECT
    p.ulpin,
    p.survey_number,
    p.owner_name,
    p.area_sq_meters,
    p.land_type,
    p.village,
    p.district,
    p.state,
    p.verification_status,
    r.revenue_amount,
    r.revenue_status,
    (SELECT COUNT(*) FROM land.registrations reg WHERE reg.ulpin = p.ulpin) AS total_transactions,
    (SELECT COUNT(*) FROM land.encumbrances e WHERE e.ulpin = p.ulpin AND e.status = 'Active') AS active_encumbrances,
    (SELECT COUNT(*) FROM planning.building_permissions bp WHERE bp.ulpin = p.ulpin) AS building_permits,
    (SELECT COALESCE(SUM(t.arrears), 0) FROM fiscal.property_tax t WHERE t.ulpin = p.ulpin) AS total_tax_arrears,
    (SELECT COUNT(*) FROM land.disputes d WHERE d.ulpin = p.ulpin AND d.status != 'Disposed') AS active_disputes,
    (SELECT COUNT(*) FROM land.data_conflicts c WHERE c.ulpin = p.ulpin AND c.resolved = FALSE) AS unresolved_conflicts,
    p.geom
FROM spatial.parcels p
LEFT JOIN land.ror r ON r.ulpin = p.ulpin;

-- Analytics Summary View
CREATE OR REPLACE VIEW land.analytics_summary AS
SELECT
    state,
    district,
    COUNT(*) AS total_parcels,
    SUM(CASE WHEN land_type = 'Agricultural' THEN 1 ELSE 0 END) AS agricultural,
    SUM(CASE WHEN land_type = 'Residential' THEN 1 ELSE 0 END) AS residential,
    SUM(CASE WHEN land_type = 'Commercial' THEN 1 ELSE 0 END) AS commercial,
    SUM(area_hectares) AS total_area_hectares,
    SUM(CASE WHEN verification_status = 'Verified' THEN 1 ELSE 0 END) AS verified_count
FROM spatial.parcels
GROUP BY state, district;

-- Done
SELECT 'LandStack schema created successfully!' AS status;
`;

  writeText('data/project/seed.sql', sql);
  console.log('   ✅ PostGIS seed SQL (17 tables, 2 views, indexes)');
})();

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║  ✅ ALL MISSING DATA GENERATED!                            ║');
console.log('╠══════════════════════════════════════════════════════════════╣');
console.log('║  Bihar:                                                     ║');
console.log('║    • Building permissions                                   ║');
console.log('║    • Circle rates / valuation                               ║');
console.log('║    • Zoning / master plan (GeoJSON)                         ║');
console.log('║    • Environmental zones (GeoJSON)                          ║');
console.log('║    • Dispute records                                        ║');
console.log('║    • Roads, water, utilities (GeoJSON)                      ║');
console.log('║    • Per-parcel utility connections                         ║');
console.log('║  Tamil Nadu:                                                ║');
console.log('║    • 30 sample parcels + Chitta (for adapter demo)          ║');
console.log('║  Project-wide:                                              ║');
console.log('║    • Audit trail (200 events)                               ║');
console.log('║    • RBAC config (6 roles, 7 users)                         ║');
console.log('║    • Workflows (3 definitions, 15 instances)                ║');
console.log('║    • Satellite change detection (mock)                      ║');
console.log('║    • API specification (OpenAPI 3.0)                        ║');
console.log('║    • PostGIS seed SQL (17 tables, 2 views)                  ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
