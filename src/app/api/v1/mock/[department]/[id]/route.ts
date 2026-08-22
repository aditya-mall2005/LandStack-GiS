import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ department: string; id: string }> }
) {
  try {
    const { department, id } = await params;
    const dept = (department || "").toLowerCase();

    // Query parcel
    const pRes = await query(
      `SELECT parcel_id, ulpin, survey_number, area, land_type, state_code, district_code, village_code
       FROM gis.parcels
       WHERE parcel_id::text = $1 OR ulpin = $1 OR survey_number = $1
       LIMIT 1`,
      [id]
    );

    const parcel = pRes.rows[0] || {
      parcel_id: id,
      ulpin: `IN-BR-10-${id}`,
      survey_number: id,
      area: 1420,
      land_type: "Agricultural",
      village_code: "Basopatti"
    };

    if (dept === "revenue" || dept === "land-records") {
      return NextResponse.json({
        department: "Revenue & Land Records Department (State Portal)",
        system: "Bihar Bhumi / Jamabandi Panji-II",
        status: "ACTIVE",
        sync_timestamp: new Date().toISOString(),
        data: {
          khesra_no: parcel.survey_number,
          khata_no: "45",
          raiyat_name: "Rameshwar Prasad Yadav",
          pita_naam: "Late Jamun Yadav",
          rakba_decimal: 35.5,
          rakba_sqm: parcel.area,
          lagan_amount_inr: 45.0,
          lagan_status: "PAID_UP_TO_DATE",
          last_mutation_order: "MUT-2024-8891"
        }
      });
    }

    if (dept === "registration") {
      return NextResponse.json({
        department: "Department of Registration & Stamps",
        system: "e-Nibandhan Registry",
        status: "ACTIVE",
        sync_timestamp: new Date().toISOString(),
        data: {
          survey_number: parcel.survey_number,
          deed_number: "DEED/2026/8842",
          registration_date: "2026-08-10",
          transaction_type: "SALE",
          seller: "Late Jamun Yadav (Heirs)",
          buyer: "Rameshwar Prasad Yadav",
          transferred_area_sqm: 1350,
          consideration_amount: 1850000,
          stamp_duty_paid: 111000,
          encumbrance_status: "CLEAR"
        }
      });
    }

    if (dept === "planning") {
      return NextResponse.json({
        department: "Urban Development & Housing Department",
        system: "Master Plan 2035 GIS",
        status: "ACTIVE",
        sync_timestamp: new Date().toISOString(),
        data: {
          zone_code: "C-2",
          zone_name: "Commercial Arterial Corridor",
          permitted_use: "Commercial, Retail & Mixed-Use Residential",
          max_far: 2.5,
          max_height_meters: 15.0,
          setback_front_meters: 4.5,
          setback_rear_meters: 3.0
        }
      });
    }

    if (dept === "tax" || dept === "municipality") {
      return NextResponse.json({
        department: "Basopatti Nagar Panchayat (Municipal Corporation)",
        system: "e-NagarSeva Property Tax",
        status: "ACTIVE",
        sync_timestamp: new Date().toISOString(),
        data: {
          property_id: `PT-BASO-${parcel.survey_number}`,
          assessment_year: "2025-2026",
          owner_name: "Rameshwar Prasad Yadav",
          annual_tax_inr: 3200,
          paid_inr: 3200,
          due_inr: 0,
          status: "ASSESSED_PAID"
        }
      });
    }

    return NextResponse.json({
      department: `${department.toUpperCase()} Authority`,
      status: "CONNECTED",
      sync_timestamp: new Date().toISOString(),
      parcel_id: parcel.parcel_id,
      ulpin: parcel.ulpin
    });
  } catch (err: any) {
    console.error("Mock department API error:", err);
    return NextResponse.json({ error: "Department API query failed", details: err.message }, { status: 500 });
  }
}
