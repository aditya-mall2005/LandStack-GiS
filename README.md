# LandStack

Integrated GIS-based Digital Public Infrastructure for Land Governance.
Built for **SIH 2026 -- Problem Statement #26014**, Department of Land Resources, Government of India.

---

## Table of Contents

- [Problem Statement (Original)](#problem-statement-original)
- [What is LandStack?](#what-is-landstack)
- [How Does It Work?](#how-does-it-work)
- [What Have We Built?](#what-have-we-built)
- [Why This Tech Stack?](#why-this-tech-stack)
- [Project Structure](#project-structure)
- [How is the Database Designed?](#how-is-the-database-designed)
- [What Data Are We Using?](#what-data-are-we-using)
- [How Do State Adapters Work?](#how-do-state-adapters-work)
- [What AI/ML Have We Integrated?](#what-aiml-have-we-integrated)
- [How is Security Handled?](#how-is-security-handled)
- [API Endpoints](#api-endpoints)
- [How to Run Locally](#how-to-run-locally)
- [What is Planned Next?](#what-is-planned-next)

---

## Problem Statement (Original)

> **Source**: Smart India Hackathon 2026 -- PS #26014

### Background

Land governance in India involves multiple institutions maintaining land-related information in fragmented and disconnected systems. Core datasets such as cadastral maps, Record of Rights (RoR), registration records, land use information, Master Plan, Building Permission, Restrictions, property taxation records, utility infrastructure, and other land-related databases are often managed independently by different departments and agencies with limited interoperability. This results in duplication of effort, inconsistencies in records, delays in obtaining ownership information, lack of transparency in transactions, and inconvenience to citizens seeking land-related services.

The growing scale of urbanization, increasing land transactions, demand for efficient governance, and the need for transparent and citizen-centric public service delivery require a modern digital approach to land administration. With advances in GIS technologies, Digital Public Infrastructure (DPI), cloud computing, interoperable APIs, AI/ML analytics, and geospatial standards, there is an opportunity to transform land governance through a unified digital ecosystem. Land Stack is envisaged as an integrated GIS-based digital platform that brings together all land-related datasets, workflows, and services into a single interoperable framework. Built upon georeferenced cadastral maps and linked with Record of Rights (land ownership records), Land Stack can serve as foundational digital infrastructure for efficient land governance, informed decision making, improved service delivery. The proposed platform should support both rural and urban contexts and enable seamless coordination across departments, institutions, and citizen interfaces.

### Detailed Description

The Department of Land Resources has initiated the development and deployment of Land Stack in pilot locations of Chandigarh and Tamil Nadu, launched on 31 December 2025. Following successful implementation, the platform is proposed to be expanded across India by covering one city and one village in every State and Union Territory, and subsequently scaled to achieve nationwide coverage. One of the major challenges in India is that land is a State subject, resulting in significant diversity in land administration systems across states. Variations exist in land record formats, database structures, units of measurement, number and type of fields, language, terminology, and administrative workflows.

Therefore, the challenge is to conceptualize and develop a scalable prototype of Land Stack capable of integrating diverse land-related datasets, workflows, and services into a common interoperable State-level framework.

The proposed Land Stack solution should organize information into three broad categories of spatial layers. The base layer should comprise georeferenced cadastral maps, parcel boundaries, and unique parcel identifiers such as ULPIN.

This foundational layer should provide the spatial framework upon which all governance and service-related datasets can be integrated. The essential layers should include core governance datasets linked to each parcel, such as Record of Rights (RoR), registration data, master plans, building permissions and approvals, encumbrance and mortgage records, land use and zoning information. These layers should collectively define ownership, rights, restrictions, liabilities, and permissible land use associated with each parcel. Beyond this, additional or use-case layers should extend the platform's governance and citizen service capabilities by integrating datasets such as utility infrastructure, property taxation records, valuation references, infrastructure networks, environmental or restriction zones, and other service linkages. Each land parcel should be uniquely identifiable and linked with multiple layers of governance and administrative information, with ULPIN serving as the suggested common identifier. The prototype should demonstrate integration of multiple land-related domains through parcel-level GIS visualization and data exploration tools. The system should support interoperability between departmental systems through open APIs, standardized metadata structures, secure authentication mechanisms, role-based access controls, audit trails, and scalable digital architecture. Citizen-facing capabilities such as parcel search, ownership verification, transaction status tracking, service requests, and access to land-related information should also be incorporated.

Participants are encouraged to integrate innovative technologies including Artificial Intelligence (AI), Machine Learning (ML), satellite imagery-based change detection, predictive analytics, workflow automation, and decision-support dashboards to improve transparency, operational efficiency, and governance outcomes. The overall solution should be modular, scalable, configurable for different administrative contexts, and capable of serving as a replicable national framework for integrated digital land governance.

### Expected Solution

The expected outcome is a functional prototype demonstrating the concept of Land Stack as an integrated GIS-based Digital Public Infrastructure for land governance. The solution should provide a unified digital platform capable of integrating multiple land-related datasets around a parcel-centric spatial framework and enabling seamless interaction between governance institutions, land administration agencies, and citizens. The prototype should demonstrate GIS-based parcel visualization, integration of mock or sample land-related datasets, role-based administrative dashboards, citizen-facing service interfaces, and interoperable workflows between land records, registration, dispute, planning, and fiscal systems.

The proposed solution should showcase efficient parcel-level information access, real-time or simulated workflow integration, cross-departmental data interoperability, analytics-driven governance insights, and transparent citizen service delivery mechanisms. Innovative solutions that leverage AI/ML, geospatial intelligence, predictive analytics, workflow automation, API-based integration, mobile accessibility, and secure cloud-native architecture will be preferred.

The final prototype should demonstrate how fragmented land governance systems can be transformed into a unified, scalable, transparent, and citizen-centric Land Stack platform capable of improving land administration, enabling citizens to take informed decisions, accelerating transactions, strengthening planning, and enabling data-driven governance.

Further, participants are expected to prepare a Standard Technical Document containing details of API standards, interoperability standards, data schemas, system architecture, GIS standards, security frameworks, UI/UX guidelines, color schemas, and deployment and scalability considerations.

---

## What is LandStack?

LandStack is a **parcel-centric platform** -- meaning everything revolves around a single land parcel.

Think of it this way: pick any piece of land in India. Right now, its ownership record sits with the Revenue department, its registration deed is with the Sub-Registrar, its tax record is with the Municipal body, its building permission is with the Planning department, and its map is with the Survey department. None of these systems talk to each other.

LandStack **brings all of that information together** on a single map, linked to a single parcel, accessible through a single interface. A citizen can search for a parcel and see everything about it -- who owns it, what restrictions apply, what taxes are due, whether there are disputes, what the zoning allows. An officer can verify records across departments without leaving the platform.

---

## How Does It Work?

The platform is built around four core ideas:

1. **Parcel is the center of everything.**
   Every record in the system (ownership, tax, dispute, building permit) is linked to a specific parcel. The parcel has a unique internal ID (UUID) and can also carry a ULPIN.

2. **Three data layers** (matching the problem statement):
   - **Base Layer** -- Cadastral maps, parcel boundaries, ULPIN identifiers
   - **Essential Layer** -- RoR, registrations, encumbrances, building permissions, land use, zoning
   - **Use-Case Layer** -- Property tax, disputes, utility infrastructure, environmental zones, circle rates

3. **State Adapters** handle the diversity problem.
   Bihar calls its land record "Jamabandi" and measures land in "Decimal/Katha". Tamil Nadu calls it "Chitta/Adangal" and measures in "Hectare/Cent". Our adapter framework takes each state's format and normalizes it into one common schema -- so the rest of the platform doesn't need to know which state the data came from.

4. **Role-based interfaces.**
   Citizens, Land Officers, and Admins each see a different view of the platform suited to their needs.

---

## What Have We Built?

### For Citizens
- **Parcel Search** -- search by ULPIN, survey number, or keyword
- **Land 360 View** -- a single page showing all records associated with a parcel (ownership, RoR, registration, encumbrances, tax, building permissions, land use, disputes, restrictions)
- **Service Requests** -- apply for ownership verification, encumbrance certificates, mutations, and other services online
- **Application Tracking** -- track the status of submitted applications
- **Multi-language Support** -- switch the UI language

### For Land Officers
- **Officer Dashboard** -- manage assigned parcels, review conflicts, process workflows
- **Conflict Resolution** -- view AI-flagged data conflicts and resolve them
- **Workflow Management** -- each task (ownership verification, mutation, building permission, tax assessment) follows defined steps with SLA deadlines

### For Administrators
- **Admin Dashboard** -- system-wide management
- **Data Import** -- ingest new state data through the adapter framework
- **Security & Audit** -- view audit logs, manage user roles, monitor system health
- **AI Intelligence** -- review anomaly detection results, satellite change detections, conflict summaries

### On the Map
- **Interactive GIS Map** -- parcels rendered on an interactive map using MapLibre GL
- **Spatial Queries** -- the map only loads parcels visible in the current viewport (bounding-box queries)
- **Layer Overlays** -- roads, water bodies, utility infrastructure, environmental zones, master plan zones
- **Click-to-Inspect** -- click any parcel on the map to open its Land 360 view

---

## Why This Tech Stack?

```
LandStack Tech Stack
│
├── Frontend
│   ├── Next.js 16           -- React framework with server-side rendering
│   ├── React 19             -- UI component library
│   ├── TypeScript            -- Type safety across the codebase
│   ├── MapLibre GL           -- Open-source map rendering (no vendor lock-in)
│   └── Lucide React          -- Icon library
│
├── Backend
│   ├── Next.js API Routes    -- Server endpoints (same codebase as frontend)
│   ├── Axios                 -- HTTP client for external API calls
│   └── dotenv                -- Environment variable management
│
├── Database
│   ├── PostgreSQL + PostGIS  -- Relational DB with spatial/GIS capabilities
│   ├── Supabase              -- Managed PostgreSQL hosting with built-in auth
│   └── pg (node-postgres)    -- Database driver
│
├── Spatial / GIS
│   ├── PostGIS               -- Spatial indexing, geometry queries in the DB
│   ├── Turf.js               -- Client-side geospatial analysis
│   └── GeoJSON               -- Standard format for all spatial data
│
└── Quality
    └── ESLint                -- Code linting
```

**Why these choices?**

- **Next.js** -- full-stack in one codebase. The frontend and API run together, which reduces deployment complexity.
- **MapLibre GL** -- open-source, no API key needed, renders thousands of parcels smoothly. No vendor lock-in compared to Google Maps or Mapbox.
- **PostgreSQL + PostGIS** -- the industry standard for GIS databases. PostGIS lets us run spatial queries (e.g., "find all parcels within this bounding box") directly in SQL, which is much faster than doing it in application code.
- **Supabase** -- managed PostgreSQL with PostGIS pre-installed. No need to set up our own database server.
- **Turf.js** -- for any spatial calculations on the client side (area computation, bounding boxes, etc.).
- **TypeScript** -- catches bugs before runtime and makes the codebase easier to maintain as a team.

---

## Project Structure

```
Land-Stack-GiS/
├── src/
│   ├── app/                          -- All pages and API routes
│   │   ├── page.tsx                  -- Landing page
│   │   ├── layout.tsx                -- Root layout
│   │   ├── globals.css               -- All styles
│   │   ├── map/                      -- Interactive map page
│   │   ├── parcel/[id]/              -- Parcel detail (Land 360)
│   │   ├── search/                   -- Search page
│   │   ├── services/[type]/          -- Service request pages
│   │   ├── applications/             -- Application tracker
│   │   ├── login/                    -- Login page
│   │   ├── admin/                    -- Admin dashboard
│   │   ├── officer/                  -- Officer dashboard
│   │   └── api/v1/                   -- All backend API endpoints
│   ├── components/                   -- Reusable UI components
│   └── lib/                          -- Core logic
│       ├── adapters/                 -- State adapter framework
│       ├── ai/                       -- AI/ML modules
│       ├── i18n/                     -- Multi-language support
│       └── security/                 -- Auth, RBAC, audit, PII masking
├── database/
│   ├── migrations/                   -- SQL schema (creates all tables)
│   └── seeds/                        -- Pilot data inserts
├── data/                             -- Source datasets (Bihar, TN, Chandigarh)
├── scripts/                          -- Data ingestion and seed scripts
└── package.json
```

---

## How is the Database Designed?

The database is organized into **five schemas**, each handling a distinct concern:

```
PostgreSQL + PostGIS
│
├── gis              -- Spatial tables
│   ├── parcels              (the core entity -- everything links here)
│   ├── parcel_identifiers   (cross-department ID mapping)
│   ├── land_use_zones
│   ├── master_plan_zones
│   ├── restriction_zones
│   ├── roads, buildings, utility_networks, water_bodies
│   └── admin_boundaries     (State > District > Village hierarchy)
│
├── land             -- Land governance
│   ├── owners               (owner details)
│   ├── parcel_ownership     (many-to-many: one parcel can have multiple owners)
│   ├── ror_records          (Record of Rights -- Jamabandi/Chitta)
│   ├── mutations            (ownership changes)
│   ├── data_conflicts       (AI-flagged inconsistencies)
│   └── satellite_detections (change detection results)
│
├── governance       -- Departmental records
│   ├── registrations        (sale deeds, transfers)
│   ├── encumbrances         (mortgages, liens)
│   ├── building_permissions (construction approvals)
│   ├── property_tax         (tax assessment and payment)
│   ├── disputes             (court cases)
│   └── circle_rates         (valuation zone rates)
│
├── metadata         -- Data provenance
│   ├── data_sources         (where data came from)
│   ├── data_lineage         (field-level source tracking)
│   └── state_adapters       (adapter configs, stored as JSONB)
│
└── audit            -- Accountability
    ├── audit_logs           (who did what, when, with full diff)
    └── users                (user accounts and roles)
```

**Key design decisions:**

- The internal primary key is a UUID (`parcel_id`), not ULPIN. ULPIN is stored separately and is nullable because not all pilot data has it assigned yet.
- Owners and parcels have a many-to-many relationship (handles joint ownership).
- All geometry columns use `MultiPolygon` and have GIST spatial indexes for fast queries.
- Every change is tracked in `audit.audit_logs` with a JSONB diff of what changed.
- `metadata.data_lineage` tracks which department/source each field value came from.

---

## What Data Are We Using?

We have pilot data for **three states**: Bihar, Chandigarh, and Tamil Nadu.

The data uses **authentic governance record structures** (real field names, real formats, real hierarchies) but with **synthetic geometry and values** for the prototype. This means the data schemas match what a real deployment would use, but no real citizen data is in the system.

### Bihar Pilot (30 parcels -- our primary demo)

| Layer | What it contains |
|---|---|
| **Base** | 30 cadastral parcels (GeoJSON), ULPIN index, data conflict registry |
| **Essential** | Jamabandi RoR, registration records, encumbrances, building permissions, land use, zoning/master plan |
| **Use-Case** | Property tax, disputes, circle rates, utility connections, utility infrastructure, roads, water bodies, environmental zones, AI conflict summaries |

### Chandigarh and Tamil Nadu

Same three-layer structure with their own state-specific field names and formats. Each state's data is normalized through its adapter before entering the common database.

### Pan-India Reference

Administrative boundary hierarchy (State > District > Sub-district) for all States and UTs, used for search and navigation.

---

## How Do State Adapters Work?

This is one of our key innovations. Since land is a State subject, every state has different terminology:

| Concept | Bihar | Tamil Nadu | Chandigarh |
|---|---|---|---|
| Land record name | Jamabandi / Khatiyan | Chitta / Adangal / Patta | Property Register |
| Survey number field | khesra_number | survey_number | property_id |
| Owner name field | raiyat_name | pattadar_name | owner_name |
| Area unit | Decimal / Katha | Hectare / Cent | Square Yards |
| Admin hierarchy | Zila > Anchal > Mauza | District > Taluk > Village | Sector > Block |

Our **State Adapter Framework** solves this:
1. Each state has a registered adapter with its field mappings and unit conversions.
2. When data comes in from a state, the adapter translates it into our canonical (common) schema.
3. The rest of the platform works with the canonical schema only -- it doesn't need to know Bihar says "raiyat_name" while Tamil Nadu says "pattadar_name".
4. Adding a new state means writing a new adapter config -- no changes to the core platform.

Currently registered adapters: **Bihar (BR)**, **Tamil Nadu (TN)**, **Chandigarh (CH)**.

---

## What AI/ML Have We Integrated?

| Module | What it does | Example |
|---|---|---|
| **Anomaly Detection** | Scans land records for inconsistencies | Flags a parcel where the registered area is 500 sq.m but the RoR says 2000 sq.m |
| **Conflict Engine** | Cross-references records to find overlapping or contradictory data | Two different people claim ownership of the same parcel based on different department records |
| **Document Extraction** | Processes scanned land documents to extract structured data | Reads a scanned sale deed and extracts buyer name, seller name, area, and amount |
| **Satellite Change Detection** | Compares satellite imagery over time to detect unauthorized changes | Detects new construction on agricultural land |
| **AI Assistant** | Conversational interface for land-related queries | "Show me all disputed parcels in Patna district" |

---

## How is Security Handled?

| Concern | How we handle it |
|---|---|
| **Authentication** | Supabase Auth with session-based login |
| **Authorization** | Role-Based Access Control (RBAC) -- Citizens, Land Officers, and Admins see different data and pages |
| **Route Protection** | Every page checks the user's role before rendering; unauthorized users are redirected |
| **PII Masking** | Sensitive information (Aadhaar numbers, full names) is masked based on the viewer's role |
| **Audit Trail** | Every data change is logged with who, what, when, and a full diff of what changed |
| **Input Validation** | All user inputs are validated and sanitized before processing |
| **Rate Limiting** | API endpoints are rate-limited to prevent abuse |

---

## API Endpoints

All endpoints are under `/api/v1/`.

**Parcel endpoints:**
- `GET /parcels?bbox=minLng,minLat,maxLng,maxLat` -- get parcels visible in a map viewport
- `GET /parcels/:id` -- get a single parcel
- `GET /parcels/:id/land-profile` -- get the full Land 360 profile for a parcel

**Search:**
- `GET /search?q=...` -- search by ULPIN, survey number, or keyword

**Domain records (per parcel):**
- `GET /parcels/:id/ownership`
- `GET /parcels/:id/ror`
- `GET /parcels/:id/registration`
- `GET /parcels/:id/encumbrances`
- `GET /parcels/:id/land-use`
- `GET /parcels/:id/building-permissions`
- `GET /parcels/:id/tax`
- `GET /parcels/:id/restrictions`

---

## How to Run Locally

1. Clone the repo and install dependencies:
   ```
   git clone https://github.com/anirxddh/LandStack-GiS.git
   cd LandStack-GiS
   npm install
   ```

2. Create a `.env` file with your Supabase credentials:
   ```
   DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
   NEXT_PUBLIC_SUPABASE_URL=https://[ref].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
   ```

3. Seed the database:
   ```
   npm run seed
   ```

4. Start the dev server:
   ```
   npm run dev
   ```
   Open `http://localhost:3000`.

---

## What is Planned Next?

### Near-term
- Mobile-friendly UI for field officers working on tablets
- Offline mode with local caching for areas with poor connectivity
- Real satellite imagery from ISRO Bhuvan or Sentinel-2 (currently simulated)
- Document upload with OCR for scanned land records

### Medium-term
- Onboard more states using the adapter framework
- DigiLocker and Aadhaar integration for citizen identity verification
- Online payment for property tax, stamp duty, and service fees
- SMS/email notifications for application status and SLA alerts
- Predictive analytics for land valuation and encroachment risk

### Long-term
- Blockchain-backed audit trail for ownership transfers
- Federation model so each state runs its own instance but data is queryable nationally
- 3D cadastre for multi-story buildings and underground assets
- Open Data portal for researchers and policymakers
- Integration with NSDI (National Spatial Data Infrastructure) and NGDRS (National Generic Document Registration System)

---

## License

Developed as part of Smart India Hackathon 2026. Not currently under any open-source license.
