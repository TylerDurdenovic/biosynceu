/**
 * Tiny signed-session helper for the /admin area.
 *
 * Uses the Web Crypto API (HMAC-SHA256) — NOT Node's `crypto` — so the same
 * code runs in Edge middleware AND in route handlers. The session cookie is a
 * signed `payload.signature` string; the payload carries the username and an
 * expiry, and the signature is verified with ADMIN_SESSION_SECRET.
 *
 * The cookie is set httpOnly + secure + SameSite=Lax by the login route, so it
 * is never readable from JS and can't be forged without the secret.
 */

export const SESSION_COOKIE = "bsl_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 =
    s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(): Promise<CryptoKey> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set");
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionToken(username: string): Promise<string> {
  const payload = { u: username, exp: Date.now() + SESSION_MAX_AGE * 1000 };
  const payloadB64 = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", await hmacKey(), encoder.encode(payloadB64)),
  );
  return `${payloadB64}.${toBase64Url(sig)}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
): Promise<{ u: string } | null> {
  if (!token) return null;
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return null;
  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(),
      fromBase64Url(sigB64),
      encoder.encode(payloadB64),
    );
    if (!valid) return null;
    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(payloadB64)),
    ) as { u: string; exp: number };
    if (!payload.exp || payload.exp < Date.now()) return null;
    return { u: payload.u };
  } catch {
    return null;
  }
}
