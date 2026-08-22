import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

const DEPARTMENT_MAP: Record<string, string> = {
  "ownership-verification": "Revenue Department",
  "ror-extract": "Revenue Department",
  "encumbrance-certificate": "Registration Department",
  "building-permission": "Municipal Authority",
  "land-use-certificate": "Planning Department",
  "property-tax": "Municipal Authority",
  "mutation": "Revenue Department",
  "restriction-check": "Environment Department",
};

const SERVICE_TITLES: Record<string, string> = {
  "ownership-verification": "Ownership Verification",
  "ror-extract": "RoR Extract",
  "encumbrance-certificate": "Encumbrance Certificate",
  "building-permission": "Building Permission",
  "land-use-certificate": "Land Use Certificate",
  "property-tax": "Property Tax Query",
  "mutation": "Property Mutation",
  "restriction-check": "Restriction Check",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      service_type,
      parcel_ulpin,
      applicant_name = "Ramesh Kumar",
      applicant_email,
      applicant_phone,
      purpose,
      details = {},
      priority = "NORMAL",
    } = body;

    if (!service_type) {
      return NextResponse.json({ error: "service_type is required" }, { status: 400 });
    }

    // Generate formatted Application ID
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const applicationNo = `LS-2026-${randomNum}`;

    const department = DEPARTMENT_MAP[service_type] || "Revenue Department";
    const serviceTitle = SERVICE_TITLES[service_type] || service_type;

    // Look up parcel_id if ULPIN is provided
    let parcelId: string | null = null;
    if (parcel_ulpin) {
      const pRes = await query(
        `SELECT parcel_id FROM gis.parcels WHERE ulpin = $1 OR parcel_id::text = $1 LIMIT 1`,
        [parcel_ulpin]
      );
      if (pRes.rows.length > 0) {
        parcelId = pRes.rows[0].parcel_id;
      }
    }

    // Insert service request
    const insertRes = await query(
      `INSERT INTO governance.service_requests (
        application_no, service_type, parcel_id, parcel_ulpin,
        applicant_name, applicant_email, applicant_phone, department,
        purpose, details, priority, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'SUBMITTED', NOW(), NOW())
      RETURNING *`,
      [
        applicationNo,
        serviceTitle,
        parcelId,
        parcel_ulpin,
        applicant_name,
        applicant_email,
        applicant_phone,
        department,
        purpose,
        JSON.stringify(details),
        priority,
      ]
    );

    // Insert history entry
    await query(
      `INSERT INTO governance.application_history (application_no, status, action, performed_by, created_at)
       VALUES ($1, 'SUBMITTED', 'Application submitted by citizen', $2, NOW())`,
      [applicationNo, applicant_name]
    );

    return NextResponse.json({
      success: true,
      application: insertRes.rows[0],
      message: `Application ${applicationNo} submitted successfully!`,
    }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[API /api/v1/services] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
