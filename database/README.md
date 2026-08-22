# LandStack Database

## Schema Architecture

```
PostgreSQL + PostGIS
│
├── gis                    ← Spatial tables
│   ├── parcels            ← Core entity (MultiPolygon, UUID PK)
│   ├── parcel_identifiers ← Cross-department ID mapping
│   ├── land_use_zones     ← Spatial land-use zoning
│   ├── master_plan_zones  ← Master plan areas
│   ├── restriction_zones  ← Environmental/heritage/flood
│   ├── roads              ← Road network (MultiLineString)
│   ├── buildings          ← Building footprints
│   ├── utility_networks   ← Infrastructure (Point/Line)
│   ├── water_bodies       ← Rivers, ponds, canals
│   └── admin_boundaries   ← State/District/Village hierarchy
│
├── land                   ← Land governance
│   ├── owners             ← Owner entities
│   ├── parcel_ownership   ← Many-to-many (owner ↔ parcel)
│   ├── ror_records        ← Record of Rights (Jamabandi/Chitta)
│   ├── mutations          ← Ownership changes
│   ├── data_conflicts     ← AI-detected inconsistencies
│   └── satellite_detections ← Change detection results
│
├── governance             ← Departmental records
│   ├── registrations      ← Property transactions
│   ├── encumbrances       ← Mortgage/lien/attachment
│   ├── building_permissions ← Construction permits
│   ├── property_tax       ← Tax assessment & payment
│   ├── disputes           ← Court cases
│   └── circle_rates       ← Valuation zones
│
├── metadata               ← Data provenance
│   ├── data_sources       ← Where data came from
│   ├── data_lineage       ← Field-level source tracking
│   └── state_adapters     ← State adapter configs (JSONB)
│
└── audit                  ← Accountability
    ├── audit_logs         ← Who did what when (JSONB diff)
    └── users              ← Auth users + roles
```

## Setup

```bash
# Start PostgreSQL + PostGIS
docker compose up -d

# Wait for container to be healthy
docker ps

# Run the schema migration
docker exec -i landstack-postgis psql -U landstack -d landstack < database/migrations/001_initial_schema.sql

# Test connection
node scripts/test-db.js
```

## Key Design Decisions

1. **parcel_id (UUID)** is the internal primary key, NOT ULPIN
2. **ULPIN is nullable** — not all pilot data has it
3. **parcel_identifiers** table enables cross-department ID mapping
4. **Separate owners table** with many-to-many ownership (handles joint ownership)
5. **MultiPolygon** geometry for safety (complex parcels)
6. **GIST spatial indexes** on all geometry columns
7. **metadata.data_lineage** for field-level provenance
8. **state_adapters** stored as JSONB for dynamic adapter loading
