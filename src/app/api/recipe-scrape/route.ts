import { NextResponse } from "next/server";
import net from "node:net";

export const runtime = "nodejs";

const UPSTREAM_TIMEOUT_MS = 15_000;
const MAX_URL_LENGTH = 2048;

function coerceHttpsUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function isPrivateOrLocalAddress(hostname: string): boolean {
  const host = hostname.toLowerCase();

  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "0.0.0.0") return true;

  const ipVersion = net.isIP(host);
  if (ipVersion === 0) return false;

  if (ipVersion === 4) {
    const parts = host.split(".").map((p) => Number.parseInt(p, 10));
    if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;

    const [a, b] = parts;

    // Loopback 127.0.0.0/8
    if (a === 127) return true;

    // Private 10.0.0.0/8
    if (a === 10) return true;

    // Private 172.16.0.0/12
    if (a === 172 && b >= 16 && b <= 31) return true;

    // Private 192.168.0.0/16
    if (a === 192 && b === 168) return true;

    // Link-local 169.254.0.0/16
    if (a === 169 && b === 254) return true;

    return false;
  }

  // IPv6
  if (host === "::1") return true; // loopback
  if (host.startsWith("fe80:")) return true; // link-local
  if (host.startsWith("fc") || host.startsWith("fd")) return true; // unique local (fc00::/7)

  return false;
}

async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function truncate(input: string, max: number) {
  if (input.length <= max) return input;
  return `${input.slice(0, max)}…`;
}

export async function POST(request: Request) {
  // Basic same-origin check to reduce CSRF risk
  const origin = request.headers.get("origin");
  const requestOrigin = new URL(request.url).origin;
  if (origin && origin !== requestOrigin) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const base = process.env.RECIPE_SERVICE_URL;
  if (!base) {
    return NextResponse.json(
      { error: "RECIPE_SERVICE_URL is not configured" },
      { status: 500 }
    );
  }

  let upstreamUrl: URL;
  try {
    upstreamUrl = new URL("/parse", base);
  } catch {
    return NextResponse.json(
      { error: "RECIPE_SERVICE_URL is invalid" },
      { status: 500 }
    );
  }

  const body = await readJsonBody(request);
  const rawUrl =
    body && typeof body === "object" && body !== null && "url" in body
      ? (body as { url?: unknown }).url
      : undefined;

  if (typeof rawUrl !== "string") {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  if (rawUrl.length > MAX_URL_LENGTH) {
    return NextResponse.json({ error: "URL too long" }, { status: 400 });
  }

  const url = coerceHttpsUrl(rawUrl);
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json(
      { error: "Only http/https URLs are allowed" },
      { status: 400 }
    );
  }

  if (isPrivateOrLocalAddress(parsed.hostname)) {
    return NextResponse.json({ error: "Blocked host" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const res = await fetch(upstreamUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: parsed.toString() }),
      cache: "no-store",
      signal: controller.signal,
    });

    const contentType = res.headers.get("content-type") ?? "";

    if (!res.ok) {
      let details: unknown = undefined;

      if (contentType.includes("application/json")) {
        try {
          details = await res.json();
        } catch {
          details = undefined;
        }
      } else {
        try {
          details = truncate(await res.text(), 1000);
        } catch {
          details = undefined;
        }
      }

      return NextResponse.json(
        {
          error: "Recipe service error",
          upstreamStatus: res.status,
          details,
        },
        { status: 502 }
      );
    }

    if (contentType.includes("application/json")) {
      const data = await res.json();
      return NextResponse.json(data, { status: 200 });
    }

    const text = await res.text();
    return NextResponse.json({ data: text }, { status: 200 });
  } catch (e) {
    const isAbort = e instanceof DOMException && e.name === "AbortError";
    return NextResponse.json(
      {
        error: isAbort ? "Recipe service timeout" : "Recipe service unreachable",
      },
      { status: isAbort ? 504 : 502 }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
