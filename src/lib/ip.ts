function isCloudflare(headers: Headers): boolean {
  // Cloudflare typically injects several cf-* headers. We require at least one
  // auxiliary header in addition to cf-connecting-ip to reduce spoofing risk.
  const cfRay = headers.get("cf-ray");
  const cfVisitor = headers.get("cf-visitor");
  const cfCountry = headers.get("cf-ipcountry");
  return Boolean(cfRay || cfVisitor || cfCountry);
}

export function getClientIp(request: Request): string | null {
  const headers = request.headers;

  // Prefer Cloudflare when detected; CF sets and sanitizes these headers at the edge
  if (isCloudflare(headers)) {
    const cfIp = headers.get("cf-connecting-ip") || headers.get("CF-Connecting-IP");
    if (cfIp) return cfIp.split(",")[0].trim();
  }

  // Otherwise, only trust generic proxy headers if explicitly enabled
  const trustProxy = (process.env.TRUST_PROXY || "false").toLowerCase() === "true";
  if (trustProxy) {
    const realIp = headers.get("x-real-ip") || headers.get("X-Real-IP");
    const xff = headers.get("x-forwarded-for") || headers.get("X-Forwarded-For");
    if (realIp) return realIp.split(",")[0].trim();
    if (xff) return xff.split(",")[0].trim();
  }

  return null;
}

function isLocalIp(ip: string | null): boolean {
  if (!ip) return true;
  return ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.16.");
}

export type Geo = {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  region: string | null;
  country: string | null;
};

export async function geolocateIp(ip: string | null): Promise<Geo> {
  // Avoid hammering API in local dev; return empty for local/private IPs
  if (isLocalIp(ip)) {
    return { latitude: null, longitude: null, city: null, region: null, country: null };
  }

  try {
    const endpoint = ip ? `https://ipapi.co/${encodeURIComponent(ip)}/json/` : `https://ipapi.co/json/`;
    const res = await fetch(endpoint, { next: { revalidate: 60 * 60 } });
    if (!res.ok) throw new Error(`ipapi status ${res.status}`);
    const data = await res.json();
    return {
      latitude: typeof data.latitude === "number" ? data.latitude : parseFloat(data.latitude),
      longitude: typeof data.longitude === "number" ? data.longitude : parseFloat(data.longitude),
      city: data.city || null,
      region: data.region || data.region_code || null,
      country: data.country_name || data.country || null,
    };
  } catch {
    return { latitude: null, longitude: null, city: null, region: null, country: null };
  }
}
