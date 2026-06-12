/**
 * SSRF guard for the crawler.
 *
 * The crawler fetches arbitrary user-supplied URLs with a headless browser.
 * Without this, a caller could point it at loopback, RFC1918, link-local,
 * carrier-grade-NAT / Tailscale (100.64/10), or cloud-metadata addresses and
 * pivot into the internal Docker network and the tailnet. We resolve the
 * hostname and reject any URL that maps to a non-public address. The check runs
 * on the seed URL AND on every navigation (redirects, enqueued links), which
 * also defeats DNS-rebinding and redirect-based bypasses.
 */
import { lookup } from "node:dns/promises";
import net from "node:net";

export class BlockedUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlockedUrlError";
  }
}

function ipv4Blocked(ip: string): boolean {
  const o = ip.split(".").map(Number);
  if (o.length !== 4 || o.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;
  const a = o[0]!;
  const b = o[1]!;
  if (a === 0) return true; // 0.0.0.0/8 "this network"
  if (a === 10) return true; // private
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local + cloud metadata (169.254.169.254)
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT / Tailscale 100.64/10
  if (a === 192 && b === 0) return true; // 192.0.0.0/24 IETF protocol assignments
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a >= 224) return true; // multicast + reserved + 255.255.255.255
  return false;
}

function ipv6Blocked(ip: string): boolean {
  const lower = ip.toLowerCase();
  // IPv4-mapped / -compatible → evaluate the embedded v4 address
  const mapped = lower.match(/(?:::ffff:)(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return ipv4Blocked(mapped[1]!);
  if (lower === "::" || lower === "::1") return true; // unspecified + loopback
  if (lower.startsWith("fe80")) return true; // link-local
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique-local (incl. Tailscale ULA)
  if (lower.startsWith("ff")) return true; // multicast
  return false;
}

export function isBlockedAddress(ip: string): boolean {
  const v = net.isIP(ip);
  if (v === 4) return ipv4Blocked(ip);
  if (v === 6) return ipv6Blocked(ip);
  return true; // not a parseable IP → fail closed
}

/**
 * Validate a URL is safe to fetch. Throws BlockedUrlError otherwise.
 * Returns the parsed URL on success.
 */
export async function assertPublicUrl(raw: string): Promise<URL> {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new BlockedUrlError(`invalid URL: ${raw}`);
  }

  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new BlockedUrlError(`scheme not allowed: ${u.protocol}`);
  }

  const host = u.hostname.replace(/^\[|\]$/g, ""); // strip IPv6 brackets

  // Literal IP in the URL — check directly, no DNS.
  if (net.isIP(host)) {
    if (isBlockedAddress(host)) throw new BlockedUrlError(`blocked address: ${host}`);
    return u;
  }

  // Hostname — resolve every A/AAAA record and block if ANY is non-public.
  let records: { address: string }[];
  try {
    records = await lookup(host, { all: true });
  } catch {
    throw new BlockedUrlError(`DNS resolution failed: ${host}`);
  }
  if (records.length === 0) throw new BlockedUrlError(`no DNS records: ${host}`);
  for (const { address } of records) {
    if (isBlockedAddress(address)) {
      throw new BlockedUrlError(`host ${host} resolves to blocked address ${address}`);
    }
  }
  return u;
}
