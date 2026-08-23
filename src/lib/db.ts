/**
 * LandStack — Database Connection (Supabase PostgreSQL)
 * Uses Supabase-hosted PostgreSQL with PostGIS
 */

import { Pool, PoolClient, QueryResult } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var postgresPool: Pool | undefined;
}

export function getPool(): Pool {
  if (!globalThis.postgresPool) {
    globalThis.postgresPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 4,
      idleTimeoutMillis: 2000,
      connectionTimeoutMillis: 8000,
    });

    globalThis.postgresPool.on('error', (err: Error) => {
      console.error('[LandStack DB] Unexpected error on idle client:', err);
    });
  }
  return globalThis.postgresPool;
}

/**
 * Run operations within a single dedicated client connection
 */
export async function withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const p = getPool();
  const client = await p.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

/**
 * Execute a query against Supabase PostGIS
 */
export async function query(text: string, params?: unknown[]): Promise<QueryResult> {
  const p = getPool();
  const start = Date.now();
  const res = await p.query(text, params);
  const duration = Date.now() - start;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[DB] ${text.substring(0, 80)}... (${duration}ms, ${res.rowCount} rows)`);
  }

  return res;
}

/**
 * Test database connection and PostGIS availability
 */
export async function testConnection(): Promise<{
  connected: boolean;
  postgis_version: string | null;
  message: string;
}> {
  try {
    const res = await query('SELECT PostGIS_Version() AS version');
    return {
      connected: true,
      postgis_version: res.rows[0].version,
      message: `PostGIS ${res.rows[0].version} connected successfully`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      postgis_version: null,
      message: `Connection failed: ${message}`,
    };
  }
}

/**
 * Get parcel as GeoJSON by ULPIN
 */
export async function getParcelGeoJSON(ulpin: string) {
  const res = await query(
    `SELECT
       parcel_id,
       ulpin,
       survey_number,
       area,
       land_type,
       ST_AsGeoJSON(geom)::json AS geometry
     FROM gis.parcels
     WHERE ulpin = $1`,
    [ulpin]
  );
  return res.rows[0] || null;
}

/**
 * Find parcels within a bounding box
 */
export async function getParcelsInBBox(
  minLng: number, minLat: number, maxLng: number, maxLat: number
) {
  const res = await query(
    `SELECT
       parcel_id,
       ulpin,
       survey_number,
       land_type,
       ST_AsGeoJSON(geom)::json AS geometry
     FROM gis.parcels
     WHERE geom && ST_MakeEnvelope($1, $2, $3, $4, 4326)`,
    [minLng, minLat, maxLng, maxLat]
  );
  return res.rows;
}

/**
 * Find restrictions that intersect a parcel
 */
export async function getParcelRestrictions(parcelId: string) {
  const res = await query(
    `SELECT
       r.restriction_id,
       r.restriction_type,
       r.restriction_name,
       r.severity,
       r.description
     FROM gis.restriction_zones r
     JOIN gis.parcels p ON ST_Intersects(p.geom, r.geom)
     WHERE p.parcel_id = $1`,
    [parcelId]
  );
  return res.rows;
}
