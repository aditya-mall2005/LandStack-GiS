-- ============================================================
-- LandStack — PostGIS Database Schema (v2)
-- SIH 2026 | PS #26014
--
-- Architecture follows GPT-recommended parcel-centric model:
--   gis.*        — Spatial tables (parcels, roads, zones)
--   land.*       — Land governance (owners, RoR, ownership)
--   governance.* — Departmental (registration, tax, permits)
--   metadata.*   — Data provenance & lineage
--   audit.*      — Accountability & transparency
--
-- Key design decisions:
--   1. parcel_id (UUID) is the internal primary key, NOT ULPIN
--   2. ULPIN stored separately and nullable (not all data has it)
--   3. parcel_identifiers table for cross-department ID mapping
--   4. Separate owners table with many-to-many parcel_ownership
--   5. MultiPolygon geometry (safer for complex parcels)
--   6. GIST spatial indexes on ALL geometry columns
--   7. metadata.data_lineage for field-level provenance
--
-- Run migration via Supabase: node scripts/migrate-supabase.js
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- SCHEMAS
-- ============================================================
CREATE SCHEMA IF NOT EXISTS gis;
CREATE SCHEMA IF NOT EXISTS land;
CREATE SCHEMA IF NOT EXISTS governance;
CREATE SCHEMA IF NOT EXISTS metadata;
CREATE SCHEMA IF NOT EXISTS audit;

-- ============================================================
-- GIS SCHEMA — Spatial Tables
-- ============================================================

-- PARCELS — the core entity, everything links here
CREATE TABLE gis.parcels (
    parcel_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- External identifiers (nullable — not all data has ULPIN)
    ulpin           VARCHAR(100),

    -- Administrative hierarchy (state-agnostic field names)
    state_code      VARCHAR(20),
    district_code   VARCHAR(50),
    subdistrict_code VARCHAR(50),
    village_code    VARCHAR(50),

    -- Canonical parcel fields
    survey_number   VARCHAR(100),  -- Khesra (Bihar) / Survey No (TN) / Khasra (CH)
    area            NUMERIC,
    area_unit       VARCHAR(20) DEFAULT 'sq_meters',
    land_type       VARCHAR(100),

    -- Source tracking
    source_system   VARCHAR(100),

    -- Geometry: MultiPolygon for safety (handles complex parcels)
    geom            GEOMETRY(MultiPolygon, 4326),

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX parcels_geom_idx ON gis.parcels USING GIST (geom);
CREATE INDEX parcels_ulpin_idx ON gis.parcels (ulpin);
CREATE INDEX parcels_state_idx ON gis.parcels (state_code);
CREATE INDEX parcels_district_idx ON gis.parcels (district_code);
CREATE INDEX parcels_village_idx ON gis.parcels (village_code);
CREATE INDEX parcels_survey_idx ON gis.parcels (survey_number);

-- PARCEL IDENTIFIERS — cross-department ID mapping
-- "One of the most important tables" (GPT)
-- Maps: ULPIN, Khesra, Khata, Property ID, Registration ID → parcel_id
CREATE TABLE gis.parcel_identifiers (
    identifier_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id       UUID NOT NULL,

    identifier_type  VARCHAR(50) NOT NULL,  -- ULPIN, KHESRA, KHATA, PROPERTY_ID, etc.
    identifier_value VARCHAR(200) NOT NULL,

    source_system    VARCHAR(100),
    is_primary       BOOLEAN DEFAULT FALSE,

    created_at      TIMESTAMPTZ DEFAULT NOW(),

    FOREIGN KEY (parcel_id) REFERENCES gis.parcels(parcel_id) ON DELETE CASCADE
);

CREATE INDEX parcel_ids_parcel_idx ON gis.parcel_identifiers (parcel_id);
CREATE INDEX parcel_ids_type_value_idx ON gis.parcel_identifiers (identifier_type, identifier_value);

-- LAND USE ZONES — spatial, determined by ST_Intersects
CREATE TABLE gis.land_use_zones (
    zone_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_code       VARCHAR(50),
    zone_name       VARCHAR(100),
    source_system   VARCHAR(100),
    geom            GEOMETRY(MultiPolygon, 4326)
);

CREATE INDEX land_use_geom_idx ON gis.land_use_zones USING GIST (geom);

-- MASTER PLAN ZONES
CREATE TABLE gis.master_plan_zones (
    zone_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id         UUID,
    zone_code       VARCHAR(50),
    zone_name       VARCHAR(100),
    permitted_use   TEXT,
    max_far         NUMERIC(4,2),
    max_height_m    NUMERIC(5,1),
    source_system   VARCHAR(100),
    geom            GEOMETRY(MultiPolygon, 4326)
);

CREATE INDEX master_plan_geom_idx ON gis.master_plan_zones USING GIST (geom);

-- RESTRICTION ZONES — environmental, heritage, flood, etc.
CREATE TABLE gis.restriction_zones (
    restriction_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restriction_type VARCHAR(100),  -- FLOOD_ZONE, FOREST, PROTECTED_AREA, etc.
    restriction_name VARCHAR(255),
    severity         VARCHAR(50),   -- HIGH, MEDIUM, LOW
    description      TEXT,
    source_system    VARCHAR(100),
    geom             GEOMETRY(MultiPolygon, 4326)
);

CREATE INDEX restriction_geom_idx ON gis.restriction_zones USING GIST (geom);

-- ROADS
CREATE TABLE gis.roads (
    road_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255),
    road_type       VARCHAR(100),  -- primary, secondary, tertiary, track
    surface         VARCHAR(50),
    lanes           INTEGER,
    width_m         NUMERIC(5,1),
    source_system   VARCHAR(100),
    geom            GEOMETRY(MultiLineString, 4326)
);

