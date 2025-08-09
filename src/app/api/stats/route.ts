import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDatabase();

  const totalVisits = (db
    .prepare("SELECT COUNT(*) AS c FROM visits")
    .get() as { c: number } | undefined)?.c ?? 0;
  const uniqueVisitors = (db
    .prepare("SELECT COUNT(DISTINCT ip_hash) AS c FROM visits")
    .get() as { c: number } | undefined)?.c ?? 0;

  const byCountry = (db
    .prepare(
      `SELECT COALESCE(country, 'Unknown') AS label, COUNT(*) AS count
       FROM visits
       GROUP BY COALESCE(country, 'Unknown')
       ORDER BY count DESC
       LIMIT 10;`
    )
    .all() as { label: string; count: number }[]);

  const byPath = (db
    .prepare(
      `SELECT COALESCE(path, 'Unknown') AS label, COUNT(*) AS count
       FROM visits
       GROUP BY COALESCE(path, 'Unknown')
       ORDER BY count DESC
       LIMIT 10;`
    )
    .all() as { label: string; count: number }[]);

  const dailyHits = (db
    .prepare(
      `SELECT strftime('%Y-%m-%d', created_at, 'unixepoch') AS day, COUNT(*) AS count
       FROM visits
       GROUP BY day
       ORDER BY day ASC;`
    )
    .all() as { day: string; count: number }[]);

  return NextResponse.json({ totalVisits, uniqueVisitors, byCountry, byPath, dailyHits });
}
