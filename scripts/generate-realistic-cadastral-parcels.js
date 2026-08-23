require('dotenv').config();
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();
  try {
    console.log('=== GENERATING AUTHENTIC CADASTRAL PARCELS MATCHING REFERENCE UI ===');

    // Grid Settings (42 parcels, 6 rows x 7 cols)
    const minLng = 86.1140;
    const maxLng = 86.1265;
    const minLat = 26.3530;
    const maxLat = 26.3670;

    const ROWS = 6;
    const COLS = 7;
    const totalPlots = ROWS * COLS; // 42

    const dLng = (maxLng - minLng) / COLS;
    const dLat = (maxLat - minLat) / ROWS;

    // Survey numbers corresponding to the reference image
    const SURVEY_NUMBERS = [
      // Row 0 (North)
      "1021", "1017", "1033", "1048", "1047", "1048", "1003",
      // Row 1
      "1022", "1015", "1035", "1003", "1033", "1083", "1043",
      // Row 2
      "1048", "1023", "1040", "1002", "1032", "1033", "1037",
      // Row 3
      "1011", "1033", "1038", "1037", "1033", "1064", "1002",
      // Row 4
      "1083", "1032", "1038", "1038", "1043", "1063", "1051",
      // Row 5 (South)
      "1083", "1064", "1038", "1038", "1058", "1063", "1058"
    ];

    // Land Types distribution
    const LAND_TYPES = [
      // Row 0
      "Agricultural", "Agricultural", "Agricultural", "Residential", "Residential", "Agricultural", "Agricultural",
      // Row 1
      "Commercial", "Agricultural", "Agricultural", "Residential", "Residential", "Agricultural", "Government Land",
      // Row 2
      "Agricultural", "Agricultural", "Government Land", "Commercial", "Commercial", "Residential", "Residential",
      // Row 3
      "Commercial", "Agricultural", "Agricultural", "Agricultural", "Residential", "Government Land", "Residential",
      // Row 4
      "Agricultural", "Commercial", "Agricultural", "Agricultural", "Commercial", "Agricultural", "Residential",
      // Row 5
      "Agricultural", "Agricultural", "Agricultural", "Agricultural", "Residential", "Agricultural", "Residential"
    ];

    // Conflict plots (with hatched red stripes)
    const CONFLICT_SURVEYS = new Set(["1022", "1011", "1032", "1033", "1043", "1038"]);

    // Generate vertices with natural agrarian field jitter
    const cornerVertices = [];
    function cornerJitter(r, c) {
      if (r === 0 || r === ROWS || c === 0 || c === COLS) {
        return { jx: 0, jy: 0 };
      }
      const val1 = Math.sin(r * 23.4 + c * 47.1) * 43758.5453;
      const f1 = (val1 - Math.floor(val1)) - 0.5;
      const val2 = Math.cos(r * 31.8 + c * 19.3) * 43758.5453;
      const f2 = (val2 - Math.floor(val2)) - 0.5;

      return {
        jx: f1 * 0.42 * dLng,
        jy: f2 * 0.42 * dLat
      };
    }

    for (let r = 0; r <= ROWS; r++) {
      cornerVertices[r] = [];
      for (let c = 0; c <= COLS; c++) {
        const { jx, jy } = cornerJitter(r, c);
        const lng = minLng + c * dLng + jx;
        const lat = maxLat - r * dLat + jy;
        cornerVertices[r][c] = [
          parseFloat(lng.toFixed(7)),
          parseFloat(lat.toFixed(7))
        ];
      }
    }

    // Horizontal mid points (shared)
    const horizontalMids = [];
    for (let r = 0; r <= ROWS; r++) {
      horizontalMids[r] = [];
      for (let c = 0; c < COLS; c++) {
        const vL = cornerVertices[r][c];
        const vR = cornerVertices[r][c + 1];
        const midLng = (vL[0] + vR[0]) / 2;
        const midLat = (vL[1] + vR[1]) / 2;
        if (r === 0 || r === ROWS) {
          horizontalMids[r][c] = [midLng, midLat];
        } else {
          const bend = (Math.sin(r * 12.3 + c * 7.9) - 0.5) * 0.2 * dLat;
          horizontalMids[r][c] = [
            parseFloat(midLng.toFixed(7)),
            parseFloat((midLat + bend).toFixed(7))
          ];
        }
      }
    }

    // Vertical mid points (shared)
    const verticalMids = [];
    for (let r = 0; r < ROWS; r++) {
      verticalMids[r] = [];
      for (let c = 0; c <= COLS; c++) {
        const vT = cornerVertices[r][c];
        const vB = cornerVertices[r + 1][c];
        const midLng = (vT[0] + vB[0]) / 2;
        const midLat = (vT[1] + vB[1]) / 2;
        if (c === 0 || c === COLS) {
          verticalMids[r][c] = [midLng, midLat];
        } else {
          const bend = (Math.cos(r * 8.4 + c * 15.2) - 0.5) * 0.2 * dLng;
          verticalMids[r][c] = [
            parseFloat((midLng + bend).toFixed(7)),
            parseFloat(midLat.toFixed(7))
          ];
        }
      }
    }

    // Rebuild database tables
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

    // Create / fetch primary owners
    const ownerRes = await client.query(`
      INSERT INTO land.owners (name, owner_type, identifier_ref, father_husband)
      VALUES 
        ('Rahul Kumar Singh', 'Individual', 'ABCPS1234D', 'Shri Raghunath Singh'),
        ('Ramesh Kumar', 'Individual', 'ABCPR5678E', 'Shri Ramswaroop Kumar'),
        ('Suresh Prasad', 'Individual', 'ABCPS9012F', 'Shri Gauri Shankar Prasad'),
        ('Birendra Kumar', 'Individual', 'ABCPB3456G', 'Shri Muneshwar Mahto'),
        ('Smt. Geeta Devi', 'Individual', 'ABCPG7890H', 'W/o Late Suresh Jha'),
        ('State of Bihar (Revenue Dept)', 'Government', 'GOVBR00001', 'Collectorate Madhubani')
      RETURNING owner_id, name
    `);

    const ownerMap = {};
    ownerRes.rows.forEach(o => { ownerMap[o.name] = o.owner_id; });

    let idx = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const surveyNo = SURVEY_NUMBERS[idx] || (1000 + idx).toString();
        const landType = LAND_TYPES[idx] || "Agricultural";
        const isConflict = CONFLICT_SURVEYS.has(surveyNo);
        const ulpin = `IN-BR-PTN-000${surveyNo}`;

        let vTL = [...cornerVertices[r][c]];
        let vTopMid = [...horizontalMids[r][c]];
        let vTR = [...cornerVertices[r][c + 1]];
        let vRightMid = [...verticalMids[r][c + 1]];
        let vBR = [...cornerVertices[r + 1][c + 1]];
        let vBottomMid = [...horizontalMids[r + 1][c]];
        let vBL = [...cornerVertices[r + 1][c]];
        let vLeftMid = [...verticalMids[r][c]];

        if (isConflict) {
          const overlap = dLng * 0.28;
          vTR[0] += overlap;
          vRightMid[0] += overlap;
          vBR[0] += overlap;
        }

        const polygonCoords = [[
          vTL, vTopMid, vTR, vRightMid, vBR, vBottomMid, vBL, vLeftMid, vTL
        ]];

        const midLat = (vTL[1] + vBL[1]) / 2;
        const widthM = (Math.abs(vTR[0] - vTL[0]) * 111320 * Math.cos(midLat * Math.PI / 180));
        const heightM = (Math.abs(vTL[1] - vBL[1]) * 111320);
        const areaSqm = Math.max(1200, Math.round(widthM * heightM));

        const geomGeoJSON = JSON.stringify({
          type: 'Polygon',
          coordinates: polygonCoords
        });

        // Insert parcel
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
        const ownerName = surveyNo === "1051" ? "Rahul Kumar Singh" :
          (landType === "Government Land" ? "State of Bihar (Revenue Dept)" :
          (idx % 3 === 0 ? "Ramesh Kumar" : idx % 3 === 1 ? "Birendra Kumar" : "Smt. Geeta Devi"));
        const ownerId = ownerMap[ownerName] || ownerMap["Rahul Kumar Singh"];

        await client.query(`
          INSERT INTO land.parcel_ownership (parcel_id, owner_id, ownership_type, ownership_share)
          VALUES ($1, $2, 'Raiyat', 1.0)
        `, [parcelId, ownerId]);

        // Insert RoR
        await client.query(`
          INSERT INTO land.ror_records (
            parcel_id, khata_number, khesra_number, land_classification,
            area, area_unit, revenue_amount, revenue_status, source_system
          ) VALUES (
            $1, $2, $3, $4, $5, 'SQ_METERS', 24.50, 'ACTIVE', 'Jamabandi Panji-II'
          )
        `, [parcelId, (100 + (idx % 15)).toString(), surveyNo, landType, areaSqm]);

        // Insert Parcel Identifier
        await client.query(`
          INSERT INTO gis.parcel_identifiers (parcel_id, identifier_type, identifier_value, source_system, is_primary)
          VALUES 
            ($1, 'ULPIN', $2, 'NIC DILRMP', true),
            ($1, 'KHESRA', $3, 'Bihar Bhumi', false)
        `, [parcelId, ulpin, surveyNo]);

        // Insert Conflict Record if applicable
        if (isConflict) {
          await client.query(`
            INSERT INTO land.data_conflicts (
              parcel_id, conflict_type, severity, source_a, value_a, source_b, value_b, resolved
            ) VALUES (
              $1, 'BOUNDARY_OVERLAP', 'HIGH',
              'Cadastral DGPS Drone Survey', '${areaSqm} sq.m.',
              'Jamabandi Panji-II Khatiyan', '${areaSqm - 250} sq.m.',
              false
            )
          `, [parcelId]);

          await client.query(`
            INSERT INTO governance.disputes (
              parcel_id, dispute_type, case_number, court, petitioner, respondent, status, stay_order
            ) VALUES (
              $1, 'TITLE_SUIT', 'TS/2024/${100 + idx}', 'Civil Court Madhubani',
              'Suresh Prasad', 'Rahul Kumar Singh', 'ACTIVE', true
            )
          `, [parcelId]);
        }

        // Insert Property Tax
        await client.query(`
          INSERT INTO governance.property_tax (
            parcel_id, assessment_year, owner_name, tax_amount, paid_amount, due_amount, arrears, status
          ) VALUES (
            $1, '2024-2025', $2, 12450, ${isConflict ? 0 : 12450}, ${isConflict ? 12450 : 0}, 0,
            ${isConflict ? "'UNPAID'" : "'PAID'"}
          )
        `, [parcelId, ownerName]);

        // Insert Building Permission
        if (landType === "Residential" || landType === "Commercial") {
          await client.query(`
            INSERT INTO governance.building_permissions (
              parcel_id, application_number, applicant, building_type, approved_area, floors, status
            ) VALUES (
              $1, 'BP-2024-${100 + idx}', '${ownerName}', '${landType === "Commercial" ? "Commercial Complex" : "Residential G+2"}',
              ${Math.round(areaSqm * 0.6)}, 3, ${isConflict ? "'PENDING'" : "'APPROVED'"}
            )
          `, [parcelId]);
        }

        idx++;
      }
    }

    await client.query('COMMIT');
    console.log(`✓ Successfully regenerated ${totalPlots} authentic cadastral parcels matching reference UI.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error generating parcels:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
