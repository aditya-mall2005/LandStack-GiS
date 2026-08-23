# LandStack

Parcel-centric GIS platform for integrated land governance, built for SIH 2026 Problem 26014.

## Workspace

- `apps/web` — Next.js frontend (map and Land 360 interface).
- `apps/api` — Express REST API (GIS and governance modules).
- `packages/contracts` — shared TypeScript API/domain contracts.
- `data` — supplied source and prototype data; treated as input, not application state.

Authentication will use Better Auth (not JWT); the map client will use Leaflet (not MapLibre).

## Local setup

1. Copy `apps/api/.env.example` to `apps/api/.env` and set the Supabase database URL.
2. Copy `apps/web/.env.example` to `apps/web/.env.local`.
3. Run `npm install` and then `npm run dev`.

The database schema and seed process are introduced in Phase 2 and Phase 3.

## Database migrations

After enabling PostGIS in Supabase and adding `DATABASE_URL` to `apps/api/.env`, run `npm run migrate -w @landstack/api`. The migration creates the canonical LandStack schemas and PostGIS indexes. Generate the synthetic spatial pilot with `npm run generate:spatial-pilot`.

## Pilot seed

Run `npm run generate:spatial-pilot`, followed by `npm run seed:pilot -w @landstack/api`, to seed the 30-parcel Bihar pilot. The supplied governance records are normalized while all generated geometry remains labelled `synthetic_demo`.

## Parcel API

Start the API with `npm run dev -w @landstack/api`. The public Phase 4 endpoints are rooted at `/api/v1/parcels`:

- `GET /?bbox=minLng,minLat,maxLng,maxLat` — viewport-scoped GeoJSON feature collection.
- `GET /search?q=ULPIN-or-survey-number` — ULPIN/survey-number search.
- `GET /:id` and `GET /:id/land-profile` — parcel feature and Land 360 profile.
- `GET /:id/{ownership,ror,registration,encumbrances,land-use,building-permissions,tax,restrictions}` — domain records.