CREATE INDEX roads_geom_idx ON gis.roads USING GIST (geom);

-- BUILDINGS
CREATE TABLE gis.buildings (
    building_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_type   VARCHAR(100),
    floors          INTEGER,
    source_system   VARCHAR(100),
    geom            GEOMETRY(MultiPolygon, 4326)
);

CREATE INDEX buildings_geom_idx ON gis.buildings USING GIST (geom);

-- UTILITY NETWORKS — generic (electricity, water, sewer, gas, telecom)
CREATE TABLE gis.utility_networks (
    utility_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utility_type    VARCHAR(100),  -- ELECTRICITY, WATER, SEWER, GAS, TELECOM
    provider        VARCHAR(255),
    source_system   VARCHAR(100),
    geom            GEOMETRY(Geometry, 4326)  -- Point, Line, or Polygon
);

CREATE INDEX utility_geom_idx ON gis.utility_networks USING GIST (geom);

-- WATER BODIES
CREATE TABLE gis.water_bodies (
    water_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255),
    water_type      VARCHAR(50),   -- River, Pond, Canal, Lake
    status          VARCHAR(50),   -- Perennial, Seasonal
    source_system   VARCHAR(100),
    geom            GEOMETRY(Geometry, 4326)
);

CREATE INDEX water_geom_idx ON gis.water_bodies USING GIST (geom);

-- ADMINISTRATIVE BOUNDARIES
CREATE TABLE gis.admin_boundaries (
    boundary_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255),
    level           VARCHAR(50),   -- state, district, subdistrict, village, ward
    parent_id       UUID,
    state_code      VARCHAR(20),
    geom            GEOMETRY(MultiPolygon, 4326),
    FOREIGN KEY (parent_id) REFERENCES gis.admin_boundaries(boundary_id)
);

CREATE INDEX admin_geom_idx ON gis.admin_boundaries USING GIST (geom);

-- ============================================================
-- LAND SCHEMA — Ownership & Records
-- ============================================================

