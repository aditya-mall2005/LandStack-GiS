/**
 * Land Stack - Bihar Data Generator (Primary Pilot)
 * SIH 2026 | PS #26014
 *
 * Pilot: Bihar → Madhubani → Jaynagar → Basopatti → Arghawa (33)
 * Survey: RS Revisional Survey → 07 RS Map → Sheet 01
 *
 * Key differences from Chandigarh generator:
 * 1. Uses Bihar terminology (khesra, rakba, jamabandi, raiyat, halka, anchal, mauza)
 * 2. Rural + semi-urban parcels (agricultural heavy)
 * 3. INTENTIONAL DATA CONFLICTS for AI/rule-engine demo
 * 4. Generates data in Bihar's "native" format, to be normalized by State Adapter
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  state: 'Bihar',
  stateCode: 'BR',
  district: 'Madhubani',
  districtCode: '10',
  subDivision: 'Jaynagar',
  circle: 'Basopatti',
  mauza: 'Arghawa',
  mauzaCode: '33',
  surveyType: 'RS', // Revisional Survey
  mapInstance: '07 RS Map',
  sheet: '01',
  // Arghawa village approximate center
  centerLat: 26.36,
  centerLng: 86.12,
  totalParcels: 300,
  // Percentage of parcels with intentional conflicts
  conflictRate: 0.12, // 12% have data conflicts
};

// ============================================================================
// UTILITIES
// ============================================================================

function randomBetween(min, max) { return Math.random() * (max - min) + min; }
function randomInt(min, max) { return Math.floor(randomBetween(min, max + 1)); }
function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomDate(startYear, endYear) {
  const d = new Date(startYear, 0, 1);
  d.setTime(d.getTime() + Math.random() * (new Date(endYear, 11, 31).getTime() - d.getTime()));
  return d.toISOString().split('T')[0];
}

function generateULPIN(index) {
  const parcelNum = String(index).padStart(8, '0');
  const check = crypto.randomBytes(1).toString('hex').substring(0, 2).toUpperCase();
  return `IN-${CONFIG.stateCode}-${CONFIG.districtCode}-${parcelNum}-${check}`;
}

function generateParcelPolygon(lat, lng, areaHectares) {
  const sizeM = Math.sqrt(areaHectares * 10000);
  const latOff = (sizeM / 111320) * randomBetween(0.8, 1.2);
  const lngOff = (sizeM / (111320 * Math.cos(lat * Math.PI / 180))) * randomBetween(0.8, 1.2);
  const j = () => randomBetween(-0.12, 0.12);
  const coords = [
    [lng - lngOff/2 + lngOff*j(), lat - latOff/2 + latOff*j()],
    [lng + lngOff/2 + lngOff*j(), lat - latOff/2 + latOff*j()],
    [lng + lngOff/2 + lngOff*j(), lat + latOff/2 + latOff*j()],
    [lng - lngOff/2 + lngOff*j(), lat + latOff/2 + latOff*j()],
  ];
  coords.push([...coords[0]]);
  return [coords];
}

// Bihar-appropriate names
const BIHAR_FIRST = [
  'Ramesh', 'Suresh', 'Rajesh', 'Dinesh', 'Mukesh', 'Rakesh', 'Anil', 'Sanjay',
  'Vijay', 'Ajay', 'Manoj', 'Ravi', 'Deepak', 'Vinod', 'Pramod', 'Santosh',
  'Umesh', 'Kamlesh', 'Brajesh', 'Nagendra', 'Upendra', 'Dhirendra', 'Jitendra',
  'Sunita', 'Anita', 'Geeta', 'Seeta', 'Savitri', 'Kiran', 'Meena', 'Rekha',
  'Ram', 'Shyam', 'Mohan', 'Sohan', 'Laxman', 'Gopal', 'Krishna', 'Arvind',
  'Birendra', 'Mahendra', 'Devendra', 'Yogendra', 'Surendra', 'Rajendra',
  'Prabhu', 'Jagdish', 'Satish', 'Harish', 'Girish', 'Ashok', 'Amit', 'Sumit',
];
const BIHAR_LAST = [
  'Kumar', 'Prasad', 'Singh', 'Yadav', 'Thakur', 'Mishra', 'Jha', 'Sharma',
  'Pandey', 'Tiwari', 'Dubey', 'Chaudhary', 'Mandal', 'Sah', 'Gupta',
  'Verma', 'Das', 'Roy', 'Mahato', 'Ram', 'Paswan', 'Rajak', 'Sahni',
  'Keshri', 'Choudhary', 'Raut', 'Patel', 'Mehta', 'Sinha', 'Lal',
];

function randomName() { return `${randomChoice(BIHAR_FIRST)} ${randomChoice(BIHAR_LAST)}`; }
function randomFatherName() { return `${randomChoice(BIHAR_FIRST)} ${randomChoice(BIHAR_LAST)}`; }

// Slightly modify a name (for data conflict generation)
function corruptName(name) {
  const strategies = [
    n => n.replace(/Kumar$/, 'Kr.'),
    n => n.replace(/Singh$/, 'Sigh'),
    n => n.split(' ')[0] + ' ' + randomChoice(BIHAR_LAST),
    n => n.replace(/Prasad$/, 'Prsad'),
    n => 'Smt. ' + n,
    n => n.replace(/sh$/, 'sh '),
    n => n.toUpperCase(),
    n => n.split(' ').reverse().join(' '),
  ];
  return randomChoice(strategies)(name);
}

function writeJSON(relPath, data) {
  const fullPath = path.join(__dirname, '..', relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf8');
}

// ============================================================================
// BASE LAYER: BIHAR CADASTRAL PARCELS
// ============================================================================

function generateBiharParcels() {
  console.log('📍 Generating Bihar Base Layer: Cadastral Parcels...');

  const parcels = [];
  const conflicts = []; // Track intentional conflicts

  // Bihar land types (rural/semi-urban)
  const landTypes = ['Agricultural', 'Residential', 'Commercial', 'Gair Mazarua (Govt)', 'Orchard', 'Wasteland', 'Pond/Water Body'];
  const landTypeWeights = [0.50, 0.20, 0.05, 0.08, 0.07, 0.05, 0.05];

  function weightedLandType() {
    const r = Math.random();
    let c = 0;
    for (let i = 0; i < landTypes.length; i++) { c += landTypeWeights[i]; if (r <= c) return landTypes[i]; }
    return landTypes[0];
  }

  // Spread parcels across the village area
  const halkas = [
    { name: 'Halka 1 (North)', latOff: 0.008, lngOff: -0.003, parcels: 80 },
    { name: 'Halka 2 (Central)', latOff: 0.000, lngOff: 0.000, parcels: 100 },
    { name: 'Halka 3 (South)', latOff: -0.008, lngOff: 0.004, parcels: 70 },
    { name: 'Urban Ward (Market)', latOff: 0.002, lngOff: -0.006, parcels: 50 },
  ];

  let idx = 1;

  for (const halka of halkas) {
    for (let i = 0; i < halka.parcels; i++) {
      const ulpin = generateULPIN(idx);
      const khesraNo = `${randomInt(1, 2000)}`;
      const thanaNo = String(randomInt(1, 50));
      const khataNo = String(randomInt(1, 300));

      const landType = halka.name.includes('Market')
        ? randomChoice(['Commercial', 'Residential', 'Residential', 'Mixed Use'])
        : weightedLandType();

      const areaDecimal = landType === 'Agricultural' ? randomBetween(0.1, 3.0) :
                          landType === 'Commercial' ? randomBetween(0.01, 0.2) :
                          landType === 'Residential' ? randomBetween(0.02, 0.3) :
                          randomBetween(0.05, 1.0);

      const areaHectare = parseFloat((areaDecimal * 0.404686).toFixed(4));
      const areaSqm = Math.round(areaDecimal * 4046.86);
      // Bihar uses Decimal (1 acre = 100 decimal)
      const areaInDecimal = parseFloat((areaDecimal * 100).toFixed(2));

      const lat = CONFIG.centerLat + halka.latOff + randomBetween(-0.004, 0.004);
      const lng = CONFIG.centerLng + halka.lngOff + randomBetween(-0.004, 0.004);
      const polygon = generateParcelPolygon(lat, lng, areaHectare);

      const ownerName = randomName();
      const isConflict = Math.random() < CONFIG.conflictRate;

      const feature = {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: polygon },
        properties: {
          ulpin: ulpin,
          // Bihar-specific terminology
          khesra_no: khesraNo,
          thana_no: thanaNo,
          khata_no: khataNo,
          plot_id: `PLOT-${String(idx).padStart(4, '0')}`,

          // Owner (Bihar uses "raiyat")
          raiyat_name: ownerName,
          father_husband_name: randomFatherName(),
          raiyat_type: randomChoice(['Raiyat', 'Raiyat', 'Raiyat', 'Govt', 'Trust']),

          // Area (Bihar uses "rakba" in decimal/acre)
          rakba_decimal: areaInDecimal,
          rakba_acre: parseFloat(areaDecimal.toFixed(4)),
          rakba_hectare: areaHectare,
          rakba_sqm: areaSqm,

          // Land classification
          kisam: landType, // "kisam" = land type in Bihar
          irrigation: landType === 'Agricultural' ? randomChoice(['Nalkoop', 'Canal', 'Rain-fed', 'Tubewell', 'None']) : 'N/A',
          crop: landType === 'Agricultural' ? randomChoice(['Dhan (Rice)', 'Gehu (Wheat)', 'Makai (Corn)', 'Sarson (Mustard)', 'Alu (Potato)', 'Dal']) : 'N/A',
          soil: randomChoice(['Alluvial', 'Sandy Loam', 'Clay', 'Silt']),

          // Location
          mauza: CONFIG.mauza,
          mauza_code: CONFIG.mauzaCode,
          halka: halka.name,
          anchal: CONFIG.circle,
          sub_division: CONFIG.subDivision,
          district: CONFIG.district,
          state: CONFIG.state,

          // Survey
          survey_type: CONFIG.surveyType,
          map_instance: CONFIG.mapInstance,
          sheet_no: CONFIG.sheet,

          // Status
          verification_status: randomChoice(['Verified', 'Verified', 'Verified', 'Pending', 'Under Survey']),
          digitization_date: randomDate(2019, 2025),
          last_jamabandi_date: randomDate(2020, 2026),

          // Flags
          has_data_conflict: isConflict,
          centroid_lat: parseFloat(lat.toFixed(6)),
          centroid_lng: parseFloat(lng.toFixed(6)),
        },
      };

      if (isConflict) {
        conflicts.push({
          ulpin, khesra_no: khesraNo, original_owner: ownerName,
          corrupt_owner: corruptName(ownerName),
          conflict_type: randomChoice([
            'owner_name_mismatch',
            'land_use_violation',
            'encumbrance_sale_conflict',
            'area_discrepancy',
          ]),
        });
      }

      parcels.push(feature);
      idx++;
    }
  }

  const geojson = {
    type: 'FeatureCollection',
    name: 'Bihar_Arghawa_Cadastral_Parcels',
    crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
    metadata: {
      description: 'Mock cadastral parcels for Arghawa village, Madhubani, Bihar',
      source: 'Generated for SIH 2026 Land Stack Prototype',
      disclaimer: 'DEMO DATA — does not represent actual ownership or government records',
      date_created: new Date().toISOString(),
      total_parcels: parcels.length,
      pilot_area: `${CONFIG.mauza} (${CONFIG.mauzaCode}), ${CONFIG.circle}, ${CONFIG.subDivision}, ${CONFIG.district}, ${CONFIG.state}`,
      coordinate_system: 'WGS 84 (EPSG:4326)',
      bihar_terminology: {
        khesra: 'Plot/Survey number',
        khata: 'Account/Holding number',
        thana: 'Thana/Revenue circle number',
        raiyat: 'Land holder/owner',
        rakba: 'Area (measured in decimal/acre)',
        kisam: 'Land type/classification',
        jamabandi: 'Record of Rights register',
        mauza: 'Revenue village',
        halka: 'Revenue sub-unit within village',
        anchal: 'Revenue circle (Block level)',
      },
    },
    features: parcels,
  };

  writeJSON('data/bihar/base_layer/cadastral_parcels.geojson', geojson);

  // ULPIN index
  writeJSON('data/bihar/base_layer/ulpin_index.json', {
    metadata: {
      description: 'ULPIN Index — Bihar Arghawa Parcels',
      format: 'IN-XX-XX-XXXXXXXX-XX (Country-State-District-Parcel-Check)',
      total_records: parcels.length,
      date_created: new Date().toISOString(),
    },
    records: parcels.map(f => ({
      ulpin: f.properties.ulpin,
      plot_id: f.properties.plot_id,
      khesra_no: f.properties.khesra_no,
      khata_no: f.properties.khata_no,
      raiyat_name: f.properties.raiyat_name,
      halka: f.properties.halka,
      kisam: f.properties.kisam,
      rakba_decimal: f.properties.rakba_decimal,
    })),
  });

  // Conflicts registry (for AI/rule engine demo)
  writeJSON('data/bihar/base_layer/data_conflicts_registry.json', {
    metadata: {
      description: 'Intentional Data Conflicts for AI/Rule-Engine Demo',
      purpose: 'Demonstrates why LandStack integration is needed — cross-departmental data inconsistencies',
      total_conflicts: conflicts.length,
      conflict_rate: `${(CONFIG.conflictRate * 100).toFixed(0)}%`,
      date_created: new Date().toISOString(),
    },
    conflicts: conflicts,
  });

  console.log(`   ✅ Generated ${parcels.length} cadastral parcels (Bihar/Arghawa)`);
  console.log(`   ✅ Generated ${conflicts.length} intentional data conflicts`);

  return { parcels, conflicts };
}

// ============================================================================
// ESSENTIAL LAYER: BIHAR JAMABANDI (RoR)
// ============================================================================

function generateJamabandi(parcels, conflicts) {
  console.log('📋 Generating Bihar Essential Layer: Jamabandi (RoR)...');

  const conflictMap = {};
  conflicts.forEach(c => { conflictMap[c.ulpin] = c; });

  const records = parcels.map((feature, idx) => {
    const p = feature.properties;
    const conflict = conflictMap[p.ulpin];

    const mutationHistory = [];
    const numMutations = randomInt(0, 5);
    for (let m = 0; m < numMutations; m++) {
      mutationHistory.push({
        mutation_id: `MUT-BR-${String(idx + 1).padStart(4, '0')}-${m + 1}`,
        mutation_type: randomChoice(['Varasat (Inheritance)', 'Bikri (Sale)', 'Vibhajan (Partition)', 'Dan (Gift)', 'Court Order']),
        mutation_date: randomDate(2010, 2026),
        previous_raiyat: randomName(),
        new_raiyat: m === numMutations - 1 ? p.raiyat_name : randomName(),
        order_no: `CO-${randomInt(100, 9999)}/${randomDate(2010, 2026).substring(0, 4)}`,
        status: 'Approved',
      });
    }

    return {
      jamabandi_id: `JAM-${CONFIG.stateCode}-${String(idx + 1).padStart(5, '0')}`,
      ulpin: p.ulpin,
      khesra_no: p.khesra_no,
      khata_no: p.khata_no,
      thana_no: p.thana_no,

      // Raiyat details — WITH POSSIBLE CONFLICT
      raiyat_name: p.raiyat_name, // Original correct name
      pita_pati_name: p.father_husband_name,
      raiyat_type: p.raiyat_type,
      co_raiyats: p.raiyat_type === 'Trust' ? [randomName()] : [],

      // Land details (Bihar terms)
      kisam: p.kisam,
      bhumi_vargikaran: randomChoice(['Irrigated', 'Un-irrigated', 'Barren', 'Built-up', 'Orchard', 'Jalmagn (Waterlogged)']),
      sinchai: p.irrigation,
      fasal: p.crop,

      // Area in Bihar units
      rakba_decimal: p.rakba_decimal,
      rakba_acre: p.rakba_acre,
      rakba_hectare: p.rakba_hectare,

      // Revenue
      lagaan: randomInt(50, 2000), // Annual land revenue in INR
      lagaan_status: randomChoice(['Paid', 'Paid', 'Paid', 'Arrears', 'Partial']),
      lagaan_paid_till: randomChoice(['2025-26', '2024-25', '2023-24']),

      // Rights
      adhikar: {
        ownership: true,
        cultivation: p.kisam === 'Agricultural',
        transfer: p.raiyat_type !== 'Govt',
        mortgage: p.raiyat_type !== 'Govt',
        building: ['Residential', 'Commercial', 'Mixed Use'].includes(p.kisam),
      },
      pratibandh: p.kisam === 'Gair Mazarua (Govt)' ? ['Cannot be sold', 'Govt property']
        : p.kisam === 'Agricultural' ? ['Conversion requires permission']
        : [],

      // Dates
      jamabandi_date: p.last_jamabandi_date,
      entry_date: randomDate(2010, 2020),
      last_updated: randomDate(2024, 2026),

      // Mutation history
      mutation_history: mutationHistory,

      // Location
      mauza: p.mauza,
      halka: p.halka,
      anchal: p.anchal,
      district: p.district,

      // Document references
      document_refs: [`DEED-${randomInt(10000, 99999)}`, Math.random() > 0.5 ? `MAP-${randomInt(1000, 9999)}` : null].filter(Boolean),

      // Conflict flag (for AI demo)
      _has_conflict: !!conflict,
    };
  });

  writeJSON('data/bihar/essential_layer/jamabandi_ror.json', {
    metadata: {
      description: 'Jamabandi (Record of Rights) — Bihar Arghawa Village',
      local_name: 'Jamabandi Register',
      disclaimer: 'DEMO DATA — does not represent actual ownership',
      total_records: records.length,
      date_created: new Date().toISOString(),
    },
    records,
  });

  console.log(`   ✅ Generated ${records.length} Jamabandi records`);
  return records;
}

// ============================================================================
// ESSENTIAL LAYER: REGISTRATION (with conflicts)
// ============================================================================

function generateRegistration(parcels, conflicts) {
  console.log('📝 Generating Bihar Essential Layer: Registration...');

  const conflictMap = {};
  conflicts.filter(c => ['owner_name_mismatch', 'encumbrance_sale_conflict'].includes(c.conflict_type))
    .forEach(c => { conflictMap[c.ulpin] = c; });

  const records = [];
  const selected = parcels.filter(() => Math.random() > 0.35);

  selected.forEach((feature) => {
    const p = feature.properties;
    const conflict = conflictMap[p.ulpin];
    const numTx = randomInt(1, 2);

    for (let t = 0; t < numTx; t++) {
      const txnType = randomChoice(['Bikri Patra (Sale Deed)', 'Dan Patra (Gift Deed)', 'Bhada Patra (Lease)', 'Rinpatra (Mortgage Deed)', 'Vibhajan (Partition)', 'Vasiyatnama (Will)']);

      // For conflict parcels: use the corrupted owner name
      const buyerName = conflict && conflict.conflict_type === 'owner_name_mismatch'
        ? conflict.corrupt_owner
        : p.raiyat_name;

      const value = p.kisam === 'Commercial' ? randomInt(2000000, 20000000) :
                   p.kisam === 'Residential' ? randomInt(500000, 5000000) :
                   randomInt(100000, 3000000);

      records.push({
        registration_id: `REG-BR-${String(records.length + 1).padStart(6, '0')}`,
        ulpin: p.ulpin,
        khesra_no: p.khesra_no,
        dastavej_no: `DOC-${randomInt(100000, 999999)}/${randomDate(2018, 2026).substring(0, 4)}`,

        prakar: txnType, // Transaction type
        vikreta: randomName(), // Seller
        kreta: buyerName, // Buyer — may differ from RoR owner!

        gavah_1: randomName(), // Witness 1
        gavah_2: randomName(), // Witness 2

        mulya: value, // Consideration value
        bazaar_mulya: Math.round(value * randomBetween(0.9, 1.3)),
        stamp_shulk: Math.round(value * 0.06),
        nibandhan_shulk: Math.min(Math.round(value * 0.02), 30000),

        nibandhan_tarikh: randomDate(2018, 2026),
        nishpadan_tarikh: randomDate(2018, 2026),

        upnibandhan_karyalaya: randomChoice([
          'Sub-Registrar Office, Jaynagar',
          'Sub-Registrar Office, Madhubani',
          'Sub-Registrar Office, Basopatti',
        ]),

        sthiti: randomChoice(['Registered', 'Registered', 'Registered', 'Pending Verification']),

        _has_owner_conflict: !!conflict && conflict.conflict_type === 'owner_name_mismatch',
        _conflict_detail: conflict ? `RoR says "${p.raiyat_name}", Registration says "${buyerName}"` : null,
      });
    }
  });

  writeJSON('data/bihar/essential_layer/registration_records.json', {
    metadata: {
      description: 'Property Registration Records — Bihar',
      disclaimer: 'DEMO DATA',
      total_records: records.length,
      owner_conflicts: records.filter(r => r._has_owner_conflict).length,
      date_created: new Date().toISOString(),
    },
    records,
  });

  const conflictCount = records.filter(r => r._has_owner_conflict).length;
  console.log(`   ✅ Generated ${records.length} registration records`);
  console.log(`   ⚠️  ${conflictCount} records have intentional owner-name conflicts`);
  return records;
}

// ============================================================================
// ESSENTIAL LAYER: ENCUMBRANCE (with mortgage-sale conflicts)
// ============================================================================

function generateEncumbrance(parcels, conflicts) {
  console.log('🔒 Generating Bihar Essential Layer: Encumbrance...');

  const saleConflicts = {};
  conflicts.filter(c => c.conflict_type === 'encumbrance_sale_conflict')
    .forEach(c => { saleConflicts[c.ulpin] = c; });

  const encumbered = parcels.filter(() => Math.random() > 0.55);

  const banks = [
    'State Bank of India', 'Punjab National Bank', 'Central Bank of India',
    'Bank of India', 'Union Bank', 'Canara Bank', 'Bihar Gramin Bank',
    'UCO Bank', 'HDFC Bank', 'ICICI Bank', 'Axis Bank',
  ];

  const records = encumbered.map((feature, idx) => {
    const p = feature.properties;
    const isSaleConflict = !!saleConflicts[p.ulpin];
    const amount = p.kisam === 'Commercial' ? randomInt(500000, 20000000) :
                  p.kisam === 'Residential' ? randomInt(200000, 5000000) :
                  randomInt(50000, 2000000);

    return {
      encumbrance_id: `EC-BR-${String(idx + 1).padStart(5, '0')}`,
      ulpin: p.ulpin,
      khesra_no: p.khesra_no,

      prakar: randomChoice(['Rinabhar (Mortgage)', 'Rinabhar (Mortgage)', 'Rinabhar (Mortgage)', 'Dharanadhikar (Lien)', 'Kurki (Attachment)']),
      bhumi_swami: p.raiyat_name,
      rindaata: randomChoice(banks),

      rin_rashi: amount,
      bakaya_rashi: Math.round(amount * randomBetween(0.3, 0.95)),
      byaj_dar: parseFloat(randomBetween(7.0, 12.5).toFixed(2)),
      avadhi_varsh: randomInt(5, 25),

      praarambh_tarikh: randomDate(2015, 2025),
      paripakva_tarikh: randomDate(2027, 2050),

      sthiti: isSaleConflict ? 'Active' : randomChoice(['Active', 'Active', 'Active', 'Partially Discharged', 'Satisfied']),

      _has_sale_conflict: isSaleConflict,
      _conflict_detail: isSaleConflict ? 'Active mortgage exists but sale transaction is pending — requires encumbrance verification' : null,
    };
  });

  writeJSON('data/bihar/essential_layer/encumbrance_records.json', {
    metadata: {
      description: 'Encumbrance / Mortgage Records — Bihar',
      disclaimer: 'DEMO DATA',
      total_records: records.length,
      sale_conflicts: records.filter(r => r._has_sale_conflict).length,
      date_created: new Date().toISOString(),
    },
    records,
  });

  const saleConflictCount = records.filter(r => r._has_sale_conflict).length;
  console.log(`   ✅ Generated ${records.length} encumbrance records`);
  console.log(`   ⚠️  ${saleConflictCount} have active-mortgage + pending-sale conflicts`);
}

// ============================================================================
// ESSENTIAL LAYER: PROPERTY TAX (with name conflicts)
// ============================================================================

function generatePropertyTax(parcels, conflicts) {
  console.log('💰 Generating Bihar Use-Case Layer: Property Tax...');

  const conflictMap = {};
  conflicts.filter(c => c.conflict_type === 'owner_name_mismatch')
    .forEach(c => { conflictMap[c.ulpin] = c; });

  const taxable = parcels.filter(f => !['Gair Mazarua (Govt)', 'Pond/Water Body', 'Wasteland'].includes(f.properties.kisam));

  const records = [];
  taxable.forEach(feature => {
    const p = feature.properties;
    const conflict = conflictMap[p.ulpin];

    for (let year = 2024; year <= 2026; year++) {
      const assessmentYear = `${year}-${String(year + 1).substring(2)}`;
      const annualValue = p.kisam === 'Commercial' ? randomInt(50000, 500000) :
                         p.kisam === 'Residential' ? randomInt(10000, 100000) :
                         randomInt(5000, 50000);

      const taxRate = p.kisam === 'Commercial' ? 0.08 : p.kisam === 'Residential' ? 0.04 : 0.02;
      const taxAmount = Math.round(annualValue * taxRate);

      records.push({
        tax_id: `PTAX-BR-${assessmentYear}-${String(records.length + 1).padStart(6, '0')}`,
        ulpin: p.ulpin,
        khesra_no: p.khesra_no,
        assessment_year: assessmentYear,

        // Use corrupt name for conflict parcels in tax records
        sampatti_swami: conflict ? conflict.corrupt_owner : p.raiyat_name,

        sampatti_prakar: p.kisam,
        varshik_mulya: annualValue,
        kar_dar: parseFloat((taxRate * 100).toFixed(1)),
        sampatti_kar: taxAmount,
        shiksha_upkar: Math.round(taxAmount * 0.02),
        jal_kar: randomInt(200, 2000),
        kul_kar: taxAmount + Math.round(taxAmount * 0.02) + randomInt(200, 2000),

        bhugtan_sthiti: year < 2026 ? randomChoice(['Paid', 'Paid', 'Paid', 'Partial']) :
                       randomChoice(['Paid', 'Pending', 'Pending']),
        bakaya: Math.random() > 0.8 ? randomInt(500, 20000) : 0,

        nagar_nikay: 'Nagar Panchayat, Basopatti',
        ward: randomInt(1, 12),

        _has_owner_conflict: !!conflict,
        _conflict_detail: conflict ? `RoR says "${p.raiyat_name}", Tax record says "${conflict.corrupt_owner}"` : null,
      });
    }
  });

  writeJSON('data/bihar/usecase_layer/property_tax.json', {
    metadata: {
      description: 'Property Tax Records — Bihar',
      disclaimer: 'DEMO DATA',
      total_records: records.length,
      owner_conflicts: records.filter(r => r._has_owner_conflict).length,
      date_created: new Date().toISOString(),
    },
    records,
  });

  const taxConflicts = [...new Set(records.filter(r => r._has_owner_conflict).map(r => r.ulpin))].length;
  console.log(`   ✅ Generated ${records.length} property tax records`);
  console.log(`   ⚠️  ${taxConflicts} parcels have tax-vs-RoR owner name mismatches`);
}

// ============================================================================
// ESSENTIAL LAYER: LAND USE with violations
// ============================================================================

function generateLandUseViolations(parcels, conflicts) {
  console.log('🗂️ Generating Bihar Essential Layer: Land Use / Zoning...');

  const violationConflicts = {};
  conflicts.filter(c => c.conflict_type === 'land_use_violation')
    .forEach(c => { violationConflicts[c.ulpin] = c; });

  const records = parcels.map((feature, idx) => {
    const p = feature.properties;
    const isViolation = !!violationConflicts[p.ulpin];

    const masterPlanUse = p.kisam === 'Agricultural' ? 'Agricultural' :
                         p.kisam === 'Residential' ? 'Residential' :
                         p.kisam === 'Commercial' ? 'Commercial' :
                         p.kisam;

    // For violation parcels: actual use differs from master plan
    const actualUse = isViolation
      ? (masterPlanUse === 'Agricultural' ? 'Commercial (Brick Kiln)' :
         masterPlanUse === 'Residential' ? 'Commercial (Godown/Warehouse)' :
         'Industrial')
      : masterPlanUse;

    return {
      land_use_id: `LU-BR-${String(idx + 1).padStart(5, '0')}`,
      ulpin: p.ulpin,
      khesra_no: p.khesra_no,

      master_plan_zone: masterPlanUse,
      actual_use: actualUse,
      permitted_use: masterPlanUse,

      building_permission: isViolation ? 'No Permission' :
        (['Residential', 'Commercial'].includes(masterPlanUse) ? randomChoice(['Approved', 'Approved', 'Not Applied', 'Pending']) : 'N/A'),

      satellite_observation: isViolation ? `Large ${actualUse.toLowerCase()} structure detected` : null,

      _is_land_use_violation: isViolation,
      _violation_detail: isViolation ? `Master Plan: ${masterPlanUse}, Actual Use: ${actualUse}, Building Permission: No Permission` : null,
    };
  });

  const violations = records.filter(r => r._is_land_use_violation);

  writeJSON('data/bihar/essential_layer/land_use.json', {
    metadata: {
      description: 'Land Use Classification and Violations — Bihar',
      disclaimer: 'DEMO DATA',
      total_records: records.length,
      violations_detected: violations.length,
      date_created: new Date().toISOString(),
    },
    records,
  });

  console.log(`   ✅ Generated ${records.length} land-use records`);
  console.log(`   ⚠️  ${violations.length} land-use violations (master plan vs actual)`);
}

// ============================================================================
// CONFLICT SUMMARY (for AI Dashboard)
// ============================================================================

function generateConflictSummary(conflicts) {
  console.log('🤖 Generating AI Conflict Summary Dashboard...');

  const summary = {
    metadata: {
      description: 'AI/Rule-Engine Conflict Detection Summary',
      purpose: 'Powers the "Data Inconsistency Detection" feature of LandStack',
      total_conflicts: conflicts.length,
      date_created: new Date().toISOString(),
    },
    conflict_types: {
      owner_name_mismatch: {
        count: conflicts.filter(c => c.conflict_type === 'owner_name_mismatch').length,
        severity: 'HIGH',
        description: 'Owner name differs between RoR (Jamabandi), Registration, and/or Property Tax records',
        example: 'RoR: "Ramesh Kumar" vs Tax: "Ramesh Kr." vs Registration: "Kumar Ramesh"',
        action: 'Flag for Revenue Officer verification',
        icon: '🔴',
      },
      land_use_violation: {
        count: conflicts.filter(c => c.conflict_type === 'land_use_violation').length,
        severity: 'HIGH',
        description: 'Actual land use differs from Master Plan designation and no building permission exists',
        example: 'Master Plan: Agricultural, Satellite: Commercial structure, Permission: None',
        action: 'Flag for Planning Officer and send notice',
        icon: '🟠',
      },
      encumbrance_sale_conflict: {
        count: conflicts.filter(c => c.conflict_type === 'encumbrance_sale_conflict').length,
        severity: 'CRITICAL',
        description: 'Active mortgage/encumbrance exists but sale transaction is being processed',
        example: 'Mortgage: ACTIVE (SBI, ₹15,00,000) + Registration: Sale initiated',
        action: 'Block transaction until encumbrance is cleared',
        icon: '🔴',
      },
      area_discrepancy: {
        count: conflicts.filter(c => c.conflict_type === 'area_discrepancy').length,
        severity: 'MEDIUM',
        description: 'Area recorded in RoR differs from survey/measurement records',
        example: 'RoR: 0.42 hectare vs Survey: 0.38 hectare',
        action: 'Schedule resurvey and update records',
        icon: '🟡',
      },
    },
    parcels_with_conflicts: conflicts.map(c => ({
      ulpin: c.ulpin,
      khesra_no: c.khesra_no,
      conflict_type: c.conflict_type,
      original_value: c.original_owner,
      conflicting_value: c.corrupt_owner,
      severity: c.conflict_type === 'encumbrance_sale_conflict' ? 'CRITICAL' :
               c.conflict_type === 'owner_name_mismatch' ? 'HIGH' :
               c.conflict_type === 'land_use_violation' ? 'HIGH' : 'MEDIUM',
    })),
  };

  writeJSON('data/bihar/usecase_layer/ai_conflict_summary.json', summary);
  console.log(`   ✅ Generated AI conflict summary (${conflicts.length} conflicts across 4 categories)`);
}

// ============================================================================
// STATE ADAPTERS
// ============================================================================

function generateStateAdapters() {
  console.log('🔄 Generating State Data Adapters...');

  const biharAdapter = {
    metadata: {
      description: 'Bihar State Data Adapter — transforms Bihar-specific terminology to LandStack canonical schema',
      state: 'Bihar',
      state_code: 'BR',
      version: '1.0',
      language: 'Hindi',
      date_created: new Date().toISOString(),
    },
    field_mapping: {
      // Bihar term → Canonical LandStack term
      khesra_no: { canonical: 'survey_number', description: 'Plot/Survey number' },
      khata_no: { canonical: 'account_number', description: 'Holding/Account number' },
      thana_no: { canonical: 'revenue_circle_number', description: 'Thana number' },
      raiyat_name: { canonical: 'owner_name', description: 'Land holder name' },
      pita_pati_name: { canonical: 'father_husband_name', description: 'Father/husband name' },
      raiyat_type: { canonical: 'owner_type', description: 'Holder type' },
      rakba_decimal: { canonical: 'area_local_unit', description: 'Area in decimal (Bihar)' },
      rakba_acre: { canonical: 'area_acres', description: 'Area in acres' },
      rakba_hectare: { canonical: 'area_hectares', description: 'Area in hectares' },
      kisam: { canonical: 'land_type', description: 'Land classification' },
      mauza: { canonical: 'village', description: 'Revenue village' },
      halka: { canonical: 'sub_village_unit', description: 'Revenue sub-unit' },
      anchal: { canonical: 'block', description: 'Revenue circle/block' },
      lagaan: { canonical: 'annual_revenue', description: 'Annual land tax' },
      jamabandi: { canonical: 'record_of_rights', description: 'RoR register' },
    },
    unit_conversions: {
      area: {
        source_unit: 'decimal',
        target_unit: 'sq_meters',
        formula: 'rakba_decimal * 40.4686',
        note: '1 acre = 100 decimal = 4046.86 sq.m',
      },
    },
    land_type_mapping: {
      'Agricultural': 'Agricultural',
      'Residential': 'Residential',
      'Commercial': 'Commercial',
      'Gair Mazarua (Govt)': 'Government Land',
      'Orchard': 'Agricultural (Orchard)',
      'Wasteland': 'Barren/Wasteland',
      'Pond/Water Body': 'Water Body',
      'Mixed Use': 'Mixed Use',
    },
    administrative_hierarchy: ['State', 'District', 'Sub-Division', 'Circle/Anchal', 'Halka', 'Mauza/Village'],
    ror_system: 'Jamabandi',
    measurement_unit: 'Decimal (1 acre = 100 decimal)',
  };

  const tamilNaduAdapter = {
    metadata: {
      description: 'Tamil Nadu State Data Adapter — transforms TN-specific terminology to LandStack canonical schema',
      state: 'Tamil Nadu',
      state_code: 'TN',
      version: '1.0',
      language: 'Tamil',
      date_created: new Date().toISOString(),
    },
    field_mapping: {
      survey_no: { canonical: 'survey_number', description: 'Survey number' },
      sub_div_no: { canonical: 'subdivision_number', description: 'Sub-division number' },
      patta_no: { canonical: 'account_number', description: 'Patta/Title number' },
      pattadhar: { canonical: 'owner_name', description: 'Patta holder' },
      thandai: { canonical: 'father_husband_name', description: 'Father name' },
      nanjai_punjai: { canonical: 'land_type', description: 'Wet/Dry land classification' },
      parappu: { canonical: 'area_local_unit', description: 'Area in cents' },
      hectare: { canonical: 'area_hectares', description: 'Area in hectares' },
      kiramanam: { canonical: 'village', description: 'Revenue village' },
      taluk: { canonical: 'sub_district', description: 'Taluk' },
      varuvaai: { canonical: 'annual_revenue', description: 'Land tax' },
      chitta: { canonical: 'record_of_rights', description: 'RoR document (Chitta)' },
      adangal: { canonical: 'village_account', description: 'Village account register' },
    },
    unit_conversions: {
      area: {
        source_unit: 'cent',
        target_unit: 'sq_meters',
        formula: 'parappu * 40.4686',
        note: '1 acre = 100 cents = 4046.86 sq.m',
      },
    },
    land_type_mapping: {
      'Nanjai': 'Agricultural (Wet/Irrigated)',
      'Punjai': 'Agricultural (Dry/Rain-fed)',
      'Manal': 'Residential',
      'Thottam': 'Agricultural (Garden/Orchard)',
      'Poramboke': 'Government Land',
      'Kazhani': 'Wetland/Paddy',
    },
    administrative_hierarchy: ['State', 'District', 'Taluk', 'Firka', 'Revenue Village'],
    ror_system: 'Chitta / Adangal',
    measurement_unit: 'Cent (1 acre = 100 cents)',
  };

  const chandigarhAdapter = {
    metadata: {
      description: 'Chandigarh UT Data Adapter — transforms Chandigarh-specific terminology to LandStack canonical schema',
      state: 'Chandigarh',
      state_code: 'CH',
      version: '1.0',
      language: 'Hindi/Punjabi',
      date_created: new Date().toISOString(),
    },
    field_mapping: {
      khasra_no: { canonical: 'survey_number', description: 'Khasra/Plot number' },
      khata_no: { canonical: 'account_number', description: 'Khewat/Khatauni number' },
      owner_name: { canonical: 'owner_name', description: 'Property owner' },
      father_name: { canonical: 'father_husband_name', description: 'Father/husband name' },
      area_sq_meters: { canonical: 'area_sq_meters', description: 'Area in sq meters' },
      area_acres: { canonical: 'area_acres', description: 'Area in acres' },
      land_type: { canonical: 'land_type', description: 'Land use type' },
      sector: { canonical: 'locality', description: 'Sector' },
    },
    unit_conversions: {
      area: {
        source_unit: 'marla/kanal',
        target_unit: 'sq_meters',
        formula: 'area_marla * 25.2929 or area_kanal * 505.857',
        note: '1 kanal = 20 marla = 505.857 sq.m',
      },
    },
    administrative_hierarchy: ['UT', 'Sector/Village'],
    ror_system: 'Jamabandi / Khewat-Khatauni',
    measurement_unit: 'Marla/Kanal (1 kanal = 20 marla)',
  };

  writeJSON('data/adapters/bihar_adapter.json', biharAdapter);
  writeJSON('data/adapters/tamilnadu_adapter.json', tamilNaduAdapter);
  writeJSON('data/adapters/chandigarh_adapter.json', chandigarhAdapter);

  // Canonical schema definition
  writeJSON('data/adapters/canonical_schema.json', {
    metadata: {
      description: 'LandStack Canonical Schema — all state data is normalized to this format',
      version: '1.0',
      date_created: new Date().toISOString(),
    },
    canonical_parcel: {
      parcel_id: 'UUID (internal)',
      ulpin: 'IN-XX-XX-XXXXXXXX-XX',
      survey_number: 'Normalized survey/plot number',
      account_number: 'Normalized holding/account number',
      owner_name: 'Normalized owner name',
      father_husband_name: 'Normalized father/husband name',
      owner_type: 'Individual | Joint | Government | Trust | Company',
      area_sq_meters: 'Area in sq.m (all units converted)',
      area_hectares: 'Area in hectares',
      land_type: 'Agricultural | Residential | Commercial | Industrial | Government Land | Mixed Use | Water Body | Barren',
      village: 'Revenue village name',
      sub_district: 'Sub-district / Taluk / Sub-Division',
      district: 'District name',
      state: 'State/UT name',
      geometry: 'PostGIS Polygon (EPSG:4326)',
    },
    supported_states: ['Bihar', 'Tamil Nadu', 'Chandigarh'],
    normalization_rules: [
      'All area values converted to sq_meters (canonical unit)',
      'Owner names normalized to Title Case',
      'Land types mapped to canonical enum values',
      'Administrative hierarchy standardized',
      'Coordinates reprojected to EPSG:4326 if needed',
    ],
  });

  console.log('   ✅ Generated Bihar adapter');
  console.log('   ✅ Generated Tamil Nadu adapter');
  console.log('   ✅ Generated Chandigarh adapter');
  console.log('   ✅ Generated canonical schema definition');
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Land Stack - Bihar Data Generator | SIH 2026 | PS #26014║');
  console.log('║  Pilot: Bihar → Madhubani → Arghawa (33)                 ║');
  console.log('║  WITH intentional data conflicts for AI demo             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  // Base Layer
  console.log('━━━ 🗺️ BASE LAYER ━━━');
  const { parcels, conflicts } = generateBiharParcels();

  // Essential Layer
  console.log('\n━━━ 📋 ESSENTIAL LAYER ━━━');
  generateJamabandi(parcels, conflicts);
  generateRegistration(parcels, conflicts);
  generateEncumbrance(parcels, conflicts);
  generateLandUseViolations(parcels, conflicts);

  // Use-Case Layer
  console.log('\n━━━ 🔧 USE-CASE LAYER ━━━');
  generatePropertyTax(parcels, conflicts);
  generateConflictSummary(conflicts);

  // State Adapters
  console.log('\n━━━ 🔄 STATE ADAPTERS ━━━');
  generateStateAdapters();

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  ✅ BIHAR DATA GENERATED SUCCESSFULLY!                    ║');
  console.log('║                                                           ║');
  console.log('║  Conflict Summary:                                        ║');
  console.log(`║  Total conflicts: ${String(conflicts.length).padEnd(40)}║`);
  conflicts.reduce((acc, c) => { acc[c.conflict_type] = (acc[c.conflict_type]||0)+1; return acc; }, {});
  const types = {};
  conflicts.forEach(c => { types[c.conflict_type] = (types[c.conflict_type]||0)+1; });
  Object.entries(types).forEach(([k, v]) => {
    console.log(`║    ${k}: ${String(v).padEnd(36)}║`);
  });
  console.log('╚════════════════════════════════════════════════════════════╝');
}

main();
