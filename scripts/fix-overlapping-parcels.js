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
    console.log('=== FIXING OVERLAPPING CADASTRAL PARCELS (BATCH OPTIMIZED) ===');

    // 1. Fetch all 300 parcels currently in DB
    const res = await client.query(`
      SELECT parcel_id, ulpin, survey_number, state_code, district_code, subdistrict_code, village_code, land_type
      FROM gis.parcels
      ORDER BY survey_number ASC, ulpin ASC
    `);

    const parcels = res.rows;
    const totalCount = parcels.length;
    console.log(`Found ${totalCount} parcels in gis.parcels`);

    if (totalCount === 0) {
      console.log('No parcels found to fix.');
      return;
    }

    // 2. Define village bounding box
    // Arghawa Mauza (33), Basopatti, Madhubani
    const minLng = 86.1110;
    const maxLng = 86.1285;
    const minLat = 26.3485;
    const maxLat = 26.3715;

    // 15 rows x 20 cols = 300 parcels
    const ROWS = 15;
    const COLS = 20;

    console.log(`Generating contiguous non-overlapping 2D cadastral topological mesh (${ROWS} rows x ${COLS} cols = ${ROWS * COLS} plots)...`);

    const dLng = (maxLng - minLng) / COLS;
    const dLat = (maxLat - minLat) / ROWS;

    // Create shared vertex matrix so neighboring polygons share the EXACT same boundary coordinates
    const vertices = [];
    function pseudoJitter(r, c) {
      if (r === 0 || r === ROWS || c === 0 || c === COLS) {
        return { jx: 0, jy: 0 };
      }
      const seed = Math.sin(r * 12.9898 + c * 78.233) * 43758.5453;
      const frac = seed - Math.floor(seed);
      const jx = (frac - 0.5) * 0.35 * dLng;
      const jy = ((seed * 1.5) % 1 - 0.5) * 0.35 * dLat;
      return { jx, jy };
    }

    for (let r = 0; r <= ROWS; r++) {
      vertices[r] = [];
      for (let c = 0; c <= COLS; c++) {
        const baseLng = minLng + c * dLng;
        const baseLat = maxLat - r * dLat;
        const { jx, jy } = pseudoJitter(r, c);
        vertices[r][c] = [
          parseFloat((baseLng + jx).toFixed(7)),
          parseFloat((baseLat + jy).toFixed(7))
        ];
      }
    }

    const geojsonFeatures = [];
    const updateValues = [];
    const updateParams = [];
    let paramIndex = 1;
    let plotIdx = 0;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (plotIdx >= totalCount) break;

        const p = parcels[plotIdx];

        const vTL = vertices[r][c];
        const vBL = vertices[r + 1][c];
        const vBR = vertices[r + 1][c + 1];
        const vTR = vertices[r][c + 1];

        const coords = [[
          [vTL[0], vTL[1]],
          [vBL[0], vBL[1]],
          [vBR[0], vBR[1]],
          [vTR[0], vTR[1]],
          [vTL[0], vTL[1]]
        ]];

        const polygonGeoJSON = {
          type: 'Polygon',
          coordinates: coords
        };

        const midLat = (vTL[1] + vBL[1]) / 2;
        const widthM = (dLng * 111320 * Math.cos(midLat * Math.PI / 180));
        const heightM = (dLat * 111320);
        const areaSqm = Math.round(widthM * heightM);

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
            row_index: r,
            col_index: c
          }
        });

        plotIdx++;
      }
    }

    console.log(`Executing single batch update for all ${updateValues.length} parcels...`);

    const updateSql = `
      UPDATE gis.parcels AS p
      SET geom = ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(v.geom_json), 4326)),
          area = v.area
      FROM (VALUES ${updateValues.join(',\n')}) AS v(parcel_id, geom_json, area)
      WHERE p.parcel_id = v.parcel_id
    `;

    await client.query(updateSql, updateParams);
    console.log(`✅ Successfully updated all ${plotIdx} parcels in database in a single query!`);

    // Verify 0 overlaps in PostGIS
    const overlapCheck = await client.query(`
      SELECT COUNT(*) AS overlap_count
      FROM gis.parcels a
      JOIN gis.parcels b ON a.parcel_id < b.parcel_id
      WHERE ST_Overlaps(a.geom, b.geom)
    `);
    console.log(`🔍 PostGIS ST_Overlaps check: ${overlapCheck.rows[0].overlap_count} overlapping pairs.`);

    // 3. Update GeoJSON file
    const geojsonPath = path.join(__dirname, '..', 'data', 'bihar', 'base_layer', 'cadastral_parcels.geojson');
    const fullGeoJSON = {
      type: 'FeatureCollection',
      name: 'Bihar_Arghawa_Cadastral_Parcels',
      crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
      metadata: {
        description: 'Cadastral parcels for Arghawa village, Madhubani, Bihar — Non-overlapping contiguous mosaic',
        date_updated: new Date().toISOString(),
        total_parcels: geojsonFeatures.length,
        pilot_area: 'Arghawa (33), Basopatti, Madhubani, Bihar'
      },
      features: geojsonFeatures
    };

    fs.writeFileSync(geojsonPath, JSON.stringify(fullGeoJSON, null, 2), 'utf8');
    console.log(`✅ Saved updated non-overlapping GeoJSON to ${geojsonPath}`);

  } catch (err) {
    console.error('Error fixing parcels:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
