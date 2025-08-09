import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDatabase();
  const stmt = db.prepare(
    `SELECT latitude AS lat, longitude AS lon, COUNT(*) AS count
     FROM visits
     WHERE latitude IS NOT NULL AND longitude IS NOT NULL
     GROUP BY latitude, longitude
     ORDER BY count DESC
     LIMIT 5000;`
  );
  const rows = stmt.all() as { lat: number; lon: number; count: number }[];
  return NextResponse.json({ points: rows });
}
