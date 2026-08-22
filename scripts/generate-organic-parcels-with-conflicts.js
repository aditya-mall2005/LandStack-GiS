require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();
  try {
    console.log('=== GENERATING NATURAL ORGANIC CADASTRAL FIELDS WITH TARGETED OVERLAP CONFLICTS ===');

    const res = await client.query(`
      SELECT parcel_id, ulpin, survey_number, state_code, district_code, subdistrict_code, village_code, land_type
      FROM gis.parcels
      ORDER BY survey_number ASC, ulpin ASC
    `);

    const parcels = res.rows;
    const totalCount = parcels.length;
    console.log(`Found ${totalCount} parcels.`);

    const minLng = 86.1110;
    const maxLng = 86.1285;
    const minLat = 26.3485;
    const maxLat = 26.3715;

    const ROWS = 15;
    const COLS = 20;

    const dLng = (maxLng - minLng) / COLS;
    const dLat = (maxLat - minLat) / ROWS;

    // 1. Generate primary corner vertices with organic angular jitter
    const cornerVertices = [];
    function cornerJitter(r, c) {
      if (r === 0 || r === ROWS || c === 0 || c === COLS) {
        return { jx: 0, jy: 0 };
      }
      // Organic pseudo-noise
      const val = Math.sin(r * 18.23 + c * 34.56) * 43758.5453;
      const f1 = (val - Math.floor(val)) - 0.5;
      const val2 = Math.cos(r * 45.12 + c * 12.87) * 43758.5453;
      const f2 = (val2 - Math.floor(val2)) - 0.5;

      // Jitter up to 40% creates natural irregular trapezoids, diamonds, and polygons
      const jx = f1 * 0.55 * dLng;
      const jy = f2 * 0.55 * dLat;
      return { jx, jy };
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

    // 2. Generate SHARED mid-edge points to give 5-to-6 sided irregular organic boundaries without accidental overlaps
    const horizontalMids = []; // between (r,c) and (r, c+1)
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
          const bend = (Math.sin(r * 9.1 + c * 14.3) - 0.5) * 0.25 * dLat;
          horizontalMids[r][c] = [
            parseFloat(midLng.toFixed(7)),
            parseFloat((midLat + bend).toFixed(7))
          ];
        }
      }
    }

    const verticalMids = []; // between (r,c) and (r+1, c)
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
          const bend = (Math.cos(r * 15.7 + c * 8.4) - 0.5) * 0.25 * dLng;
          verticalMids[r][c] = [
            parseFloat((midLng + bend).toFixed(7)),
            parseFloat(midLat.toFixed(7))
          ];
        }
      }
    }

    // 3. Specific INTENTIONAL BOUNDARY OVERLAPS (Real-world Encroachment & Dispute Areas)
    // Key dispute pairs in Bihar Madhubani pilot:
    // (Row 2, Col 3) overlaps into (Row 2, Col 4) — Khesra #1420 & #1428 boundary dispute
    // (Row 4, Col 8) overlaps into (Row 4, Col 9) — Frontage encroachment
    // (Row 7, Col 12) overlaps into (Row 8, Col 12) — Agricultural bund dispute
    // (Row 10, Col 5) overlaps into (Row 10, Col 6) — Inheritance partition claim
    // (Row 12, Col 14) overlaps into (Row 12, Col 15) — Water canal setback dispute
    const disputePlots = new Set([
      '2,3',
      '4,8',
      '7,12',
      '10,5',
      '12,14',
      '5,16',
      '9,2',
      '11,9'
    ]);

    const geojsonFeatures = [];
    const updateValues = [];
    const updateParams = [];
    let paramIndex = 1;
    let plotIdx = 0;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (plotIdx >= totalCount) break;

        const p = parcels[plotIdx];

        let vTL = [...cornerVertices[r][c]];
        let vTopMid = [...horizontalMids[r][c]];
        let vTR = [...cornerVertices[r][c + 1]];
        let vRightMid = [...verticalMids[r][c + 1]];
        let vBR = [...cornerVertices[r + 1][c + 1]];
        let vBottomMid = [...horizontalMids[r + 1][c]];
        let vBL = [...cornerVertices[r + 1][c]];
        let vLeftMid = [...verticalMids[r][c]];

        const isDisputed = disputePlots.has(`${r},${c}`);

        if (isDisputed) {
          // Push boundary 35% into neighboring parcel to create clear visible overlap sliver
          const overlapDist = dLng * 0.35;
          vTR[0] += overlapDist;
          vRightMid[0] += overlapDist;
          vBR[0] += overlapDist;
        }

        // Multi-vertex organic polygon (6 vertices)
        const coords = [[
          vTL,
          vTopMid,
          vTR,
          vRightMid,
          vBR,
          vBottomMid,
          vBL,
          vLeftMid,
          vTL // close ring
        ]];

        const polygonGeoJSON = {
          type: 'Polygon',
          coordinates: coords
        };

        const midLat = (vTL[1] + vBL[1]) / 2;
        const widthM = (Math.abs(vTR[0] - vTL[0]) * 111320 * Math.cos(midLat * Math.PI / 180));
        const heightM = (Math.abs(vTL[1] - vBL[1]) * 111320);
        const areaSqm = Math.max(150, Math.round(widthM * heightM));

        updateValues.push(`($${paramIndex++}::uuid, $${paramIndex++}, $${paramIndex++}::numeric)`);
        updateParams.push(p.parcel_id, JSON.stringify(polygonGeoJSON), areaSqm);

        geojsonFeatures.push({
          type: 'Feature',
          geometry: polygonGeoJSON,
          properties: {
            parcel_id: p.parcel_id,
            ulpin: p.ulpin,
            khesra_no: p.survey_number,
            survey_number: p.survey_number,
            area: areaSqm,
            rakba_sqm: areaSqm,
            rakba_decimal: parseFloat((areaSqm / 40.4686).toFixed(2)),
            kisam: p.land_type,
            land_type: p.land_type,
            state_code: p.state_code,
            district: p.district_code,
            sub_division: p.subdistrict_code,
            mauza_code: p.village_code,
            is_boundary_dispute: isDisputed,
            dispute_status: isDisputed ? 'ACTIVE_BOUNDARY_OVERLAP_DISPUTE' : 'CLEAR_TITLE',
            row_index: r,
            col_index: c
          }
        });

        plotIdx++;
      }
    }

    console.log(`Executing batch update for all ${updateValues.length} parcels...`);

    const updateSql = `
      UPDATE gis.parcels AS p
      SET geom = ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(v.geom_json), 4326)),
          area = v.area
      FROM (VALUES ${updateValues.join(',\n')}) AS v(parcel_id, geom_json, area)
      WHERE p.parcel_id = v.parcel_id
    `;

    await client.query(updateSql, updateParams);
    console.log(`✅ Successfully updated all ${plotIdx} parcels!`);

    // Verify PostGIS overlaps
    const overlapCheck = await client.query(`
      SELECT COUNT(*) AS overlap_count
      FROM gis.parcels a
      JOIN gis.parcels b ON a.parcel_id < b.parcel_id
      WHERE ST_Overlaps(a.geom, b.geom)
    `);
    console.log(`🔍 PostGIS ST_Overlaps check: ${overlapCheck.rows[0].overlap_count} targeted boundary overlap conflict pairs.`);

    // 4. Update GeoJSON file
    const geojsonPath = path.join(__dirname, '..', 'data', 'bihar', 'base_layer', 'cadastral_parcels.geojson');
    const fullGeoJSON = {
      type: 'FeatureCollection',
      name: 'Bihar_Arghawa_Cadastral_Parcels',
      crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
      metadata: {
        description: 'Organic cadastral parcels for Arghawa village, Madhubani, Bihar with targeted boundary overlap disputes',
        date_updated: new Date().toISOString(),
        total_parcels: geojsonFeatures.length,
        dispute_count: disputePlots.size,
        pilot_area: 'Arghawa (33), Basopatti, Madhubani, Bihar'
      },
      features: geojsonFeatures
    };

    fs.writeFileSync(geojsonPath, JSON.stringify(fullGeoJSON, null, 2), 'utf8');
    console.log(`✅ Saved updated organic GeoJSON to ${geojsonPath}`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
