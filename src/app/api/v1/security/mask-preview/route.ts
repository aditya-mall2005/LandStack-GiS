import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { projectParcelData } from "@/lib/security/pii-masker";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || "1051";

    const pRes = await query(
      `SELECT p.parcel_id, p.ulpin, p.survey_number, p.area, p.land_type, p.state_code, p.district_code, p.village_code,
              (SELECT json_agg(json_build_object('name', o.name, 'father_husband', o.father_husband, 'identifier_ref', o.identifier_ref, 'ownership_type', po.ownership_type, 'ownership_share', po.ownership_share))
               FROM land.parcel_ownership po JOIN land.owners o ON o.owner_id = po.owner_id WHERE po.parcel_id = p.parcel_id) as owners,
              (SELECT row_to_json(r) FROM (SELECT ror_id, khata_number, khesra_number, revenue_amount, land_classification FROM land.ror_records WHERE parcel_id = p.parcel_id LIMIT 1) r) as ror
       FROM gis.parcels p
       WHERE p.survey_number = $1 OR p.ulpin = $1 OR p.parcel_id::text = $1
       LIMIT 1`,
      [id]
    );

    let parcelRow = pRes.rows[0];
    if (!parcelRow) {
      const fallbackRes = await query(
        `SELECT p.parcel_id, p.ulpin, p.survey_number, p.area, p.land_type, p.state_code, p.district_code, p.village_code,
                (SELECT json_agg(json_build_object('name', o.name, 'father_husband', o.father_husband, 'identifier_ref', o.identifier_ref, 'ownership_type', po.ownership_type, 'ownership_share', po.ownership_share))
                 FROM land.parcel_ownership po JOIN land.owners o ON o.owner_id = po.owner_id WHERE po.parcel_id = p.parcel_id) as owners,
                (SELECT row_to_json(r) FROM (SELECT ror_id, khata_number, khesra_number, revenue_amount, land_classification FROM land.ror_records WHERE parcel_id = p.parcel_id LIMIT 1) r) as ror
         FROM gis.parcels p
         LIMIT 1`
      );
      parcelRow = fallbackRes.rows[0];
    }

    const citizenProjection = projectParcelData(parcelRow, "CITIZEN", false);
    const officerProjection = projectParcelData(parcelRow, "REVENUE_OFFICER", true);

    return NextResponse.json({
      success: true,
      parcel_survey: parcelRow.survey_number,
      projections: {
        citizen_public_view: citizenProjection,
        officer_authorized_view: officerProjection
      }
    });
  } catch (err: any) {
    console.error("Mask preview error:", err);
    return NextResponse.json({ error: "Failed to generate mask preview", details: err.message }, { status: 500 });
  }
}
