import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { getClientIp, geolocateIp } from "@/lib/ip";
import UAParser from "ua-parser-js";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const db = getDatabase();

  const headers = request.headers;
  const userAgent = headers.get("user-agent") || "";
  const referer = headers.get("referer");
  let path: string | null = null;
  let overrideLat: number | null = null;
  let overrideLon: number | null = null;

  try {
    // Allow client to send explicit path if needed
    const body = await request.json().catch(() => null);
    if (body) {
      if (typeof body.path === "string") {
        path = body.path;
      }
      if (typeof body.latitude === "number" && typeof body.longitude === "number") {
        overrideLat = body.latitude;
        overrideLon = body.longitude;
      }
    }
  } catch {}

  const ip = getClientIp(request);
  const geo = await geolocateIp(ip);

  const parser = new UAParser(userAgent);
  const deviceType = parser.getDevice().type || "desktop";
  const os = parser.getOS().name || null;
  const browser = parser.getBrowser().name || null;

  const salt = process.env.IP_SALT || "dev_salt";
  const ipHash = ip ? crypto.createHmac("sha256", salt).update(ip).digest("hex") : null;

  const createdAt = Math.floor(Date.now() / 1000);

  const stmt = db.prepare(
    `INSERT INTO visits (
      ip_hash, latitude, longitude, city, region, country,
      user_agent, device, os, browser, referer, path, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  stmt.run(
    ipHash,
    overrideLat ?? geo.latitude,
    overrideLon ?? geo.longitude,
    geo.city,
    geo.region,
    geo.country,
    userAgent,
    deviceType,
    os,
    browser,
    referer,
    path,
    createdAt
  );

  return NextResponse.json({ ok: true });
}
