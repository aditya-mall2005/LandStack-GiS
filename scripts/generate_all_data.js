/**
 * Land Stack - Comprehensive Data Generator
 * SIH 2026 | PS #26014
 * 
 * Generates all mock/sample datasets for the Land Stack prototype
 * Pilot Area: Chandigarh (Sectors 17, 22, 26, 34, 35)
 * 
 * Outputs:
 *   - Base Layer: Cadastral parcels GeoJSON, ULPIN index
 *   - Essential Layer: RoR, Registration, Building Permissions, Encumbrances, Zoning
 *   - Use-Case Layer: Property Tax, Circle Rates, Environmental Zones, Disputes
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  pilot: {
    state: 'Chandigarh',
    stateCode: 'CH',
    districtCode: '01',
    city: 'Chandigarh',
  },
  parcels: {
    totalCount: 250,
  },
  // Chandigarh sectors with approximate center coordinates
  sectors: [
    { name: 'Sector 17', lat: 30.7415, lng: 76.7838, description: 'Commercial Hub' },
    { name: 'Sector 22', lat: 30.7335, lng: 76.7794, description: 'Market Area' },
    { name: 'Sector 26', lat: 30.7255, lng: 76.7988, description: 'Grain Market / Mixed' },
    { name: 'Sector 34', lat: 30.7205, lng: 76.7694, description: 'Residential' },
    { name: 'Sector 35', lat: 30.7175, lng: 76.7794, description: 'Residential / IT Park' },
    { name: 'Manimajra', lat: 30.7290, lng: 76.8175, description: 'Urban Village' },
    { name: 'Dhanas', lat: 30.7500, lng: 76.7600, description: 'Rural/Peri-urban Village' },
  ],
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(startYear, endYear) {
  const start = new Date(startYear, 0, 1);
  const end = new Date(endYear, 11, 31);
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

function generateULPIN(stateCode, districtCode, index) {
  const parcelNum = String(index).padStart(8, '0');
  const checkChars = crypto.randomBytes(1).toString('hex').substring(0, 2).toUpperCase();
  return `${stateCode}-${districtCode}-${parcelNum}-${checkChars}`;
}

function generateParcelPolygon(centerLat, centerLng, sizeMeters = null) {
  // Generate a realistic parcel polygon around a center point
  const size = sizeMeters || randomBetween(15, 80); // meters
  const latOffset = (size / 111320) * randomBetween(0.8, 1.2);
  const lngOffset = (size / (111320 * Math.cos(centerLat * Math.PI / 180))) * randomBetween(0.8, 1.2);
  
  // Create a slightly irregular quadrilateral
  const jitter = () => randomBetween(-0.15, 0.15);
  
  const coords = [
    [centerLng - lngOffset / 2 + lngOffset * jitter(), centerLat - latOffset / 2 + latOffset * jitter()],
    [centerLng + lngOffset / 2 + lngOffset * jitter(), centerLat - latOffset / 2 + latOffset * jitter()],
    [centerLng + lngOffset / 2 + lngOffset * jitter(), centerLat + latOffset / 2 + latOffset * jitter()],
    [centerLng - lngOffset / 2 + lngOffset * jitter(), centerLat + latOffset / 2 + latOffset * jitter()],
  ];
  // Close the polygon
  coords.push([...coords[0]]);
  
  return [coords];
}

// ============================================================================
// NAME DATA POOLS
// ============================================================================

const FIRST_NAMES = [
  'Rajesh', 'Suresh', 'Ramesh', 'Mukesh', 'Anil', 'Sanjay', 'Vijay', 'Ajay',
  'Priya', 'Sunita', 'Anita', 'Kavita', 'Meena', 'Geeta', 'Neha', 'Pooja',
  'Amit', 'Sumit', 'Rohit', 'Mohit', 'Deepak', 'Ravi', 'Manoj', 'Vinod',
  'Asha', 'Rekha', 'Savita', 'Mamta', 'Suman', 'Kiran', 'Nisha', 'Ritu',
  'Harpreet', 'Gurpreet', 'Manpreet', 'Jaspreet', 'Simran', 'Navneet',
  'Kuldeep', 'Sandeep', 'Pardeep', 'Balwinder', 'Sukhwinder', 'Jagdish',
  'Satish', 'Raminder', 'Harbans', 'Surinder', 'Davinder', 'Parminder',
  'Arjun', 'Krishna', 'Lakshmi', 'Sarita', 'Vandana', 'Shobha', 'Jyoti',
];

const LAST_NAMES = [
  'Kumar', 'Sharma', 'Singh', 'Verma', 'Gupta', 'Jain', 'Agarwal', 'Bansal',
  'Mehta', 'Chauhan', 'Yadav', 'Thakur', 'Malhotra', 'Kapoor', 'Chopra',
  'Khanna', 'Arora', 'Sethi', 'Bhatia', 'Dhawan', 'Grover', 'Kohli',
  'Gill', 'Sidhu', 'Sandhu', 'Dhillon', 'Grewal', 'Bajwa', 'Bedi', 'Sahni',
  'Kaur', 'Pandit', 'Mishra', 'Tiwari', 'Dubey', 'Pandey', 'Saxena',
  'Rastogi', 'Mittal', 'Goel', 'Goyal', 'Singhal', 'Joshi', 'Bhatt',
];

function randomName() {
  return `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`;
}

function randomFatherName() {
  return `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`;
}

// ============================================================================
// BASE LAYER: CADASTRAL PARCELS + ULPIN
// ============================================================================

function generateBaseLayer() {
  console.log('📍 Generating Base Layer: Cadastral Parcels...');
  
  const parcels = [];
  const ulpinIndex = [];
  let globalIndex = 1;
  
  const landTypes = ['Residential', 'Commercial', 'Agricultural', 'Industrial', 'Institutional', 'Mixed Use', 'Green Belt'];
  const landTypeWeights = [0.40, 0.15, 0.10, 0.08, 0.07, 0.12, 0.08];
  
  function weightedLandType() {
    const r = Math.random();
    let cumulative = 0;
    for (let i = 0; i < landTypes.length; i++) {
      cumulative += landTypeWeights[i];
      if (r <= cumulative) return landTypes[i];
    }
    return landTypes[0];
  }
  
  for (const sector of CONFIG.sectors) {
    // Distribute parcels across sectors
    const parcelsInSector = sector.name === 'Sector 17' ? 50 :
                           sector.name === 'Manimajra' ? 40 :
                           sector.name === 'Dhanas' ? 30 : 
                           Math.floor(CONFIG.parcels.totalCount / CONFIG.sectors.length);
    
    for (let i = 0; i < parcelsInSector; i++) {
      const ulpin = generateULPIN(CONFIG.pilot.stateCode, CONFIG.pilot.districtCode, globalIndex);
      const khasraNo = `${randomInt(1, 999)}/${randomInt(1, 20)}`;
      const khataNo = String(randomInt(1, 500));
      const surveyNo = `S-${CONFIG.pilot.districtCode}-${String(globalIndex).padStart(5, '0')}`;
      
      // Spread parcels within the sector
      const offsetLat = randomBetween(-0.005, 0.005);
      const offsetLng = randomBetween(-0.005, 0.005);
      const parcelLat = sector.lat + offsetLat;
      const parcelLng = sector.lng + offsetLng;
      
      const landType = weightedLandType();
      const areaAcres = landType === 'Agricultural' ? randomBetween(0.5, 5.0) :
                        landType === 'Industrial' ? randomBetween(0.3, 2.0) :
                        landType === 'Commercial' ? randomBetween(0.05, 0.5) :
                        randomBetween(0.02, 0.3);
      const areaSqMeters = Math.round(areaAcres * 4046.86);
      const areaHectares = parseFloat((areaAcres * 0.404686).toFixed(4));
      
      const owner = randomName();
      const ownerTypes = ['Individual', 'Joint', 'Government', 'Trust', 'Company'];
      const ownerTypeWeights = [0.55, 0.20, 0.10, 0.08, 0.07];
      let ownerType = 'Individual';
      const r = Math.random();
      let cum = 0;
      for (let j = 0; j < ownerTypes.length; j++) {
        cum += ownerTypeWeights[j];
        if (r <= cum) { ownerType = ownerTypes[j]; break; }
      }
      
      const polygon = generateParcelPolygon(parcelLat, parcelLng, Math.sqrt(areaSqMeters));
      
      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: polygon,
        },
        properties: {
          ulpin: ulpin,
          plot_id: `PLOT-${String(globalIndex).padStart(4, '0')}`,
          khasra_no: khasraNo,
          khata_no: khataNo,
          survey_no: surveyNo,
          owner_name: owner,
          father_name: randomFatherName(),
          owner_type: ownerType,
          land_type: landType,
          area_sq_meters: areaSqMeters,
          area_acres: parseFloat(areaAcres.toFixed(4)),
          area_hectares: areaHectares,
          sector: sector.name,
          city: CONFIG.pilot.city,
          state: CONFIG.pilot.state,
          verification_status: randomChoice(['Verified', 'Verified', 'Verified', 'Pending', 'Under Review']),
          aadhaar_linked: Math.random() > 0.2,
          digitization_date: randomDate(2020, 2025),
          last_mutation_date: randomDate(2018, 2026),
          centroid_lat: parseFloat(parcelLat.toFixed(6)),
          centroid_lng: parseFloat(parcelLng.toFixed(6)),
        },
      };
      
      parcels.push(feature);
      
      ulpinIndex.push({
        ulpin: ulpin,
        plot_id: feature.properties.plot_id,
        khasra_no: khasraNo,
        khata_no: khataNo,
        survey_no: surveyNo,
        owner_name: owner,
        sector: sector.name,
        land_type: landType,
        area_sq_meters: areaSqMeters,
      });
      
      globalIndex++;
    }
  }
  
  const geojson = {
    type: 'FeatureCollection',
    name: 'Chandigarh_Cadastral_Parcels',
    crs: {
      type: 'name',
      properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' },
    },
    metadata: {
      description: 'Mock cadastral parcel boundaries for Chandigarh pilot area',
      source: 'Generated for SIH 2026 Land Stack Prototype',
      date_created: new Date().toISOString(),
      total_parcels: parcels.length,
      pilot_area: 'Chandigarh, India',
      coordinate_system: 'WGS 84 (EPSG:4326)',
    },
    features: parcels,
  };
  
  writeJSON('data/base_layer/cadastral_parcels.geojson', geojson);
  writeJSON('data/base_layer/ulpin_index.json', {
    metadata: {
      description: 'ULPIN (Unique Land Parcel Identification Number) Index',
      total_records: ulpinIndex.length,
      format: 'XX-XX-XXXXXXXX-XX (State-District-Parcel-Check)',
      date_created: new Date().toISOString(),
    },
    records: ulpinIndex,
  });
  
  console.log(`   ✅ Generated ${parcels.length} cadastral parcels`);
  console.log(`   ✅ Generated ULPIN index with ${ulpinIndex.length} entries`);
  
  return parcels;
}

// ============================================================================
// ESSENTIAL LAYER: RECORD OF RIGHTS (RoR)
// ============================================================================

function generateRoR(parcels) {
  console.log('📋 Generating Essential Layer: Record of Rights...');
  
  const rorRecords = parcels.map((parcel, idx) => {
    const p = parcel.properties;
    const mutationHistory = [];
    const numMutations = randomInt(0, 4);
    
    for (let m = 0; m < numMutations; m++) {
      mutationHistory.push({
        mutation_id: `MUT-${String(idx + 1).padStart(4, '0')}-${m + 1}`,
        mutation_type: randomChoice(['Sale', 'Inheritance', 'Gift', 'Partition', 'Court Order']),
        mutation_date: randomDate(2015, 2026),
        previous_owner: randomName(),
        new_owner: m === numMutations - 1 ? p.owner_name : randomName(),
        order_number: `RO-${randomInt(1000, 9999)}/${randomDate(2015, 2026).substring(0, 4)}`,
        status: m === numMutations - 1 ? 'Approved' : 'Approved',
      });
    }
    
    return {
      ror_id: `ROR-${CONFIG.pilot.stateCode}-${String(idx + 1).padStart(5, '0')}`,
      ulpin: p.ulpin,
      khasra_no: p.khasra_no,
      khata_no: p.khata_no,
      survey_no: p.survey_no,
      
      // Ownership details
      owner_name: p.owner_name,
      father_husband_name: p.father_name,
      owner_type: p.owner_type,
      co_owners: p.owner_type === 'Joint' ? [randomName(), Math.random() > 0.5 ? randomName() : null].filter(Boolean) : [],
      
      // Land details  
      land_type: p.land_type,
      land_classification: randomChoice(['Irrigated', 'Un-irrigated', 'Barren', 'Built-up', 'Orchard']),
      soil_type: randomChoice(['Alluvial', 'Red', 'Black', 'Laterite', 'Sandy']),
      irrigation_source: p.land_type === 'Agricultural' ? randomChoice(['Canal', 'Tubewell', 'Rain-fed', 'None']) : 'N/A',
      crop_details: p.land_type === 'Agricultural' ? randomChoice(['Wheat', 'Rice', 'Sugarcane', 'Mustard', 'Mixed', 'Fallow']) : 'N/A',
      
      // Area
      area_acres: p.area_acres,
      area_hectares: p.area_hectares,
      area_sq_meters: p.area_sq_meters,
      area_bigha: parseFloat((p.area_acres * 1.6).toFixed(4)),
      area_marla: parseFloat((p.area_sq_meters / 25.2929).toFixed(2)),
      area_kanal: parseFloat((p.area_sq_meters / 505.857).toFixed(4)),
      
      // Status
      verification_status: p.verification_status,
      aadhaar_linked: p.aadhaar_linked,
      digitization_status: 'Digitized',
      
      // Rights and restrictions
      rights: {
        ownership_right: true,
        cultivation_right: p.land_type === 'Agricultural',
        building_right: ['Residential', 'Commercial', 'Industrial', 'Mixed Use'].includes(p.land_type),
        transfer_right: p.owner_type !== 'Government',
        mortgage_right: p.owner_type !== 'Government',
      },
      restrictions: p.land_type === 'Green Belt' ? ['No Construction', 'No Commercial Use'] :
                    p.land_type === 'Agricultural' ? ['Agricultural Use Only', 'No Conversion Without Permission'] :
                    [],
      
      // Dates
      entry_date: randomDate(2010, 2020),
      last_mutation_date: p.last_mutation_date,
      last_updated: randomDate(2024, 2026),
      
      // Mutations
      mutation_history: mutationHistory,
      
      // Location
      sector: p.sector,
      city: p.city,
      state: p.state,
      
      // Revenue
      annual_revenue: p.land_type === 'Agricultural' ? randomInt(100, 5000) : randomInt(500, 50000),
      revenue_paid_till: randomChoice(['2025-26', '2024-25', '2023-24']),
      
      // Document reference
      document_references: [
        `DEED-${randomInt(10000, 99999)}`,
        Math.random() > 0.5 ? `MAP-${randomInt(1000, 9999)}` : null,
      ].filter(Boolean),
    };
  });
  
  writeJSON('data/essential_layer/record_of_rights.json', {
    metadata: {
      description: 'Record of Rights (RoR) / Jamabandi for Chandigarh parcels',
      total_records: rorRecords.length,
      state: CONFIG.pilot.state,
      date_created: new Date().toISOString(),
      schema_version: '1.0',
      local_names: {
        'Chandigarh': 'Jamabandi',
        'Punjab': 'Jamabandi',
        'Haryana': 'Jamabandi',
        'Uttar Pradesh': 'Khatauni',
        'Madhya Pradesh': 'B1/Khasra',
        'Maharashtra': '7/12 Extract',
        'Karnataka': 'RTC (Record of Rights, Tenancy and Crop)',
        'Tamil Nadu': 'Chitta/Adangal',
      },
    },
    records: rorRecords,
  });
  
  console.log(`   ✅ Generated ${rorRecords.length} RoR records`);
  return rorRecords;
}

// ============================================================================
// ESSENTIAL LAYER: REGISTRATION RECORDS
// ============================================================================

function generateRegistrationRecords(parcels) {
  console.log('📝 Generating Essential Layer: Registration Records...');
  
  const transactionTypes = ['Sale Deed', 'Gift Deed', 'Lease Deed', 'Mortgage Deed', 'Release Deed', 'Partition Deed', 'Will', 'Power of Attorney'];
  const transactionWeights = [0.40, 0.10, 0.12, 0.15, 0.05, 0.08, 0.05, 0.05];
  
  const records = [];
  const selectedParcels = parcels.filter(() => Math.random() > 0.3); // ~70% parcels have transactions
  
  selectedParcels.forEach((parcel, idx) => {
    const p = parcel.properties;
    const numTransactions = randomInt(1, 3);
    
    for (let t = 0; t < numTransactions; t++) {
      // Weighted transaction type selection
      let txnType = transactionTypes[0];
      const r = Math.random();
      let cum = 0;
      for (let j = 0; j < transactionTypes.length; j++) {
        cum += transactionWeights[j];
        if (r <= cum) { txnType = transactionTypes[j]; break; }
      }
      
      const baseValue = p.land_type === 'Commercial' ? randomInt(5000000, 50000000) :
                        p.land_type === 'Residential' ? randomInt(1500000, 15000000) :
                        p.land_type === 'Industrial' ? randomInt(3000000, 30000000) :
                        randomInt(500000, 5000000);
      
      const stampDutyRate = p.land_type === 'Agricultural' ? 0.03 : 0.06;
      const registrationFee = Math.min(Math.round(baseValue * 0.01), 30000);
      
      records.push({
        registration_id: `REG-${new Date().getFullYear()}-${String(records.length + 1).padStart(6, '0')}`,
        ulpin: p.ulpin,
        khasra_no: p.khasra_no,
        document_number: `DOC-${randomInt(100000, 999999)}/${randomDate(2018, 2026).substring(0, 4)}`,
        
        // Transaction details
        transaction_type: txnType,
        seller_transferor: txnType === 'Sale Deed' ? randomName() : p.owner_name,
        buyer_transferee: txnType === 'Sale Deed' ? p.owner_name : randomName(),
        
        // Witnesses
        witness_1: randomName(),
        witness_2: randomName(),
        
        // Financial
        consideration_amount: baseValue,
        market_value: Math.round(baseValue * randomBetween(0.9, 1.3)),
        stamp_duty: Math.round(baseValue * stampDutyRate),
        registration_fee: registrationFee,
        total_charges: Math.round(baseValue * stampDutyRate) + registrationFee,
        
        // Dates
        execution_date: randomDate(2018, 2026),
        registration_date: randomDate(2018, 2026),
        
        // Office
        sub_registrar_office: randomChoice([
          'SRO Chandigarh-I (Sector 17)',
          'SRO Chandigarh-II (Sector 34)',
          'SRO Manimajra',
        ]),
        presenting_officer: randomName(),
        
        // Status
        status: randomChoice(['Registered', 'Registered', 'Registered', 'Pending Verification', 'Rejected']),
        
        // Details
        property_description: `Plot ${p.plot_id}, ${p.sector}, ${p.city}`,
        area_sq_meters: p.area_sq_meters,
        land_type: p.land_type,
        
        // Digital
        e_stamp_id: `ESTMP-${randomInt(1000000, 9999999)}`,
        digital_signature: Math.random() > 0.3,
        biometric_verified: Math.random() > 0.2,
      });
    }
  });
  
  writeJSON('data/essential_layer/registration_records.json', {
    metadata: {
      description: 'Property Registration / Transaction Records',
      total_records: records.length,
      state: CONFIG.pilot.state,
      date_created: new Date().toISOString(),
    },
    records: records,
  });
  
  console.log(`   ✅ Generated ${records.length} registration records`);
  return records;
}

// ============================================================================
// ESSENTIAL LAYER: BUILDING PERMISSIONS
// ============================================================================

function generateBuildingPermissions(parcels) {
  console.log('🏗️ Generating Essential Layer: Building Permissions...');
  
  const buildableParcels = parcels.filter(p =>
    ['Residential', 'Commercial', 'Industrial', 'Mixed Use', 'Institutional'].includes(p.properties.land_type)
  );
  
  const permittedParcels = buildableParcels.filter(() => Math.random() > 0.25);
  
  const records = permittedParcels.map((parcel, idx) => {
    const p = parcel.properties;
    const floorCount = p.land_type === 'Commercial' ? randomInt(3, 15) :
                      p.land_type === 'Industrial' ? randomInt(1, 4) :
                      p.land_type === 'Institutional' ? randomInt(2, 8) :
                      randomInt(1, 4);
    
    const far = p.land_type === 'Commercial' ? randomBetween(3.0, 5.0) :
               p.land_type === 'Residential' ? randomBetween(1.5, 2.5) :
               randomBetween(1.0, 3.5);
    
    const groundCoverage = p.land_type === 'Commercial' ? randomBetween(40, 70) :
                          p.land_type === 'Residential' ? randomBetween(35, 55) :
                          randomBetween(30, 50);
    
    const builtUpArea = Math.round(p.area_sq_meters * far);
    
    return {
      permission_id: `BP-${CONFIG.pilot.stateCode}-${String(idx + 1).padStart(5, '0')}`,
      ulpin: p.ulpin,
      plot_id: p.plot_id,
      khasra_no: p.khasra_no,
      
      // Applicant
      applicant_name: p.owner_name,
      architect_name: randomName(),
      architect_license: `ARCH-${randomInt(1000, 9999)}`,
      
      // Building details
      building_type: p.land_type === 'Residential' ? randomChoice(['Independent House', 'Row House', 'Apartment Complex', 'Villa']) :
                    p.land_type === 'Commercial' ? randomChoice(['Office Building', 'Shopping Complex', 'Hotel', 'Restaurant']) :
                    p.land_type === 'Industrial' ? randomChoice(['Factory', 'Warehouse', 'Workshop']) :
                    randomChoice(['Hospital', 'School', 'Community Center']),
      proposed_floors: floorCount,
      basement_floors: Math.random() > 0.6 ? randomInt(1, 2) : 0,
      building_height_meters: parseFloat((floorCount * 3.2).toFixed(1)),
      
      // Area
      plot_area_sqm: p.area_sq_meters,
      ground_coverage_percent: parseFloat(groundCoverage.toFixed(1)),
      far: parseFloat(far.toFixed(2)),
      built_up_area_sqm: builtUpArea,
      open_area_percent: parseFloat((100 - groundCoverage).toFixed(1)),
      
      // Parking
      parking_spaces: randomInt(2, Math.max(5, Math.floor(builtUpArea / 100))),
      
      // Status
      application_date: randomDate(2020, 2025),
      approval_date: randomDate(2020, 2026),
      validity_till: randomDate(2027, 2030),
      status: randomChoice(['Approved', 'Approved', 'Approved', 'Conditionally Approved', 'Under Review', 'Expired']),
      
      // Compliance
      fire_noc: Math.random() > 0.2,
      environmental_clearance: p.area_sq_meters > 2000 ? Math.random() > 0.3 : 'Not Required',
      structural_stability_certificate: Math.random() > 0.15,
      
      // Authority
      issuing_authority: 'Chandigarh Housing Board / Estate Office',
      approval_officer: randomName(),
      
      // Setbacks
      setbacks: {
        front: randomChoice([4.5, 6.0, 9.0]),
        rear: randomChoice([2.0, 3.0, 4.5]),
        left: randomChoice([1.5, 2.0, 3.0]),
        right: randomChoice([1.5, 2.0, 3.0]),
      },
    };
  });
  
  writeJSON('data/essential_layer/building_permissions.json', {
    metadata: {
      description: 'Building Permission and Approval Records',
      total_records: records.length,
      issuing_authority: 'Chandigarh Administration / Estate Office',
      date_created: new Date().toISOString(),
    },
    records: records,
  });
  
  console.log(`   ✅ Generated ${records.length} building permission records`);
  return records;
}

// ============================================================================
// ESSENTIAL LAYER: ENCUMBRANCE / MORTGAGE RECORDS
// ============================================================================

function generateEncumbranceRecords(parcels) {
  console.log('🔒 Generating Essential Layer: Encumbrance Records...');
  
  const encumberedParcels = parcels.filter(() => Math.random() > 0.55); // ~45% have encumbrances
  
  const records = encumberedParcels.map((parcel, idx) => {
    const p = parcel.properties;
    const encumbranceType = randomChoice([
      'Mortgage', 'Mortgage', 'Mortgage',
      'Lien', 'Charge', 'Attachment',
      'Lease', 'Hypothecation', 'Pledge',
    ]);
    
    const banks = [
      'State Bank of India', 'Punjab National Bank', 'HDFC Bank', 'ICICI Bank',
      'Bank of Baroda', 'Canara Bank', 'Union Bank', 'Axis Bank',
      'Punjab & Sind Bank', 'Indian Overseas Bank', 'Kotak Mahindra Bank',
    ];
    
    const loanAmount = p.land_type === 'Commercial' ? randomInt(2000000, 50000000) :
                      p.land_type === 'Residential' ? randomInt(500000, 10000000) :
                      randomInt(100000, 5000000);
    
    return {
      encumbrance_id: `EC-${CONFIG.pilot.stateCode}-${String(idx + 1).padStart(5, '0')}`,
      ulpin: p.ulpin,
      plot_id: p.plot_id,
      khasra_no: p.khasra_no,
      
      encumbrance_type: encumbranceType,
      
      // Parties
      property_owner: p.owner_name,
      lender_party: encumbranceType === 'Mortgage' ? randomChoice(banks) :
                   encumbranceType === 'Lien' ? 'Income Tax Department' :
                   encumbranceType === 'Attachment' ? 'District Court, Chandigarh' :
                   randomChoice(banks),
      
      // Financial
      loan_amount: loanAmount,
      outstanding_amount: Math.round(loanAmount * randomBetween(0.3, 0.95)),
      interest_rate: parseFloat(randomBetween(6.5, 12.5).toFixed(2)),
      loan_tenure_years: randomInt(5, 30),
      emi_amount: Math.round(loanAmount / (randomInt(5, 30) * 12) * randomBetween(1.5, 2.0)),
      
      // Dates
      creation_date: randomDate(2015, 2025),
      maturity_date: randomDate(2027, 2050),
      last_payment_date: randomDate(2025, 2026),
      
      // Status
      status: randomChoice(['Active', 'Active', 'Active', 'Partially Discharged', 'Satisfied', 'Foreclosed']),
      
      // Reference
      document_reference: `MORT-${randomInt(10000, 99999)}/${randomDate(2015, 2025).substring(0, 4)}`,
      registration_office: randomChoice(['SRO Chandigarh-I', 'SRO Chandigarh-II', 'SRO Manimajra']),
      
      // Verification
      encumbrance_certificate_no: `EC-CERT-${randomInt(100000, 999999)}`,
      certificate_valid_from: randomDate(2024, 2026),
      certificate_valid_to: randomDate(2026, 2027),
    };
  });
  
  writeJSON('data/essential_layer/encumbrance_records.json', {
    metadata: {
      description: 'Encumbrance and Mortgage Records',
      total_records: records.length,
      date_created: new Date().toISOString(),
    },
    records: records,
  });
  
  console.log(`   ✅ Generated ${records.length} encumbrance records`);
  return records;
}

// ============================================================================
// ESSENTIAL LAYER: ZONING / MASTER PLAN
// ============================================================================

function generateZoning() {
  console.log('🗂️ Generating Essential Layer: Zoning / Master Plan...');
  
  const zones = [
    { name: 'Residential Zone R1', code: 'R1', color: '#4CAF50', type: 'Residential', far: 1.75, maxHeight: 15, groundCoverage: 50 },
    { name: 'Residential Zone R2', code: 'R2', color: '#66BB6A', type: 'Residential', far: 2.5, maxHeight: 21, groundCoverage: 45 },
    { name: 'Commercial Zone C1', code: 'C1', color: '#2196F3', type: 'Commercial', far: 4.0, maxHeight: 45, groundCoverage: 60 },
    { name: 'Commercial Zone C2', code: 'C2', color: '#42A5F5', type: 'Commercial', far: 3.0, maxHeight: 30, groundCoverage: 55 },
    { name: 'Industrial Zone I1', code: 'I1', color: '#FF9800', type: 'Industrial', far: 1.5, maxHeight: 18, groundCoverage: 55 },
    { name: 'Green Belt / Open Space', code: 'G1', color: '#1B5E20', type: 'Green Belt', far: 0.1, maxHeight: 5, groundCoverage: 5 },
    { name: 'Institutional Zone', code: 'IN1', color: '#9C27B0', type: 'Institutional', far: 2.0, maxHeight: 24, groundCoverage: 40 },
    { name: 'Mixed Use Zone', code: 'MU1', color: '#FF5722', type: 'Mixed Use', far: 3.5, maxHeight: 36, groundCoverage: 55 },
    { name: 'Transportation / Utility', code: 'TU1', color: '#607D8B', type: 'Infrastructure', far: 0.5, maxHeight: 12, groundCoverage: 30 },
    { name: 'Heritage / Conservation', code: 'HC1', color: '#795548', type: 'Heritage', far: 0.5, maxHeight: 10, groundCoverage: 25 },
  ];
  
  const features = [];
  
  // Create zone polygons roughly covering Chandigarh sectors
  const zoneAreas = [
    { zone: zones[0], lat: 30.7205, lng: 76.7694, size: 0.015 }, // Sector 34 - Residential
    { zone: zones[1], lat: 30.7175, lng: 76.7794, size: 0.012 }, // Sector 35 - Residential
    { zone: zones[2], lat: 30.7415, lng: 76.7838, size: 0.010 }, // Sector 17 - Commercial
    { zone: zones[3], lat: 30.7335, lng: 76.7794, size: 0.008 }, // Sector 22 - Commercial
    { zone: zones[4], lat: 30.7255, lng: 76.7988, size: 0.010 }, // Sector 26 - Industrial
    { zone: zones[5], lat: 30.7600, lng: 76.7500, size: 0.020 }, // Green belt (north)
    { zone: zones[6], lat: 30.7450, lng: 76.7700, size: 0.010 }, // Institutional (Sector 14 area)
    { zone: zones[7], lat: 30.7290, lng: 76.8175, size: 0.012 }, // Manimajra - Mixed Use
    { zone: zones[8], lat: 30.7350, lng: 76.7600, size: 0.008 }, // Transport corridor
    { zone: zones[9], lat: 30.7520, lng: 76.7850, size: 0.006 }, // Capitol Complex area
  ];
  
  zoneAreas.forEach((za, idx) => {
    const halfSize = za.size;
    const coords = [[
      [za.lng - halfSize, za.lat - halfSize * 0.8],
      [za.lng + halfSize, za.lat - halfSize * 0.8],
      [za.lng + halfSize * 1.1, za.lat + halfSize * 0.9],
      [za.lng - halfSize * 0.9, za.lat + halfSize],
      [za.lng - halfSize, za.lat - halfSize * 0.8],
    ]];
    
    features.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: coords },
      properties: {
        zone_id: `ZONE-${String(idx + 1).padStart(3, '0')}`,
        zone_name: za.zone.name,
        zone_code: za.zone.code,
        zone_type: za.zone.type,
        color: za.zone.color,
        max_far: za.zone.far,
        max_height_meters: za.zone.maxHeight,
        max_ground_coverage_percent: za.zone.groundCoverage,
        permitted_uses: getPermittedUses(za.zone.type),
        prohibited_uses: getProhibitedUses(za.zone.type),
        master_plan_year: 2031,
        notification_date: '2021-06-15',
        authority: 'Chandigarh Administration - Town Planning Wing',
      },
    });
  });
  
  const geojson = {
    type: 'FeatureCollection',
    name: 'Chandigarh_Zoning_MasterPlan',
    metadata: {
      description: 'Zoning / Master Plan for Chandigarh (Mock)',
      master_plan_horizon: '2031',
      authority: 'Chandigarh Administration',
      date_created: new Date().toISOString(),
    },
    features: features,
  };
  
  writeJSON('data/essential_layer/zoning_master_plan.geojson', geojson);
  
  // Also save zone regulations separately
  writeJSON('data/essential_layer/zone_regulations.json', {
    metadata: {
      description: 'Zoning Regulations and Development Control Rules',
      authority: 'Chandigarh Administration - Town Planning Wing',
      date_created: new Date().toISOString(),
    },
    zones: zones.map(z => ({
      ...z,
      permitted_uses: getPermittedUses(z.type),
      prohibited_uses: getProhibitedUses(z.type),
      development_rules: {
        min_plot_size_sqm: z.type === 'Residential' ? 125 : z.type === 'Commercial' ? 200 : 500,
        min_road_width_m: z.type === 'Commercial' ? 18 : z.type === 'Industrial' ? 12 : 9,
        parking_requirement: z.type === 'Commercial' ? '1 ECS per 50 sqm' : '1 ECS per unit',
        rain_water_harvesting: 'Mandatory for plots > 500 sqm',
        solar_panel: 'Mandatory for plots > 500 sqm',
      },
    })),
  });
  
  console.log(`   ✅ Generated ${features.length} zoning areas`);
}

function getPermittedUses(zoneType) {
  const uses = {
    'Residential': ['Detached Housing', 'Row Housing', 'Group Housing', 'Home Office', 'Creche', 'Parks'],
    'Commercial': ['Retail', 'Office', 'Hotel', 'Restaurant', 'Bank', 'Showroom', 'Cinema'],
    'Industrial': ['Light Manufacturing', 'Warehouse', 'Workshop', 'IT Park', 'Data Center'],
    'Green Belt': ['Parks', 'Gardens', 'Playground', 'Nursery', 'Water Body'],
    'Institutional': ['Education', 'Hospital', 'Government Office', 'Library', 'Museum'],
    'Mixed Use': ['Residential', 'Retail', 'Office', 'Restaurant', 'Clinic'],
    'Infrastructure': ['Roads', 'Railway', 'Bus Terminal', 'Utility Station', 'Parking'],
    'Heritage': ['Conservation', 'Museum', 'Cultural Center', 'Low-impact Tourism'],
  };
  return uses[zoneType] || [];
}

function getProhibitedUses(zoneType) {
  const prohibited = {
    'Residential': ['Heavy Industry', 'Hazardous Storage', 'Slaughterhouse', 'Quarrying'],
    'Commercial': ['Heavy Industry', 'Hazardous Storage', 'Mining'],
    'Industrial': ['Residential', 'Hospital', 'School'],
    'Green Belt': ['Construction', 'Commercial', 'Industrial', 'Mining'],
    'Institutional': ['Commercial Retail', 'Industry', 'Residential'],
    'Mixed Use': ['Heavy Industry', 'Hazardous Storage'],
    'Infrastructure': ['Residential', 'Commercial'],
    'Heritage': ['New Construction', 'Industry', 'Commercial beyond stipulated limits'],
  };
  return prohibited[zoneType] || [];
}

// ============================================================================
// USE-CASE LAYER: PROPERTY TAX
// ============================================================================

function generatePropertyTax(parcels) {
  console.log('💰 Generating Use-Case Layer: Property Tax...');
  
  const taxableParcels = parcels.filter(p =>
    ['Residential', 'Commercial', 'Industrial', 'Mixed Use', 'Institutional'].includes(p.properties.land_type)
  );
  
  const records = [];
  
  taxableParcels.forEach((parcel, idx) => {
    const p = parcel.properties;
    
    // Generate 3 years of tax records
    for (let year = 2024; year <= 2026; year++) {
      const assessmentYear = `${year}-${String(year + 1).substring(2)}`;
      
      const annualValue = p.land_type === 'Commercial' ? randomInt(200000, 2000000) :
                         p.land_type === 'Industrial' ? randomInt(150000, 1000000) :
                         p.land_type === 'Residential' ? randomInt(50000, 500000) :
                         randomInt(80000, 800000);
      
      const taxRate = p.land_type === 'Commercial' ? 0.10 :
                     p.land_type === 'Industrial' ? 0.08 :
                     p.land_type === 'Residential' ? 0.05 : 0.07;
      
      const taxAmount = Math.round(annualValue * taxRate);
      const rebate = year < 2026 ? Math.round(taxAmount * 0.10) : 0; // Early payment rebate
      const penalty = Math.random() > 0.8 ? Math.round(taxAmount * 0.18) : 0;
      
      records.push({
        tax_id: `PTAX-${assessmentYear}-${String(records.length + 1).padStart(6, '0')}`,
        ulpin: p.ulpin,
        plot_id: p.plot_id,
        assessment_year: assessmentYear,
        
        property_category: p.land_type,
        property_sub_category: p.land_type === 'Residential' ? randomChoice(['Self-occupied', 'Rented', 'Vacant']) :
                              p.land_type === 'Commercial' ? randomChoice(['Shop', 'Office', 'Godown']) :
                              'General',
        
        // Valuation
        annual_rateable_value: annualValue,
        carpet_area_sqm: Math.round(p.area_sq_meters * randomBetween(0.4, 0.8)),
        
        // Tax computation
        tax_rate_percent: parseFloat((taxRate * 100).toFixed(1)),
        property_tax: taxAmount,
        education_cess: Math.round(taxAmount * 0.02),
        water_tax: randomInt(500, 5000),
        sewerage_tax: randomInt(300, 3000),
        fire_tax: randomInt(200, 1000),
        total_tax: taxAmount + Math.round(taxAmount * 0.02) + randomInt(1000, 9000),
        
        rebate: rebate,
        penalty: penalty,
        net_payable: taxAmount - rebate + penalty,
        
        // Payment
        payment_status: year < 2026 ? randomChoice(['Paid', 'Paid', 'Paid', 'Partially Paid']) :
                       randomChoice(['Paid', 'Pending', 'Pending', 'Partially Paid']),
        payment_date: year < 2026 ? randomDate(year, year) : (Math.random() > 0.4 ? randomDate(2026, 2026) : null),
        payment_mode: randomChoice(['Online', 'Online', 'Bank Challan', 'Cash Counter']),
        receipt_number: `REC-${randomInt(100000, 999999)}`,
        
        arrears: penalty > 0 ? randomInt(1000, 50000) : 0,
        
        // Owner
        owner_name: p.owner_name,
        sector: p.sector,
        
        // Municipal
        ward_number: randomInt(1, 26),
        zone: randomChoice(['Zone-I', 'Zone-II', 'Zone-III', 'Zone-IV']),
        municipal_authority: 'Municipal Corporation Chandigarh',
      });
    }
  });
  
  writeJSON('data/usecase_layer/property_tax.json', {
    metadata: {
      description: 'Property Tax Assessment and Collection Records',
      assessment_years: ['2024-25', '2025-26', '2026-27'],
      total_records: records.length,
      municipal_authority: 'Municipal Corporation Chandigarh',
      date_created: new Date().toISOString(),
    },
    records: records,
  });
  
  console.log(`   ✅ Generated ${records.length} property tax records`);
  return records;
}

// ============================================================================
// USE-CASE LAYER: CIRCLE RATES / VALUATION
// ============================================================================

function generateCircleRates() {
  console.log('📊 Generating Use-Case Layer: Circle Rates...');
  
  const circleRates = CONFIG.sectors.map(sector => ({
    sector: sector.name,
    description: sector.description,
    rates: {
      residential: {
        rate_per_sqm: sector.name === 'Sector 17' ? 95000 :
                     sector.name === 'Sector 22' ? 85000 :
                     sector.name === 'Manimajra' ? 45000 :
                     sector.name === 'Dhanas' ? 30000 :
                     randomInt(50000, 80000),
        rate_per_sqyd: null, // Will be calculated
        unit: 'INR per sq. meter',
      },
      commercial: {
        rate_per_sqm: sector.name === 'Sector 17' ? 180000 :
                     sector.name === 'Sector 22' ? 150000 :
                     sector.name === 'Manimajra' ? 80000 :
                     sector.name === 'Dhanas' ? 40000 :
                     randomInt(90000, 130000),
        unit: 'INR per sq. meter',
      },
      industrial: {
        rate_per_sqm: sector.name === 'Sector 26' ? 65000 : randomInt(35000, 55000),
        unit: 'INR per sq. meter',
      },
      agricultural: {
        rate_per_acre: sector.name === 'Dhanas' ? 5000000 : randomInt(3000000, 8000000),
        unit: 'INR per acre',
      },
    },
    effective_date: '2025-04-01',
    valid_till: '2026-03-31',
    notification_number: `DC/CR/${randomInt(100, 999)}/2025`,
    authority: 'Deputy Commissioner, Chandigarh',
  }));
  
  // Fill in sqyd rates
  circleRates.forEach(cr => {
    cr.rates.residential.rate_per_sqyd = Math.round(cr.rates.residential.rate_per_sqm * 0.8361);
    cr.rates.commercial.rate_per_sqyd = Math.round(cr.rates.commercial.rate_per_sqm * 0.8361);
  });
  
  writeJSON('data/usecase_layer/circle_rates.json', {
    metadata: {
      description: 'Circle Rates / Collector Rates for Property Valuation',
      city: CONFIG.pilot.city,
      state: CONFIG.pilot.state,
      financial_year: '2025-26',
      authority: 'Deputy Commissioner, Chandigarh',
      date_created: new Date().toISOString(),
    },
    circle_rates: circleRates,
  });
  
  console.log(`   ✅ Generated circle rates for ${circleRates.length} sectors`);
}

// ============================================================================
// USE-CASE LAYER: ENVIRONMENTAL RESTRICTION ZONES
// ============================================================================

function generateEnvironmentalZones() {
  console.log('🌳 Generating Use-Case Layer: Environmental Zones...');
  
  const zones = [
    {
      name: 'Sukhna Lake Buffer Zone',
      type: 'Water Body Buffer',
      lat: 30.7425, lng: 76.8110,
      radius: 0.012,
      restrictions: ['No Construction within 200m', 'No Industrial Discharge', 'No Commercial Activity'],
      authority: 'Chandigarh Pollution Control Committee',
    },
    {
      name: 'Sukhna Wildlife Sanctuary',
      type: 'Protected Forest',
      lat: 30.7650, lng: 76.8250,
      radius: 0.020,
      restrictions: ['No Construction', 'No Mining', 'No Encroachment', 'Wildlife Protection Act applies'],
      authority: 'Chief Wildlife Warden, Chandigarh',
    },
    {
      name: 'Leisure Valley Green Corridor',
      type: 'Green Corridor',
      lat: 30.7350, lng: 76.7750,
      radius: 0.008,
      restrictions: ['No Permanent Construction', 'Open Space Preservation', 'Only Parks and Gardens'],
      authority: 'Chandigarh Administration - Engineering Wing',
    },
    {
      name: 'Capitol Complex Heritage Zone',
      type: 'UNESCO Heritage Buffer',
      lat: 30.7570, lng: 76.8020,
      radius: 0.007,
      restrictions: ['Height Restriction 15m', 'Architectural Review Required', 'No Demolition Without Permission'],
      authority: 'Chandigarh Heritage Conservation Committee',
    },
    {
      name: 'N-Choe Flood Plain',
      type: 'Flood Zone',
      lat: 30.7100, lng: 76.8100,
      radius: 0.010,
      restrictions: ['No Permanent Habitation', 'Flood-resistant Construction Only', 'Mandatory Insurance'],
      authority: 'District Disaster Management Authority',
    },
    {
      name: 'Airport Noise Zone',
      type: 'Noise Restriction Zone',
      lat: 30.6735, lng: 76.7885,
      radius: 0.015,
      restrictions: ['Noise Insulation Required', 'Height Restriction', 'No Schools/Hospitals in Inner Zone'],
      authority: 'Airports Authority of India',
    },
  ];
  
  const features = zones.map((zone, idx) => {
    // Create a rough circle polygon
    const points = 24;
    const coords = [];
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      coords.push([
        zone.lng + zone.radius * Math.cos(angle) * (1 + randomBetween(-0.05, 0.05)),
        zone.lat + zone.radius * 0.8 * Math.sin(angle) * (1 + randomBetween(-0.05, 0.05)),
      ]);
    }
    coords[coords.length - 1] = [...coords[0]]; // Close polygon
    
    return {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [coords] },
      properties: {
        zone_id: `ENV-${String(idx + 1).padStart(3, '0')}`,
        zone_name: zone.name,
        zone_type: zone.type,
        restrictions: zone.restrictions,
        authority: zone.authority,
        notification_date: randomDate(2015, 2023),
        buffer_distance_meters: zone.type.includes('Buffer') ? randomInt(100, 500) : null,
        severity: zone.type === 'Protected Forest' ? 'Critical' :
                 zone.type === 'Flood Zone' ? 'High' :
                 zone.type === 'UNESCO Heritage Buffer' ? 'High' : 'Medium',
        color: zone.type === 'Protected Forest' ? '#1B5E20' :
              zone.type === 'Water Body Buffer' ? '#0D47A1' :
              zone.type === 'Flood Zone' ? '#E65100' :
              zone.type === 'Green Corridor' ? '#33691E' :
              zone.type === 'UNESCO Heritage Buffer' ? '#4A148C' :
              '#455A64',
      },
    };
  });
  
  writeJSON('data/usecase_layer/environmental_zones.geojson', {
    type: 'FeatureCollection',
    name: 'Environmental_Restriction_Zones',
    metadata: {
      description: 'Environmental and Restriction Zones for Chandigarh',
      total_zones: features.length,
      date_created: new Date().toISOString(),
    },
    features: features,
  });
  
  console.log(`   ✅ Generated ${features.length} environmental zones`);
}

// ============================================================================
// USE-CASE LAYER: DISPUTE / COURT RECORDS
// ============================================================================

function generateDisputeRecords(parcels) {
  console.log('⚖️ Generating Use-Case Layer: Dispute Records...');
  
  const disputedParcels = parcels.filter(() => Math.random() > 0.85); // ~15% have disputes
  
  const disputeTypes = [
    'Ownership Dispute', 'Boundary Dispute', 'Inheritance Dispute',
    'Encroachment', 'Title Dispute', 'Partition Suit',
    'Mutation Objection', 'Eviction Suit', 'Specific Performance',
  ];
  
  const courts = [
    'District Court, Chandigarh',
    'Civil Judge (Senior Division), Chandigarh',
    'Civil Judge (Junior Division), Chandigarh',
    'Revenue Court, Chandigarh',
    'High Court of Punjab & Haryana',
    'Lok Adalat, Chandigarh',
    'Consumer Forum, Chandigarh',
  ];
  
  const records = disputedParcels.map((parcel, idx) => {
    const p = parcel.properties;
    
    return {
      case_id: `CASE-${CONFIG.pilot.stateCode}-${String(idx + 1).padStart(5, '0')}`,
      ulpin: p.ulpin,
      plot_id: p.plot_id,
      khasra_no: p.khasra_no,
      
      // Case details
      dispute_type: randomChoice(disputeTypes),
      case_number: `CS-${randomInt(100, 9999)}/${randomInt(2018, 2026)}`,
      court: randomChoice(courts),
      
      // Parties
      petitioner: randomName(),
      respondent: p.owner_name,
      petitioner_advocate: `Adv. ${randomName()}`,
      respondent_advocate: `Adv. ${randomName()}`,
      
      // Dates
      filing_date: randomDate(2018, 2025),
      next_hearing_date: randomDate(2026, 2027),
      last_hearing_date: randomDate(2025, 2026),
      
      // Status
      status: randomChoice(['Pending', 'Pending', 'Under Hearing', 'Under Hearing', 'Stay Order', 'Disposed', 'Settled']),
      stay_order: Math.random() > 0.7,
      priority: randomChoice(['Normal', 'Normal', 'High', 'Urgent']),
      
      // Details
      dispute_description: `Dispute regarding ${randomChoice(['ownership', 'boundary', 'possession', 'title', 'partition'])} of property at ${p.sector}, ${p.city}`,
      relief_sought: randomChoice([
        'Declaration of ownership',
        'Demarcation of boundary',
        'Injunction against construction',
        'Partition of property',
        'Recovery of possession',
        'Cancellation of registration',
      ]),
      
      // Impact
      affects_transfer: Math.random() > 0.4,
      affects_mutation: Math.random() > 0.5,
      affects_construction: Math.random() > 0.6,
      
      // Orders
      interim_orders: Math.random() > 0.5 ? [
        {
          order_date: randomDate(2024, 2026),
          order_type: randomChoice(['Stay', 'Status Quo', 'Injunction', 'Notice']),
          order_details: 'Parties directed to maintain status quo till next hearing.',
        },
      ] : [],
    };
  });
  
  writeJSON('data/usecase_layer/dispute_records.json', {
    metadata: {
      description: 'Land Dispute and Court Case Records',
      total_records: records.length,
      jurisdiction: 'Chandigarh',
      date_created: new Date().toISOString(),
    },
    records: records,
  });
  
  console.log(`   ✅ Generated ${records.length} dispute records`);
}

// ============================================================================
// USE-CASE LAYER: INFRASTRUCTURE LAYERS (Mock)
// ============================================================================

function generateInfrastructureLayers() {
  console.log('🛣️ Generating Use-Case Layer: Infrastructure Layers...');
  
  // Roads
  const roads = {
    type: 'FeatureCollection',
    name: 'Chandigarh_Road_Network',
    metadata: {
      description: 'Major road network of Chandigarh (simplified mock)',
      source: 'Generated for prototype. Use OSM Overpass Turbo for real data.',
      note: 'For real data: Use https://overpass-turbo.eu/ with query: way["highway"](bbox) for Chandigarh',
      date_created: new Date().toISOString(),
    },
    features: [
      createRoadFeature('Madhya Marg', 'primary', [[76.7500, 30.7350], [76.7700, 30.7350], [76.7900, 30.7350], [76.8100, 30.7350]]),
      createRoadFeature('Dakshin Marg', 'primary', [[76.7500, 30.7200], [76.7700, 30.7200], [76.7900, 30.7200], [76.8100, 30.7200]]),
      createRoadFeature('Uttar Marg', 'primary', [[76.7500, 30.7500], [76.7700, 30.7500], [76.7900, 30.7500], [76.8100, 30.7500]]),
      createRoadFeature('Jan Marg (V1)', 'trunk', [[76.7800, 30.7100], [76.7800, 30.7300], [76.7800, 30.7500], [76.7800, 30.7700]]),
      createRoadFeature('Himalaya Marg (V2)', 'secondary', [[76.7700, 30.7100], [76.7700, 30.7300], [76.7700, 30.7500]]),
      createRoadFeature('Sector 17 Internal Road', 'tertiary', [[76.7790, 30.7390], [76.7790, 30.7440], [76.7860, 30.7440], [76.7860, 30.7390]]),
      createRoadFeature('IT Park Road', 'secondary', [[76.7750, 30.7150], [76.7850, 30.7150], [76.7850, 30.7200]]),
      createRoadFeature('Chandigarh-Ambala Highway', 'motorway', [[76.7400, 30.7300], [76.7200, 30.7400], [76.7000, 30.7500]]),
      createRoadFeature('Chandigarh-Panchkula Road', 'primary', [[76.8100, 30.7350], [76.8300, 30.7350], [76.8500, 30.7350]]),
    ],
  };
  
  // Water bodies
  const waterBodies = {
    type: 'FeatureCollection',
    name: 'Chandigarh_Water_Bodies',
    metadata: {
      description: 'Water bodies in Chandigarh area',
      date_created: new Date().toISOString(),
    },
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [76.8050, 30.7400], [76.8150, 30.7380], [76.8200, 30.7420],
            [76.8180, 30.7480], [76.8100, 30.7500], [76.8050, 30.7460],
            [76.8050, 30.7400],
          ]],
        },
        properties: { name: 'Sukhna Lake', type: 'Lake', area_hectares: 160, status: 'Protected' },
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [76.7700, 30.7550], [76.7720, 30.7540], [76.7740, 30.7555],
            [76.7730, 30.7570], [76.7710, 30.7565], [76.7700, 30.7550],
          ]],
        },
        properties: { name: 'Rose Garden Lake', type: 'Artificial Lake', area_hectares: 5, status: 'Public' },
      },
    ],
  };
  
  // Utility Infrastructure
  const utilities = {
    type: 'FeatureCollection',
    name: 'Chandigarh_Utility_Infrastructure',
    metadata: {
      description: 'Utility infrastructure points (electricity, water, sewerage)',
      date_created: new Date().toISOString(),
    },
    features: [
      createUtilityPoint('Sector 17 Electricity Sub-station', 'Electricity', 30.7420, 76.7850),
      createUtilityPoint('Sector 26 Water Treatment Plant', 'Water Supply', 30.7260, 76.7990),
      createUtilityPoint('Sector 34 Sewerage Pumping Station', 'Sewerage', 30.7210, 76.7700),
      createUtilityPoint('Sector 22 Gas Metering Station', 'Gas', 30.7340, 76.7800),
      createUtilityPoint('Manimajra Power Grid', 'Electricity', 30.7300, 76.8180),
      createUtilityPoint('Sector 39 Water Reservoir', 'Water Supply', 30.7150, 76.7650),
      createUtilityPoint('IT Park Power Sub-station', 'Electricity', 30.7180, 76.7800),
      createUtilityPoint('Dhanas Solar Farm', 'Renewable Energy', 30.7510, 76.7610),
      createUtilityPoint('Sector 26 Waste Processing', 'Solid Waste', 30.7240, 76.8020),
      createUtilityPoint('Main Telecom Exchange', 'Telecom', 30.7400, 76.7830),
    ],
  };
  
  writeJSON('data/usecase_layer/roads.geojson', roads);
  writeJSON('data/usecase_layer/water_bodies.geojson', waterBodies);
  writeJSON('data/usecase_layer/utility_infrastructure.geojson', utilities);
  
  console.log(`   ✅ Generated ${roads.features.length} road segments`);
  console.log(`   ✅ Generated ${waterBodies.features.length} water bodies`);
  console.log(`   ✅ Generated ${utilities.features.length} utility points`);
}

function createRoadFeature(name, roadType, coords) {
  return {
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: coords },
    properties: {
      name: name,
      road_type: roadType,
      lanes: roadType === 'motorway' ? 6 : roadType === 'trunk' ? 4 : roadType === 'primary' ? 4 : 2,
      surface: 'asphalt',
      width_meters: roadType === 'motorway' ? 30 : roadType === 'trunk' ? 24 : roadType === 'primary' ? 18 : 9,
      speed_limit_kmph: roadType === 'motorway' ? 80 : roadType === 'trunk' ? 60 : 40,
      maintained_by: 'Chandigarh Administration - Engineering Wing',
    },
  };
}

function createUtilityPoint(name, type, lat, lng) {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lng, lat] },
    properties: {
      name: name,
      utility_type: type,
      status: randomChoice(['Operational', 'Operational', 'Operational', 'Under Maintenance']),
      capacity: `${randomInt(50, 500)} units`,
      operator: type === 'Electricity' ? 'UT Chandigarh Electricity Dept' :
               type === 'Water Supply' ? 'MC Chandigarh Water Division' :
               type === 'Telecom' ? 'BSNL' :
               'MC Chandigarh',
      commissioned_date: randomDate(1990, 2020),
    },
  };
}

// ============================================================================
// SCHEMAS
// ============================================================================

function generateSchemas() {
  console.log('📄 Generating Data Schemas...');
  
  const schemas = {
    description: 'Land Stack Data Schema Documentation',
    version: '1.0',
    date_created: new Date().toISOString(),
    schemas: {
      cadastral_parcel: {
        description: 'Georeferenced cadastral parcel with ownership info',
        format: 'GeoJSON Feature',
        required_fields: ['ulpin', 'plot_id', 'khasra_no', 'owner_name', 'land_type', 'area_sq_meters'],
        geometry_type: 'Polygon',
        crs: 'EPSG:4326 (WGS 84)',
        fields: {
          ulpin: { type: 'string', format: 'XX-XX-XXXXXXXX-XX', description: 'Unique Land Parcel Identification Number' },
          plot_id: { type: 'string', description: 'System-generated plot identifier' },
          khasra_no: { type: 'string', description: 'Revenue survey number (Khasra/Survey No)' },
          khata_no: { type: 'string', description: 'Khata/Account number' },
          survey_no: { type: 'string', description: 'Survey number' },
          owner_name: { type: 'string', description: 'Current registered owner' },
          father_name: { type: 'string', description: 'Father/Husband name' },
          owner_type: { type: 'enum', values: ['Individual', 'Joint', 'Government', 'Trust', 'Company'] },
          land_type: { type: 'enum', values: ['Residential', 'Commercial', 'Agricultural', 'Industrial', 'Institutional', 'Mixed Use', 'Green Belt'] },
          area_sq_meters: { type: 'number', description: 'Area in square meters' },
          verification_status: { type: 'enum', values: ['Verified', 'Pending', 'Under Review'] },
          aadhaar_linked: { type: 'boolean', description: 'Whether Aadhaar is linked to this record' },
        },
      },
      record_of_rights: {
        description: 'RoR / Jamabandi / Khatauni record',
        format: 'JSON',
        required_fields: ['ror_id', 'ulpin', 'owner_name', 'area_acres', 'land_type'],
        key_field: 'ulpin',
      },
      registration_record: {
        description: 'Property registration / transaction record',
        format: 'JSON',
        required_fields: ['registration_id', 'ulpin', 'transaction_type', 'consideration_amount', 'registration_date'],
        key_field: 'ulpin',
      },
      building_permission: {
        description: 'Building approval / construction permit',
        format: 'JSON',
        required_fields: ['permission_id', 'ulpin', 'building_type', 'status'],
        key_field: 'ulpin',
      },
      encumbrance_record: {
        description: 'Mortgage / lien / encumbrance record',
        format: 'JSON',
        required_fields: ['encumbrance_id', 'ulpin', 'encumbrance_type', 'status'],
        key_field: 'ulpin',
      },
      property_tax: {
        description: 'Municipal property tax assessment',
        format: 'JSON',
        required_fields: ['tax_id', 'ulpin', 'assessment_year', 'total_tax', 'payment_status'],
        key_field: 'ulpin',
      },
    },
    common_identifier: {
      field: 'ulpin',
      description: 'All datasets are linked through ULPIN (Unique Land Parcel Identification Number)',
      format: 'XX-XX-XXXXXXXX-XX (State-District-Parcel-Check)',
    },
    interoperability: {
      spatial_format: 'GeoJSON (RFC 7946)',
      coordinate_system: 'WGS 84 (EPSG:4326)',
      encoding: 'UTF-8',
      api_standards: 'REST API with JSON responses',
      ogc_standards: ['WMS 1.3.0', 'WFS 2.0', 'WMTS 1.0'],
    },
  };
  
  writeJSON('data/schemas/data_schemas.json', schemas);
  console.log('   ✅ Generated data schema documentation');
}

// ============================================================================
// REFERENCE DATA
// ============================================================================

function generateReferenceData() {
  console.log('📚 Generating Reference Data...');
  
  // Data sources reference
  const dataSources = {
    description: 'Reference guide for real data sources applicable to Land Stack',
    date_created: new Date().toISOString(),
    real_data_sources: {
      administrative_boundaries: {
        source: 'Survey of India Online Maps Portal',
        url: 'https://onlinemaps.surveyofindia.gov.in/',
        data_available: ['State Boundaries', 'District Boundaries', 'Sub-district Boundaries', 'Village Boundaries'],
        format: 'Shapefile',
        access: 'Free (Registration Required)',
        status: 'Already downloaded (State/District/Sub-district PAN India)',
      },
      village_boundaries_alternative: {
        source: 'DataMeet Community',
        urls: {
          maps: 'https://github.com/datameet/maps',
          villages: 'https://github.com/datameet/indian_village_boundaries',
        },
        format: 'GeoJSON / Shapefile',
        access: 'Free (Open License)',
      },
      land_use_land_cover: {
        source: 'ISRO Bhuvan',
        urls: {
          thematic: 'https://bhuvan-app1.nrsc.gov.in/thematic/',
          wms: 'https://bhuvan-vec2.nrsc.gov.in/bhuvan/wms',
          noeda: 'https://bhuvan-noeda.nrsc.gov.in/',
        },
        data_available: ['LULC 1:10K', 'LULC 1:50K', 'LULC 1:250K', 'Satellite Imagery'],
        format: 'GeoTIFF / WMS',
        access: 'Free (Registration Required)',
      },
      osm_infrastructure: {
        source: 'OpenStreetMap',
        urls: {
          overpass_turbo: 'https://overpass-turbo.eu/',
          geofabrik: 'https://download.geofabrik.de/asia/india.html',
        },
        data_available: ['Roads', 'Buildings', 'Water Bodies', 'POIs', 'Railways', 'Landuse'],
        format: 'GeoJSON / PBF / Shapefile',
        access: 'Free (ODbL)',
      },
      land_records_portals: {
        chandigarh: {
          land_stack: 'https://landstack.chd.gov.in',
          bhunaksha: 'https://bhunaksha.chd.gov.in',
          description: 'Official Land Stack pilot portal',
        },
        tamil_nadu: {
          tamilnilam: 'https://tamilnilam.tn.gov.in',
          eservices: 'https://eservices.tn.gov.in/eservicesnew/',
          description: 'Tamil Nadu land records portal',
        },
        national: {
          dilrmp: 'https://dilrmp.gov.in/',
          dolr: 'https://dolr.gov.in/',
          description: 'National DILRMP dashboard and DoLR portal',
        },
      },
      basemap_tiles: {
        openstreetmap: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        esri_satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        esri_topo: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        carto_dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        carto_light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        bhuvan_wms: 'https://bhuvan-vec2.nrsc.gov.in/bhuvan/wms',
      },
      additional: {
        india_geodata: 'https://indiageodata.in/',
        geoboundaries: 'https://www.geoboundaries.org/',
        shrug: 'https://www.devdatalab.org/shrug',
        data_gov_in: 'https://data.gov.in/',
        geojson_editor: 'https://geojson.io/',
      },
    },
    overpass_queries: {
      description: 'Ready-to-use Overpass Turbo queries for Chandigarh',
      chandigarh_bbox: '30.65,76.72,30.78,76.85',
      queries: {
        all_buildings: `[out:json][timeout:120];\n(\n  way["building"](30.65,76.72,30.78,76.85);\n  relation["building"](30.65,76.72,30.78,76.85);\n);\nout geom;`,
        all_roads: `[out:json][timeout:120];\n(\n  way["highway"](30.65,76.72,30.78,76.85);\n);\nout geom;`,
        water_bodies: `[out:json][timeout:60];\n(\n  way["natural"="water"](30.65,76.72,30.78,76.85);\n  relation["natural"="water"](30.65,76.72,30.78,76.85);\n);\nout geom;`,
        government_buildings: `[out:json][timeout:60];\n(\n  way["building"="government"](30.65,76.72,30.78,76.85);\n  node["amenity"="townhall"](30.65,76.72,30.78,76.85);\n);\nout geom;`,
        schools_hospitals: `[out:json][timeout:60];\n(\n  node["amenity"="school"](30.65,76.72,30.78,76.85);\n  node["amenity"="hospital"](30.65,76.72,30.78,76.85);\n  way["amenity"="school"](30.65,76.72,30.78,76.85);\n  way["amenity"="hospital"](30.65,76.72,30.78,76.85);\n);\nout geom;`,
      },
    },
  };
  
  writeJSON('data/reference/data_sources.json', dataSources);
  console.log('   ✅ Generated data sources reference');
}

// ============================================================================
// FILE WRITER
// ============================================================================

function writeJSON(relativePath, data) {
  const fullPath = path.join(__dirname, '..', relativePath);
  const dir = path.dirname(fullPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf8');
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Land Stack - Data Generator | SIH 2026 | PS #26014 ║');
  console.log('║   Pilot Area: Chandigarh, India                      ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  
  // ---- BASE LAYER ----
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🗺️  BASE LAYER');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const parcels = generateBaseLayer();
  
  // ---- ESSENTIAL LAYER ----
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋  ESSENTIAL LAYER');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  generateRoR(parcels);
  generateRegistrationRecords(parcels);
  generateBuildingPermissions(parcels);
  generateEncumbranceRecords(parcels);
  generateZoning();
  
  // ---- USE-CASE LAYER ----
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔧  USE-CASE LAYER');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  generatePropertyTax(parcels);
  generateCircleRates();
  generateEnvironmentalZones();
  generateDisputeRecords(parcels);
  generateInfrastructureLayers();
  
  // ---- SCHEMAS & REFERENCE ----
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📄  SCHEMAS & REFERENCE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  generateSchemas();
  generateReferenceData();
  
  // ---- SUMMARY ----
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   ✅ ALL DATA GENERATED SUCCESSFULLY!                 ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log('║   📁 data/base_layer/                                 ║');
  console.log('║      • cadastral_parcels.geojson                      ║');
  console.log('║      • ulpin_index.json                               ║');
  console.log('║   📁 data/essential_layer/                            ║');
  console.log('║      • record_of_rights.json                          ║');
  console.log('║      • registration_records.json                      ║');
  console.log('║      • building_permissions.json                      ║');
  console.log('║      • encumbrance_records.json                       ║');
  console.log('║      • zoning_master_plan.geojson                     ║');
  console.log('║      • zone_regulations.json                          ║');
  console.log('║   📁 data/usecase_layer/                              ║');
  console.log('║      • property_tax.json                              ║');
  console.log('║      • circle_rates.json                              ║');
  console.log('║      • environmental_zones.geojson                    ║');
  console.log('║      • dispute_records.json                           ║');
  console.log('║      • roads.geojson                                  ║');
  console.log('║      • water_bodies.geojson                           ║');
  console.log('║      • utility_infrastructure.geojson                 ║');
  console.log('║   📁 data/schemas/                                    ║');
  console.log('║      • data_schemas.json                              ║');
  console.log('║   📁 data/reference/                                  ║');
  console.log('║      • data_sources.json                              ║');
  console.log('╚════════════════════════════════════════════════════════╝');
}

main();
