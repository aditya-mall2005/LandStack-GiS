require('dotenv').config();
const { Client } = require('pg');

async function main() {
  let connStr = process.env.DATABASE_URL || "";
  if (connStr.includes(":5432")) {
    connStr = connStr.replace(":5432", ":6543");
  }

  const client = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to PostgreSQL PostGIS database.');

  try {
    console.log('1. TRUNCATING all old tables...');
    await client.query(`
      TRUNCATE TABLE 
        land.data_conflicts,
        governance.disputes,
        governance.property_tax,
        governance.building_permissions,
        governance.encumbrances,
        governance.registrations,
        land.ror_records,
        land.parcel_ownership,
        gis.parcel_identifiers,
        gis.parcels,
        land.owners
      CASCADE;
    `);
    console.log('✓ All old tables truncated.');

    console.log('2. Inserting authentic owners...');
    const ownerRes = await client.query(`
      INSERT INTO land.owners (name, owner_type, identifier_ref, father_husband, source_system)
      VALUES 
        ('Rahul Kumar Singh', 'Individual', 'AADHAAR-8921', 'S/o Shri Raghunath Singh', 'Bihar Bhumi'),
        ('Suresh Prasad', 'Individual', 'AADHAAR-4412', 'S/o Shri Gauri Shankar Prasad', 'Bihar Bhumi'),
        ('Birendra Kumar', 'Individual', 'AADHAAR-7733', 'S/o Shri Muneshwar Mahto', 'Bihar Bhumi'),
        ('Ramesh Kumar Sharma', 'Individual', 'AADHAAR-1928', 'S/o Shri Ramswaroop Sharma', 'Bihar Bhumi'),
        ('Smt. Geeta Devi', 'Individual', 'AADHAAR-6644', 'W/o Late Suresh Jha', 'Bihar Bhumi'),
        ('Md. Aslam Ansari', 'Individual', 'AADHAAR-3399', 'S/o Shri Noor Ansari', 'Bihar Bhumi'),
        ('Sunil Kumar Verma', 'Individual', 'AADHAAR-5511', 'S/o Shri Kedarnath Verma', 'Bihar Bhumi'),
        ('Ashok Tiwari & Brothers', 'Joint', 'PAN-ATW8892', 'S/o Late Pt. Radhey Shyam Tiwari', 'Bihar Bhumi'),
        ('Smt. Sunita Kumari', 'Individual', 'AADHAAR-2288', 'D/o Shri Birendra Yadav', 'Bihar Bhumi'),
        ('Mithila Agro Producers Ltd.', 'Company', 'CIN-U01100BR2018PTC0382', 'Rep. by Director Manoj Jha', 'MCA Bihar'),
        ('State of Bihar (Revenue Dept)', 'Government', 'GOV-BR-REV-001', 'Collectorate Madhubani', 'Govt of Bihar'),
        ('Gram Panchayat Arghawa', 'Government', 'GP-BR-ARGH-33', 'Mukhiya / Panchayat Sachiv', 'Panchayati Raj')
      RETURNING owner_id, name
    `);
    const ownerList = ownerRes.rows;
    console.log(`✓ Inserted ${ownerList.length} owners.`);

    console.log('3. Calculating authentic farm field parcel geometries...');
    const centerLng = 86.1195;
    const centerLat = 26.3600;
    const spanLng = 0.0170;
    const spanLat = 0.0190;

    const minLng = centerLng - spanLng / 2;
    const maxLng = centerLng + spanLng / 2;
    const minLat = centerLat - spanLat / 2;
    const maxLat = centerLat + spanLat / 2;

    function isInsideVillage(lng, lat) {
      const nx = (lng - centerLng) / (spanLng * 0.48);
      const ny = (lat - centerLat) / (spanLat * 0.48);
      const angle = Math.atan2(ny, nx);
      const dist = Math.sqrt(nx * nx + ny * ny);
      const maxR = 1.0 + 0.15 * Math.sin(angle * 3 + 0.8) + 0.1 * Math.cos(angle * 5 - 1.2);
      return dist <= maxR;
    }

    const SECTOR_GRID_R = 5;
    const SECTOR_GRID_C = 6;
    const secDLng = spanLng / SECTOR_GRID_C;
    const secDLat = spanLat / SECTOR_GRID_R;

    const sectors = [];
    for (let sr = 0; sr < SECTOR_GRID_R; sr++) {
      for (let sc = 0; sc < SECTOR_GRID_C; sc++) {
        const sMinLng = minLng + sc * secDLng;
        const sMaxLng = sMinLng + secDLng;
        const sMaxLat = maxLat - sr * secDLat;
        const sMinLat = sMaxLat - secDLat;

        const roadMarginX = (sc === 2 || sc === 4) ? secDLng * 0.035 : secDLng * 0.005;
        const roadMarginY = (sr === 2) ? secDLat * 0.035 : secDLat * 0.005;

        sectors.push({
          minX: sMinLng + roadMarginX,
          maxX: sMaxLng - roadMarginX,
          minY: sMinLat + roadMarginY,
          maxY: sMaxLat - roadMarginY,
        });
      }
    }

    const rawPlots = [];
    function partitionBox(box, depth) {
      const width = box.maxX - box.minX;
      const height = box.maxY - box.minY;
      const minPlotDim = 0.0006;

      if (depth >= 3 || (depth >= 1 && Math.random() > 0.55) || width < minPlotDim * 1.5 || height < minPlotDim * 1.5) {
        rawPlots.push(box);
        return;
      }

      const splitVertically = width > height ? (Math.random() > 0.25) : (Math.random() > 0.75);
      const splitRatio = 0.40 + Math.random() * 0.20;

      if (splitVertically) {
        const splitX = box.minX + width * splitRatio;
        partitionBox({ minX: box.minX, maxX: splitX, minY: box.minY, maxY: box.maxY }, depth + 1);
        partitionBox({ minX: splitX, maxX: box.maxX, minY: box.minY, maxY: box.maxY }, depth + 1);
      } else {
        const splitY = box.minY + height * splitRatio;
        partitionBox({ minX: box.minX, maxX: box.maxX, minY: box.minY, maxY: splitY }, depth + 1);
        partitionBox({ minX: box.minX, maxX: box.maxX, minY: splitY, maxY: box.maxY }, depth + 1);
      }
    }

    sectors.forEach(sec => partitionBox(sec, 0));
    console.log(`Generated ${rawPlots.length} raw field blocks.`);

    function jitterVertex(lng, lat) {
      const jx = (Math.sin(lng * 9123.3 + lat * 4321.7) - 0.5) * 0.00002;
      const jy = (Math.cos(lat * 8219.9 - lng * 5143.1) - 0.5) * 0.00002;
      return [
        parseFloat((lng + jx).toFixed(7)),
        parseFloat((lat + jy).toFixed(7))
      ];
    }

    let surveyCounter = 1001;
    let validCount = 0;
    const conflictSurveys = new Set(["1032", "1053", "1065", "1082"]);

    for (let i = 0; i < rawPlots.length; i++) {
      const p = rawPlots[i];
      const cX = (p.minX + p.maxX) / 2;
      const cY = (p.minY + p.maxY) / 2;

      if (!isInsideVillage(cX, cY)) continue;

      const surveyNo = (surveyCounter++).toString();
      const ulpin = `IN-BR-PTN-000${surveyNo}`;
      const isConflict = conflictSurveys.has(surveyNo);

      let landType = "Agricultural";
      const distFromCenter = Math.sqrt(Math.pow((cX - centerLng) / spanLng, 2) + Math.pow((cY - centerLat) / spanLat, 2));

      if (surveyNo === "1051" || (distFromCenter < 0.15 && Math.random() > 0.5)) {
        landType = "Residential";
      } else if (distFromCenter < 0.12 && Math.random() > 0.6) {
        landType = "Commercial";
      } else if (cX < centerLng - spanLng * 0.35 && cY > centerLat && Math.random() > 0.7) {
        landType = "Government Land";
      } else if (distFromCenter > 0.42 && Math.random() > 0.6) {
        landType = "Forest";
      }

      const vTL = jitterVertex(p.minX, p.maxY);
      const vTR = jitterVertex(p.maxX, p.maxY);
      const vBR = jitterVertex(p.maxX, p.minY);
      const vBL = jitterVertex(p.minX, p.minY);

      if (isConflict) {
        vTR[0] += 0.00012;
        vBR[0] += 0.00012;
      }

      const polygonCoords = [[vTL, vTR, vBR, vBL, vTL]];
      const widthM = (Math.abs(p.maxX - p.minX) * 111320 * Math.cos(cY * Math.PI / 180));
      const heightM = (Math.abs(p.maxY - p.minY) * 111320);
      const areaSqm = Math.max(600, Math.round(widthM * heightM));

      const geomGeoJSON = JSON.stringify({
        type: 'Polygon',
        coordinates: polygonCoords
      });

      // Insert Parcel
      const pRes = await client.query(`
        INSERT INTO gis.parcels (
          ulpin, survey_number, area, area_unit, land_type, 
          state_code, district_code, subdistrict_code, village_code,
          source_system, geom
        ) VALUES (
          $1, $2, $3, 'SQ_METERS', $4,
          'BR', 'BR-10', 'Basopatti', 'Mauza Arghawa (33)',
          'Bihar Bhumi RoR / e-Dharti', ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($5), 4326))
        ) RETURNING parcel_id
      `, [ulpin, surveyNo, areaSqm, landType, geomGeoJSON]);

      const parcelId = pRes.rows[0].parcel_id;
      const khataNo = 100 + (validCount % 45);

      // Select owner
      let primaryOwnerName = "Rahul Kumar Singh";
      if (landType === "Government Land") {
        primaryOwnerName = "State of Bihar (Revenue Dept)";
      } else if (landType === "Commercial") {
        primaryOwnerName = (validCount % 2 === 0) ? "Mithila Agro Producers Ltd." : "Sunil Kumar Verma";
      } else if (surveyNo === "1051") {
        primaryOwnerName = "Rahul Kumar Singh";
      } else {
        const indOwners = ["Rahul Kumar Singh", "Birendra Kumar", "Ramesh Kumar Sharma", "Smt. Geeta Devi", "Md. Aslam Ansari", "Ashok Tiwari & Brothers", "Smt. Sunita Kumari"];
        primaryOwnerName = indOwners[validCount % indOwners.length];
      }

      const primaryOwner = ownerList.find(o => o.name === primaryOwnerName) || ownerList[0];

      // Insert Ownership
      await client.query(`
        INSERT INTO land.parcel_ownership (parcel_id, owner_id, ownership_type, ownership_share, valid_from)
        VALUES ($1, $2, $3, 1.0, '2021-04-01')
      `, [parcelId, primaryOwner.owner_id, landType.includes("Govt") ? "Government" : "Raiyat"]);

      // Insert Identifiers
      await client.query(`
        INSERT INTO gis.parcel_identifiers (parcel_id, identifier_type, identifier_value, source_system, is_primary)
        VALUES 
          ($1, 'ULPIN', $2, 'NIC DILRMP / e-Dharti', true),
          ($1, 'KHESRA', $3, 'Bihar Bhumi Panji-II', false),
          ($1, 'KHATA', $4, 'Revenue Survey Khatiyan', false)
      `, [parcelId, ulpin, surveyNo, khataNo.toString()]);

      // Insert RoR
      await client.query(`
        INSERT INTO land.ror_records (
          parcel_id, khata_number, khesra_number, land_classification,
          area, area_unit, revenue_amount, revenue_status, effective_from, source_system
        ) VALUES (
          $1, $2, $3, $4, $5, 'SQ_METERS', 28.50, 'ACTIVE', '2020-01-01', 'Bihar Bhumi Jamabandi Register'
        )
      `, [parcelId, khataNo.toString(), surveyNo, landType, areaSqm]);

      // Insert Registration
      const regDocNo = `DOC-${2020 + (validCount % 5)}/${4500 + validCount}`;
      await client.query(`
        INSERT INTO governance.registrations (
          parcel_id, document_number, registration_date, transaction_type,
          seller_reference, buyer_reference, consideration_amount, stamp_duty, registration_fee, status, source_system
        ) VALUES (
          $1, $2, '2021-08-14', 'SALE', 'Shri Ramswaroop Kumar', $3, ${Math.round(areaSqm * 450)}, ${Math.round(areaSqm * 35)}, 2500.00, 'REGISTERED', 'NGDRS e-Nibandhan Bihar'
        )
      `, [parcelId, regDocNo, primaryOwner.name]);

      // Insert Conflicts
      if (isConflict) {
        await client.query(`
          INSERT INTO land.data_conflicts (
            parcel_id, conflict_type, severity, source_a, value_a, source_b, value_b, resolved
          ) VALUES (
            $1, 'BOUNDARY_OVERLAP', 'HIGH',
            'Cadastral DGPS Drone Survey', '${areaSqm} sq.m.',
            'Jamabandi Panji-II Khatiyan', '${areaSqm - 220} sq.m.',
            false
          )
        `, [parcelId]);

        await client.query(`
          INSERT INTO governance.disputes (
            parcel_id, dispute_type, case_number, court, petitioner, respondent, filing_date, next_hearing, status, stay_order
          ) VALUES (
            $1, 'TITLE_SUIT', 'TS/2024/${300 + validCount}', 'Civil Court Madhubani',
            'Suresh Prasad', $2, '2024-03-12', '2026-09-18', 'ACTIVE', true
          )
        `, [parcelId, primaryOwner.name]);
      }

      // Insert Encumbrance
      if (validCount % 5 === 0 && !isConflict) {
        await client.query(`
          INSERT INTO governance.encumbrances (
            parcel_id, encumbrance_type, institution, reference_number,
            amount, outstanding, interest_rate, start_date, status, source_system
          ) VALUES (
            $1, 'MORTGAGE', 'State Bank of India (Basopatti Branch)', 'KCC-LOAN-${8800 + validCount}',
            450000.00, 280000.00, 7.00, '2022-05-10', 'ACTIVE', 'CERSAI National Portal'
          )
        `, [parcelId]);
      }

      // Insert Property Tax
      const isTaxDue = validCount % 14 === 0;
      await client.query(`
        INSERT INTO governance.property_tax (
          parcel_id, assessment_year, owner_name, annual_value, tax_amount, paid_amount, due_amount, arrears, status, source_system
        ) VALUES (
          $1, '2024-2025', $2, ${Math.round(areaSqm * 20)}, 12450.00, ${isTaxDue ? 0 : 12450.00}, ${isTaxDue ? 12450.00 : 0}, 0,
          ${isTaxDue ? "'UNPAID'" : "'PAID'"}, 'Municipal Property Tax System'
        )
      `, [parcelId, primaryOwner.name]);

      // Insert Building Permissions
      if (landType === "Residential" || landType === "Commercial") {
        const isPending = (surveyNo === "1051" || validCount % 9 === 0);
        await client.query(`
          INSERT INTO governance.building_permissions (
            parcel_id, application_number, applicant, building_type, approved_area, floors,
            application_date, approval_date, status, source_system
          ) VALUES (
            $1, 'BP-2024-${400 + validCount}', $2, '${landType === "Commercial" ? "Commercial Complex" : "Residential G+2"}',
            ${Math.round(areaSqm * 0.65)}, 3, '2024-01-15', ${isPending ? 'NULL' : "'2024-03-20'"},
            ${isPending ? "'PENDING'" : "'APPROVED'"}, 'e-NagarSewa Bihar'
          )
        `, [parcelId, primaryOwner.name]);
      }

      validCount++;
    }

    console.log(`✓ COMPLETE: Inserted ${validCount} authentic cadastral farm plots (P-1001 to P-${1000 + validCount}).`);
  } catch (err) {
    console.error('Error during reseeding:', err);
  } finally {
    await client.end();
  }
}

main();