-- OWNERS — separate entity (don't put owner info inside parcels)
CREATE TABLE land.owners (
    owner_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_type       VARCHAR(30),   -- Individual, Joint, Government, Trust, Company
    name             VARCHAR(255),
    father_husband   VARCHAR(255),
    identifier_ref   VARCHAR(100),  -- Aadhaar hash or internal ref (no real PII)
    source_system    VARCHAR(100),
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- PARCEL OWNERSHIP — many-to-many (one parcel can have multiple owners)
CREATE TABLE land.parcel_ownership (
    parcel_id        UUID NOT NULL,
    owner_id         UUID NOT NULL,
    ownership_type   VARCHAR(50),   -- Raiyat, Co-owner, Lessee, Govt
    ownership_share  NUMERIC,       -- 50%, 30%, etc.
    valid_from       DATE,
    valid_to         DATE,
    source_system    VARCHAR(100),

    PRIMARY KEY (parcel_id, owner_id),
    FOREIGN KEY (parcel_id) REFERENCES gis.parcels(parcel_id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES land.owners(owner_id) ON DELETE CASCADE
);

-- ROR RECORDS (Jamabandi / Chitta / Khewat)
CREATE TABLE land.ror_records (
    ror_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id        UUID NOT NULL,

    khata_number     VARCHAR(100),
    khesra_number    VARCHAR(100),

    record_status    VARCHAR(50),
    land_classification VARCHAR(100),

    area             NUMERIC,
    area_unit        VARCHAR(20),

    revenue_amount   NUMERIC(10,2),
    revenue_status   VARCHAR(30),

    effective_from   DATE,
    effective_to     DATE,

    source_system    VARCHAR(100),
    created_at       TIMESTAMPTZ DEFAULT NOW(),

    FOREIGN KEY (parcel_id) REFERENCES gis.parcels(parcel_id) ON DELETE CASCADE
);

CREATE INDEX ror_parcel_idx ON land.ror_records (parcel_id);

-- MUTATIONS
CREATE TABLE land.mutations (
    mutation_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id        UUID NOT NULL,

    mutation_type    VARCHAR(50),   -- Varasat, Bikri, Vibhajan, Dan, Court Order
    previous_owner   VARCHAR(255),
    new_owner        VARCHAR(255),
    order_number     VARCHAR(100),

    mutation_date    DATE,
    status           VARCHAR(30) DEFAULT 'Pending',

    source_system    VARCHAR(100),
    created_at       TIMESTAMPTZ DEFAULT NOW(),

    FOREIGN KEY (parcel_id) REFERENCES gis.parcels(parcel_id) ON DELETE CASCADE
);

-- DATA CONFLICTS — AI-detected cross-departmental inconsistencies
CREATE TABLE land.data_conflicts (
    conflict_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id        UUID,

    conflict_type    VARCHAR(50),   -- owner_name_mismatch, land_use_violation, etc.
    severity         VARCHAR(20),   -- CRITICAL, HIGH, MEDIUM, LOW

    source_a         VARCHAR(50),
    value_a          TEXT,
    source_b         VARCHAR(50),
    value_b          TEXT,

    detected_at      TIMESTAMPTZ DEFAULT NOW(),
    resolved         BOOLEAN DEFAULT FALSE,
    resolved_by      VARCHAR(100),
    resolved_at      TIMESTAMPTZ,

    FOREIGN KEY (parcel_id) REFERENCES gis.parcels(parcel_id) ON DELETE SET NULL
);

CREATE INDEX conflicts_parcel_idx ON land.data_conflicts (parcel_id);

-- SATELLITE CHANGE DETECTION
CREATE TABLE land.satellite_detections (
    detection_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id        UUID,

    detection_date   DATE,
    change_type      VARCHAR(100),
    confidence       NUMERIC(4,2),
    area_affected_sqm NUMERIC(10,2),
    alert_level      VARCHAR(20),

    before_date      DATE,
    after_date       DATE,
    source           VARCHAR(50),

    verified         BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (parcel_id) REFERENCES gis.parcels(parcel_id) ON DELETE SET NULL
);

-- ============================================================
-- GOVERNANCE SCHEMA — Departmental Records
-- ============================================================

-- REGISTRATIONS
CREATE TABLE governance.registrations (
    registration_id  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id        UUID NOT NULL,

    document_number  VARCHAR(100),
    registration_date DATE,
    transaction_type VARCHAR(100),  -- SALE, GIFT, LEASE, MORTGAGE, TRANSFER

    seller_reference VARCHAR(100),
    buyer_reference  VARCHAR(100),

    consideration_amount NUMERIC(15,2),
    stamp_duty       NUMERIC(12,2),
    registration_fee NUMERIC(10,2),

    status           VARCHAR(50),
    source_system    VARCHAR(100),

    FOREIGN KEY (parcel_id) REFERENCES gis.parcels(parcel_id) ON DELETE CASCADE
);

CREATE INDEX reg_parcel_idx ON governance.registrations (parcel_id);

-- ENCUMBRANCES
CREATE TABLE governance.encumbrances (
    encumbrance_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id        UUID NOT NULL,

    encumbrance_type VARCHAR(100),  -- Mortgage, Lien, Attachment
    institution      VARCHAR(255),
    reference_number VARCHAR(100),

    amount           NUMERIC(15,2),
    outstanding      NUMERIC(15,2),
    interest_rate    NUMERIC(5,2),

    start_date       DATE,
    end_date         DATE,
    status           VARCHAR(50) DEFAULT 'Active',

    source_system    VARCHAR(100),

    FOREIGN KEY (parcel_id) REFERENCES gis.parcels(parcel_id) ON DELETE CASCADE
);

CREATE INDEX enc_parcel_idx ON governance.encumbrances (parcel_id);

-- BUILDING PERMISSIONS
CREATE TABLE governance.building_permissions (
    permission_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id        UUID NOT NULL,

    application_number VARCHAR(100),
    applicant        VARCHAR(255),
    building_type    VARCHAR(100),
    approved_area    NUMERIC,
    floors           INTEGER,

    application_date DATE,
    approval_date    DATE,
    status           VARCHAR(50),

    source_system    VARCHAR(100),

    FOREIGN KEY (parcel_id) REFERENCES gis.parcels(parcel_id) ON DELETE CASCADE
);

CREATE INDEX bp_parcel_idx ON governance.building_permissions (parcel_id);

-- PROPERTY TAX
CREATE TABLE governance.property_tax (
    tax_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id        UUID NOT NULL,

    assessment_year  VARCHAR(20),
    owner_name       VARCHAR(255),

    annual_value     NUMERIC(12,2),
    tax_amount       NUMERIC(10,2),
    paid_amount      NUMERIC(10,2),
    due_amount       NUMERIC(10,2),
    arrears          NUMERIC(10,2) DEFAULT 0,

    status           VARCHAR(50),
    source_system    VARCHAR(100),

    FOREIGN KEY (parcel_id) REFERENCES gis.parcels(parcel_id) ON DELETE CASCADE
);

CREATE INDEX tax_parcel_idx ON governance.property_tax (parcel_id);

-- DISPUTES
CREATE TABLE governance.disputes (
    dispute_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id        UUID,

    dispute_type     VARCHAR(100),
    case_number      VARCHAR(100),
    court            VARCHAR(255),

    petitioner       VARCHAR(255),
    respondent       VARCHAR(255),

    filing_date      DATE,
    next_hearing     DATE,
    status           VARCHAR(50),

    stay_order       BOOLEAN DEFAULT FALSE,
    affects_transfer BOOLEAN DEFAULT FALSE,

    source_system    VARCHAR(100),

    FOREIGN KEY (parcel_id) REFERENCES gis.parcels(parcel_id) ON DELETE SET NULL
);

CREATE INDEX dispute_parcel_idx ON governance.disputes (parcel_id);

-- CIRCLE RATES / VALUATION
CREATE TABLE governance.circle_rates (
    rate_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_name        VARCHAR(255),
    land_type        VARCHAR(50),
    rate_per_unit    NUMERIC(12,2),
    unit             VARCHAR(30),
    effective_date   DATE,
    valid_till       DATE,
    source_system    VARCHAR(100)
);

-- ============================================================
-- METADATA SCHEMA — Data Provenance
-- ============================================================

-- DATA SOURCES — where each dataset came from
CREATE TABLE metadata.data_sources (
    source_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    system_name      VARCHAR(255),
    department       VARCHAR(255),
    state_code       VARCHAR(20),
    dataset_name     VARCHAR(255),
    version          VARCHAR(100),
    source_url       TEXT,
    format           VARCHAR(50),
    last_updated     TIMESTAMPTZ,
    license          TEXT,
    notes            TEXT
);

-- DATA LINEAGE — field-level provenance
-- Answers: "Where did this specific value come from?"
CREATE TABLE metadata.data_lineage (
    lineage_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type      VARCHAR(50),   -- parcel, ror, registration, etc.
    entity_id        UUID,
    field_name       VARCHAR(100),
    source_id        UUID,
    source_record_id VARCHAR(200),
    retrieved_at     TIMESTAMPTZ,
    transformation   TEXT,

    FOREIGN KEY (source_id) REFERENCES metadata.data_sources(source_id)
);

-- STATE ADAPTER CONFIGS — stored in DB for dynamic adapter loading
CREATE TABLE metadata.state_adapters (
    adapter_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state_code       VARCHAR(20) UNIQUE NOT NULL,
    state_name       VARCHAR(100),
    field_mapping    JSONB NOT NULL,        -- { "khesra_no": "survey_number", ... }
    unit_conversions JSONB,                  -- { "decimal_to_sqm": 40.4686, ... }
    land_type_mapping JSONB,                 -- { "Nanjai": "Agricultural (Wet)", ... }
    admin_hierarchy  TEXT[],                 -- ['State','District','Taluk','Village']
    ror_system_name  VARCHAR(100),           -- Jamabandi / Chitta / Khewat
    measurement_unit VARCHAR(50),            -- Decimal / Cent / Marla
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT SCHEMA — Accountability
-- ============================================================

CREATE TABLE audit.audit_logs (
    audit_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id         UUID,
    actor_name       VARCHAR(255),
    actor_role       VARCHAR(50),

    action           VARCHAR(100),  -- VIEW, CREATE, UPDATE, DELETE, APPROVE
    entity_type      VARCHAR(100),  -- parcel, ror, registration, etc.
    entity_id        UUID,

    old_value        JSONB,
    new_value        JSONB,

    ip_address       INET,
    timestamp        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX audit_entity_idx ON audit.audit_logs (entity_type, entity_id);
CREATE INDEX audit_actor_idx ON audit.audit_logs (actor_id);
CREATE INDEX audit_time_idx ON audit.audit_logs (timestamp);

-- AUTH (kept from v1)
CREATE TABLE audit.users (
    user_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username         VARCHAR(30) UNIQUE,
    name             VARCHAR(255),
    email            VARCHAR(255),
    role             VARCHAR(50),   -- citizen, revenue_officer, registration_officer, etc.
    department       VARCHAR(100),
    state_code       VARCHAR(20),
    password_hash    VARCHAR(255),
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VIEWS
-- ============================================================

-- LAND 360° VIEW — the centerpiece query
CREATE OR REPLACE VIEW land.land_360 AS
SELECT
    p.parcel_id,
    p.ulpin,
    p.survey_number,
    p.area,
    p.area_unit,
    p.land_type,
    p.state_code,
    p.district_code,
    p.village_code,

    -- Ownership (aggregated)
    (SELECT json_agg(json_build_object(
        'name', o.name,
        'type', po.ownership_type,
        'share', po.ownership_share
    )) FROM land.parcel_ownership po
    JOIN land.owners o ON o.owner_id = po.owner_id
    WHERE po.parcel_id = p.parcel_id
    ) AS owners,

    -- RoR
    (SELECT row_to_json(r) FROM land.ror_records r
     WHERE r.parcel_id = p.parcel_id
     ORDER BY r.created_at DESC LIMIT 1
    ) AS ror,

    -- Registrations count
    (SELECT COUNT(*) FROM governance.registrations reg
     WHERE reg.parcel_id = p.parcel_id
    ) AS total_transactions,

    -- Active encumbrances
    (SELECT COUNT(*) FROM governance.encumbrances e
     WHERE e.parcel_id = p.parcel_id AND e.status = 'Active'
    ) AS active_encumbrances,

    -- Building permits
    (SELECT COUNT(*) FROM governance.building_permissions bp
     WHERE bp.parcel_id = p.parcel_id
    ) AS building_permits,

    -- Tax arrears
    (SELECT COALESCE(SUM(t.arrears), 0) FROM governance.property_tax t
     WHERE t.parcel_id = p.parcel_id
    ) AS total_tax_arrears,

    -- Active disputes
    (SELECT COUNT(*) FROM governance.disputes d
     WHERE d.parcel_id = p.parcel_id AND d.status NOT IN ('Disposed', 'Settled')
    ) AS active_disputes,

    -- Unresolved conflicts
    (SELECT COUNT(*) FROM land.data_conflicts c
     WHERE c.parcel_id = p.parcel_id AND c.resolved = FALSE
    ) AS unresolved_conflicts,

    -- Geometry
    p.geom

FROM gis.parcels p;

-- ANALYTICS SUMMARY VIEW
CREATE OR REPLACE VIEW land.analytics_summary AS
SELECT
    state_code,
    district_code,
    COUNT(*) AS total_parcels,
    SUM(CASE WHEN land_type = 'Agricultural' THEN 1 ELSE 0 END) AS agricultural,
    SUM(CASE WHEN land_type = 'Residential' THEN 1 ELSE 0 END) AS residential,
    SUM(CASE WHEN land_type = 'Commercial' THEN 1 ELSE 0 END) AS commercial,
    SUM(area) AS total_area
FROM gis.parcels
GROUP BY state_code, district_code;

-- ============================================================
-- DONE
-- ============================================================
SELECT 'LandStack schema v2 created successfully!' AS status;
SELECT COUNT(*) AS table_count FROM information_schema.tables
WHERE table_schema IN ('gis','land','governance','metadata','audit');
