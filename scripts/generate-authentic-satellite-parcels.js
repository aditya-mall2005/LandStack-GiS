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
  try {
    console.log('=== GENERATING 160+ AUTHENTIC AGRICULTURAL CADASTRAL PARCELS (FAST BATCH INSERT) ===');

    const centerLng = 86.1195;
    const centerLat = 26.3600;
    const spanLng = 0.0190;
    const spanLat = 0.0210;

    const minLng = centerLng - spanLng / 2;
    const maxLng = centerLng + spanLng / 2;
    const minLat = centerLat - spanLat / 2;
    const maxLat = centerLat + spanLat / 2;

    function isInsideVillage(lng, lat) {
      const nx = (lng - centerLng) / (spanLng * 0.48);
      const ny = (lat - centerLat) / (spanLat * 0.48);
      const angle = Math.atan2(ny, nx);
      const dist = Math.sqrt(nx * nx + ny * ny);
      const maxR = 1.0 + 0.16 * Math.sin(angle * 3 + 0.8) + 0.11 * Math.cos(angle * 5 - 1.2);
      return dist <= maxR;
    }

    const sectors = [];
    const SECTOR_GRID_R = 5;
    const SECTOR_GRID_C = 6;
    const secDLng = spanLng / SECTOR_GRID_C;
    const secDLat = spanLat / SECTOR_GRID_R;

    for (let sr = 0; sr < SECTOR_GRID_R; sr++) {
      for (let sc = 0; sc < SECTOR_GRID_C; sc++) {
        const sMinLng = minLng + sc * secDLng;
        const sMaxLng = sMinLng + secDLng;
        const sMaxLat = maxLat - sr * secDLat;
        const sMinLat = sMaxLat - secDLat;

        // Subtle road/pathway gaps ONLY between major sectors
        const roadMarginX = (sc === 2 || sc === 4) ? secDLng * 0.04 : secDLng * 0.01;
        const roadMarginY = (sr === 2) ? secDLat * 0.04 : secDLat * 0.01;

        sectors.push({
          minX: sMinLng + roadMarginX,
          maxX: sMaxLng - roadMarginX,
          minY: sMinLat + roadMarginY,
          maxY: sMaxLat - roadMarginY,
          sectorId: `${sr}_${sc}`
        });
      }
    }

    const rawPlots = [];

    function partitionBox(box, depth) {
      const width = box.maxX - box.minX;
      const height = box.maxY - box.minY;

      const minPlotDim = 0.00055; // ~60 meters
      if (depth >= 3 || (depth >= 1 && Math.random() > 0.55) || width < minPlotDim * 1.6 || height < minPlotDim * 1.6) {
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

    sectors.forEach(sec => {
      partitionBox(sec, 0);
    });

    console.log(`Generated ${rawPlots.length} initial field subdivisions.`);

    function jitterVertex(lng, lat) {
      const jx = (Math.sin(lng * 9123.3 + lat * 4321.7) - 0.5) * 0.000025;
      const jy = (Math.cos(lat * 8219.9 - lng * 5143.1) - 0.5) * 0.000025;
      return [
        parseFloat((lng + jx).toFixed(7)),
        parseFloat((lat + jy).toFixed(7))
      ];
    }

    await client.query('BEGIN');
    await client.query('DELETE FROM land.data_conflicts');
    await client.query('DELETE FROM governance.disputes');
    await client.query('DELETE FROM governance.property_tax');
    await client.query('DELETE FROM governance.building_permissions');
    await client.query('DELETE FROM governance.encumbrances');
    await client.query('DELETE FROM governance.registrations');
    await client.query('DELETE FROM land.ror_records');
    await client.query('DELETE FROM land.parcel_ownership');
    await client.query('DELETE FROM gis.parcel_identifiers');
    await client.query('DELETE FROM gis.parcels');

    const ownerRes = await client.query(`
      INSERT INTO land.owners (name, owner_type, identifier_ref, father_husband)
      VALUES 
        ('Rahul Kumar Singh', 'Individual', 'ABCPS1234D', 'Shri Raghunath Singh'),
        ('Ramesh Kumar', 'Individual', 'ABCPR5678E', 'Shri Ramswaroop Kumar'),
        ('Suresh Prasad', 'Individual', 'ABCPS9012F', 'Shri Gauri Shankar Prasad'),
        ('Birendra Kumar', 'Individual', 'ABCPB3456G', 'Shri Muneshwar Mahto'),
        ('Smt. Geeta Devi', 'Individual', 'ABCPG7890H', 'W/o Late Suresh Jha'),
        ('Md. Aslam Ansari', 'Individual', 'ABCPA1122J', 'Shri Noor Ansari'),
        ('Sunil Kumar Verma', 'Individual', 'ABCPV3344K', 'Shri Kedarnath Verma'),
        ('State of Bihar (Revenue Dept)', 'Government', 'GOVBR00001', 'Collectorate Madhubani')
      RETURNING owner_id, name
    `);
    const ownerList = ownerRes.rows;

    let surveyCounter = 1001;
    let validParcelCount = 0;

    // Distinct target issue surveys across the whole dataset
    const conflictSurveys = new Set(["1032", "1055", "1082", "1115", "1140", "1162"]);
    const unpermittedSurveys = new Set(["1051", "1098"]);
    const taxPendingSurveys = new Set(["1042", "1128"]);

    for (let i = 0; i < rawPlots.length; i++) {
      const p = rawPlots[i];
      const cX = (p.minX + p.maxX) / 2;
      const cY = (p.minY + p.maxY) / 2;

      if (!isInsideVillage(cX, cY)) continue;

      const surveyNo = (surveyCounter++).toString();
      const ulpin = `IN-BR-PTN-000${surveyNo}`;
      const isConflict = conflictSurveys.has(surveyNo);
      const isUnpermitted = unpermittedSurveys.has(surveyNo);
      const isTaxDue = taxPendingSurveys.has(surveyNo);

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

      const parcelInsert = await client.query(`
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

      const parcelId = parcelInsert.rows[0].parcel_id;

      const ownerObj = (surveyNo === "1051" || isConflict)
        ? ownerList.find(o => o.name === 'Rahul Kumar Singh')
        : (landType === 'Government Land'
            ? ownerList.find(o => o.name.includes('State of Bihar'))
            : ownerList[validParcelCount % (ownerList.length - 1)]);

      await client.query(`
        INSERT INTO land.parcel_ownership (parcel_id, owner_id, ownership_type, ownership_share)
        VALUES ($1, $2, 'Raiyat', 1.0)
      `, [parcelId, ownerObj.owner_id]);

      await client.query(`
        INSERT INTO land.ror_records (
          parcel_id, khata_number, khesra_number, land_classification,
          area, area_unit, revenue_amount, revenue_status, source_system
        ) VALUES (
          $1, $2, $3, $4, $5, 'SQ_METERS', 24.50, 'ACTIVE', 'Jamabandi Panji-II'
        )
      `, [parcelId, (100 + (validParcelCount % 35)).toString(), surveyNo, landType, areaSqm]);

      await client.query(`
        INSERT INTO gis.parcel_identifiers (parcel_id, identifier_type, identifier_value, source_system, is_primary)
        VALUES 
          ($1, 'ULPIN', $2, 'NIC DILRMP', true),
          ($1, 'KHESRA', $3, 'Bihar Bhumi', false)
      `, [parcelId, ulpin, surveyNo]);

      if (isConflict) {
        await client.query(`
          INSERT INTO land.data_conflicts (
            parcel_id, conflict_type, severity, source_a, value_a, source_b, value_b, resolved
          ) VALUES (
            $1, 'BOUNDARY_OVERLAP', 'HIGH',
            'Cadastral DGPS Drone Survey', '${areaSqm} sq.m.',
            'Jamabandi Panji-II Khatiyan', '${areaSqm - 180} sq.m.',
            false
          )
        `, [parcelId]);

        await client.query(`
          INSERT INTO governance.disputes (
            parcel_id, dispute_type, case_number, court, petitioner, respondent, status, stay_order
          ) VALUES (
            $1, 'TITLE_SUIT', 'TS/2024/${validParcelCount + 100}', 'Civil Court Madhubani',
            'Suresh Prasad', '${ownerObj.name}', 'ACTIVE', true
          )
        `, [parcelId]);
      }

      await client.query(`
        INSERT INTO governance.property_tax (
          parcel_id, assessment_year, owner_name, tax_amount, paid_amount, due_amount, arrears, status
        ) VALUES (
          $1, '2024-2025', $2, 12450, ${isTaxDue ? 0 : 12450}, ${isTaxDue ? 12450 : 0}, 0,
          ${isTaxDue ? "'UNPAID'" : "'PAID'"}
        )
      `, [parcelId, ownerObj.name]);

      if (landType === "Residential" || landType === "Commercial" || isUnpermitted) {
        await client.query(`
          INSERT INTO governance.building_permissions (
            parcel_id, application_number, applicant, building_type, approved_area, floors, status
          ) VALUES (
            $1, 'BP-2024-${validParcelCount + 100}', '${ownerObj.name}', '${landType === "Commercial" ? "Commercial Complex" : "Residential G+2"}',
            ${Math.round(areaSqm * 0.6)}, 3, ${isUnpermitted ? "'PENDING'" : "'APPROVED'"}
          )
        `, [parcelId]);
      }

      validParcelCount++;
    }

    await client.query('COMMIT');
    console.log(`✓ Successfully generated ${validParcelCount} authentic agricultural cadastral parcels.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
