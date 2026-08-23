require('dotenv').config();
const { Client } = require('pg');

async function main() {
  let connStr = process.env.DATABASE_URL || "";
  // If port 5432, try pooler port 6543
  if (connStr.includes(":5432")) {
    connStr = connStr.replace(":5432", ":6543");
  }

  const client = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  try {
    console.log('=== GENERATING 180+ ORGANIC CADASTRAL PARCELS WITH NON-STRAIGHT EDGES & PATHWAY SPACES ===');

    const centerLng = 86.1195;
    const centerLat = 26.3600;
    const spanLng = 0.0190;
    const spanLat = 0.0220;

    const ROWS = 13;
    const COLS = 16;

    const minLng = centerLng - spanLng / 2;
    const maxLng = centerLng + spanLng / 2;
    const minLat = centerLat - spanLat / 2;
    const maxLat = centerLat + spanLat / 2;

    const dLng = spanLng / COLS;
    const dLat = spanLat / ROWS;

    // Organic non-rectangular boundary envelope check (eliminates straight outer box)
    function isInsideVillageBoundary(lng, lat) {
      const nx = (lng - centerLng) / (spanLng * 0.47);
      const ny = (lat - centerLat) / (spanLat * 0.47);
      const angle = Math.atan2(ny, nx);
      const dist = Math.sqrt(nx * nx + ny * ny);

      const maxRadius = 1.0 + 
        0.18 * Math.sin(angle * 3 + 1.2) + 
        0.12 * Math.cos(angle * 5 - 0.7) +
        0.07 * Math.sin(angle * 7 + 2.1);

      return dist <= maxRadius;
    }

    // Generate organic vertices with Perlin-style jitter
    const cornerVertices = [];
    for (let r = 0; r <= ROWS; r++) {
      cornerVertices[r] = [];
      for (let c = 0; c <= COLS; c++) {
        const baseLng = minLng + c * dLng;
        const baseLat = maxLat - r * dLat;

        const jitterX = (Math.sin(r * 3.7 + c * 5.9) * 0.35 + Math.cos(r * 8.1 - c * 2.3) * 0.15) * dLng;
        const jitterY = (Math.cos(r * 4.3 + c * 3.1) * 0.35 + Math.sin(r * 2.1 + c * 7.4) * 0.15) * dLat;

        cornerVertices[r][c] = [
          parseFloat((baseLng + jitterX).toFixed(7)),
          parseFloat((baseLat + jitterY).toFixed(7))
        ];
      }
    }

    // Mid-edge curve vertices (gives multi-sided organic field bunds)
    const horizontalMids = [];
    for (let r = 0; r <= ROWS; r++) {
      horizontalMids[r] = [];
      for (let c = 0; c < COLS; c++) {
        const vL = cornerVertices[r][c];
        const vR = cornerVertices[r][c + 1];
        const midLng = (vL[0] + vR[0]) / 2;
        const midLat = (vL[1] + vR[1]) / 2;
        const bend = (Math.sin(r * 5.2 + c * 9.1) * 0.16) * dLat;
        horizontalMids[r][c] = [
          parseFloat(midLng.toFixed(7)),
          parseFloat((midLat + bend).toFixed(7))
        ];
      }
    }

    const verticalMids = [];
    for (let r = 0; r < ROWS; r++) {
      verticalMids[r] = [];
      for (let c = 0; c <= COLS; c++) {
        const vT = cornerVertices[r][c];
        const vB = cornerVertices[r + 1][c];
        const midLng = (vT[0] + vB[0]) / 2;
        const midLat = (vT[1] + vB[1]) / 2;
        const bend = (Math.cos(r * 7.3 + c * 4.6) * 0.16) * dLng;
        verticalMids[r][c] = [
          parseFloat((midLng + bend).toFixed(7)),
          parseFloat(midLat.toFixed(7))
        ];
      }
    }

    // Selected conflict plot indices (8 target plots across village)
    const conflictCells = new Set([
      "3,5", "4,9", "6,4", "7,11", "8,6", "9,12", "5,7", "10,8"
    ]);

    function getLandType(r, c, isConflict) {
      if (isConflict) return Math.random() > 0.5 ? "Commercial" : "Residential";
      const nx = (c - COLS / 2) / COLS;
      const ny = (r - ROWS / 2) / ROWS;
      const dist = Math.sqrt(nx * nx + ny * ny);

      if (dist < 0.22) return Math.random() > 0.4 ? "Residential" : "Commercial";
      if (c <= 3 && r >= 4 && r <= 7) return "Government Land";
      if (r === 0 || c === COLS - 1) return Math.random() > 0.6 ? "Forest" : "Agricultural";
      if (c === 8 && r >= 3 && r <= 5) return "Residential";
      if (r === 6 && c === 6) return "Water Body";
      return Math.random() > 0.25 ? "Agricultural" : "Residential";
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

    // Create standard owners
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
    let insertedCount = 0;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cellCenterLng = (cornerVertices[r][c][0] + cornerVertices[r + 1][c + 1][0]) / 2;
        const cellCenterLat = (cornerVertices[r][c][1] + cornerVertices[r + 1][c + 1][1]) / 2;

        if (!isInsideVillageBoundary(cellCenterLng, cellCenterLat)) {
          continue;
        }

        const surveyNo = (surveyCounter++).toString();
        const ulpin = `IN-BR-PTN-000${surveyNo}`;
        const isConflict = conflictCells.has(`${r},${c}`);
        const landType = getLandType(r, c, isConflict);

        let vTL = [...cornerVertices[r][c]];
        let vTopMid = [...horizontalMids[r][c]];
        let vTR = [...cornerVertices[r][c + 1]];
        let vRightMid = [...verticalMids[r][c + 1]];
        let vBR = [...cornerVertices[r + 1][c + 1]];
        let vBottomMid = [...horizontalMids[r + 1][c]];
        let vBL = [...cornerVertices[r + 1][c]];
        let vLeftMid = [...verticalMids[r][c]];

        // Inset margin (creates realistic pathway / road spacing between plots!)
        const gapRatio = 0.085;
        const insetX = dLng * gapRatio;
        const insetY = dLat * gapRatio;

        vTL[0] += insetX; vTL[1] -= insetY;
        vTopMid[1] -= insetY;
        vTR[0] -= insetX; vTR[1] -= insetY;
        vRightMid[0] -= insetX;
        vBR[0] -= insetX; vBR[1] += insetY;
        vBottomMid[1] += insetY;
        vBL[0] += insetX; vBL[1] += insetY;
        vLeftMid[0] += insetX;

        // If conflict, extend boundary to overlap into adjacent plot
        if (isConflict) {
          const overlap = dLng * 0.22;
          vTR[0] += overlap;
          vRightMid[0] += overlap;
          vBR[0] += overlap;
        }

        const polygonCoords = [[
          vTL, vTopMid, vTR, vRightMid, vBR, vBottomMid, vBL, vLeftMid, vTL
        ]];

        const widthM = (Math.abs(vTR[0] - vTL[0]) * 111320 * Math.cos(cellCenterLat * Math.PI / 180));
        const heightM = (Math.abs(vTL[1] - vBL[1]) * 111320);
        const areaSqm = Math.max(900, Math.round(widthM * heightM));

        const geomGeoJSON = JSON.stringify({
          type: 'Polygon',
          coordinates: polygonCoords
        });

        // Insert parcel with PostGIS ST_Multi
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

        // Assign Owner
        const ownerObj = (surveyNo === "1051" || isConflict)
          ? ownerList.find(o => o.name === 'Rahul Kumar Singh')
          : (landType === 'Government Land'
              ? ownerList.find(o => o.name.includes('State of Bihar'))
              : ownerList[insertedCount % (ownerList.length - 1)]);

        await client.query(`
          INSERT INTO land.parcel_ownership (parcel_id, owner_id, ownership_type, ownership_share)
          VALUES ($1, $2, 'Raiyat', 1.0)
        `, [parcelId, ownerObj.owner_id]);

        // Insert RoR
        await client.query(`
          INSERT INTO land.ror_records (
            parcel_id, khata_number, khesra_number, land_classification,
            area, area_unit, revenue_amount, revenue_status, source_system
          ) VALUES (
            $1, $2, $3, $4, $5, 'SQ_METERS', 24.50, 'ACTIVE', 'Jamabandi Panji-II'
          )
        `, [parcelId, (100 + (insertedCount % 35)).toString(), surveyNo, landType, areaSqm]);

        // Insert Parcel Identifier
        await client.query(`
          INSERT INTO gis.parcel_identifiers (parcel_id, identifier_type, identifier_value, source_system, is_primary)
          VALUES 
            ($1, 'ULPIN', $2, 'NIC DILRMP', true),
            ($1, 'KHESRA', $3, 'Bihar Bhumi', false)
        `, [parcelId, ulpin, surveyNo]);

        // Insert specific conflict records on designated conflict plots
        if (isConflict) {
          await client.query(`
            INSERT INTO land.data_conflicts (
              parcel_id, conflict_type, severity, source_a, value_a, source_b, value_b, resolved
            ) VALUES (
              $1, 'BOUNDARY_OVERLAP', 'HIGH',
              'Cadastral DGPS Drone Survey', '${areaSqm} sq.m.',
              'Jamabandi Panji-II Khatiyan', '${areaSqm - 280} sq.m.',
              false
            )
          `, [parcelId]);

          await client.query(`
            INSERT INTO governance.disputes (
              parcel_id, dispute_type, case_number, court, petitioner, respondent, status, stay_order
            ) VALUES (
              $1, 'TITLE_SUIT', 'TS/2024/${200 + insertedCount}', 'Civil Court Madhubani',
              'Suresh Prasad', '${ownerObj.name}', 'ACTIVE', true
            )
          `, [parcelId]);
        }

        // Insert Property Tax
        const hasTaxDue = insertedCount % 16 === 0;
        await client.query(`
          INSERT INTO governance.property_tax (
            parcel_id, assessment_year, owner_name, tax_amount, paid_amount, due_amount, arrears, status
          ) VALUES (
            $1, '2024-2025', $2, 12450, ${hasTaxDue ? 0 : 12450}, ${hasTaxDue ? 12450 : 0}, 0,
            ${hasTaxDue ? "'UNPAID'" : "'PAID'"}
          )
        `, [parcelId, ownerObj.name]);

        // Insert Building Permission
        if (landType === "Residential" || landType === "Commercial") {
          const isPendingBP = insertedCount % 14 === 0;
          await client.query(`
            INSERT INTO governance.building_permissions (
              parcel_id, application_number, applicant, building_type, approved_area, floors, status
            ) VALUES (
              $1, 'BP-2024-${200 + insertedCount}', '${ownerObj.name}', '${landType === "Commercial" ? "Commercial Complex" : "Residential G+2"}',
              ${Math.round(areaSqm * 0.65)}, 3, ${isPendingBP ? "'PENDING'" : "'APPROVED'"}
            )
          `, [parcelId]);
        }

        insertedCount++;
      }
    }

    await client.query('COMMIT');
    console.log(`✓ Successfully regenerated ${insertedCount} organic cadastral parcels with non-straight boundary edges and realistic pathway spacing.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error generating parcels:', err);
  } finally {
    await client.end();
  }
}

main();
