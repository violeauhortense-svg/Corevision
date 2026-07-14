// Auth module - JWT standalone (remplace Supabase Auth)
// Interface identique à l'original pour compatibilité totale
// Sessions now stored in PostgreSQL (not localStorage)

import * as kv from "./kv_store.tsx";
import * as sessions from "./sessions.tsx";

const JWT_SECRET = Deno.env.get("JWT_SECRET") ?? "change-me-in-production-min-32-chars!!";
const DEV_MODE = Deno.env.get("NODE_ENV") !== "production";

// Encode/decode JWT manuellement (pas de dépendance externe)
function base64url(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64urlDecode(str: string): string {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  return atob(base64.padEnd(base64.length + (4 - base64.length % 4) % 4, "="));
}

async function signJWT(payload: Record<string, unknown>): Promise<string> {
  const header = base64url(new TextEncoder().encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = base64url(new TextEncoder().encode(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 jours
  })));
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${header}.${body}`));
  return `${header}.${body}.${base64url(new Uint8Array(sig))}`;
}

async function verifyJWT(token: string): Promise<Record<string, unknown> | null> {
  try {
    const [header, body, sig] = token.split(".");
    const key = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" }, false, ["verify"]
    );
    const sigBytes = Uint8Array.from(atob(sig.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(`${header}.${body}`));
    if (!valid) return null;
    const payload = JSON.parse(base64urlDecode(body));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// Verify auth from Cookie (new: DB sessions)
export async function verifyAuthFromCookie(cookieHeader: string | undefined) {
  if (!cookieHeader) {
    console.log("🔐 No cookie header provided");
    return { user: null, error: "No session cookie" };
  }

  const sessionId = sessions.getSessionIdFromCookie(cookieHeader);
  if (!sessionId) {
    console.log("🔐 No sessionId found in cookies");
    return { user: null, error: "No session cookie" };
  }

  console.log(`🔐 [verifyAuthFromCookie] Validating sessionId: ${sessionId}`);

  const session = await sessions.getSession(sessionId);
  if (!session) {
    console.log("🔐 [verifyAuthFromCookie] Session not found or expired");
    return { user: null, error: "Session not found or expired" };
  }

  console.log(`✅ [verifyAuthFromCookie] Session valid for user: ${session.user_id}`);
  return {
    user: { id: session.user_id, email: session.email },
    error: null,
  };
}

// Verify auth from Authorization header (legacy: JWT)
export async function verifyAuth(authHeader: string | undefined) {
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        // En production : vérification HMAC
        if (!DEV_MODE) {
          const payload = await verifyJWT(token);
          if (!payload) {
            return { user: null, error: "Token invalide ou expiré" };
          }
          return {
            user: { id: payload.sub as string, email: payload.email as string },
            error: null,
          };
        }
        // En dev : décodage sans vérification (compatible tokens Supabase existants)
        const payload = JSON.parse(base64urlDecode(parts[1]));
        return {
          user: {
            id: payload.sub || "default-user",
            email: payload.email || "dev@example.com",
          },
          error: null,
        };
      }
    } catch (err) {
      console.error("❌ Erreur décodage token:", err);
    }
  }

  // Fallback dev
  if (DEV_MODE) {
    return { user: { id: "default-user", email: "dev@example.com" }, error: null };
  }

  return { user: null, error: "Unauthorized" };
}

// Gestion utilisateurs locale (pour signup/signin sans Supabase)
export async function createUser(email: string, password: string, metadata: Record<string, string> = {}) {
  const existingKey = `user:email:${email}`;
  const existing = await kv.get(existingKey);
  if (existing) throw new Error("Un compte existe déjà avec cet email");

  const userId = crypto.randomUUID();
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = base64url(saltBytes);
  const hash = await hashPassword(password, salt);

  const user = { id: userId, email, passwordHash: hash, salt, ...metadata, created: new Date().toISOString() };
  await kv.set(existingKey, user);
  await kv.set(`user:id:${userId}`, user);

  return { id: userId, email, user_metadata: metadata };
}

export async function signInUser(email: string, password: string) {
  const user = await kv.get(`user:email:${email}`);
  if (!user) throw new Error("Email ou mot de passe incorrect");

  const hash = await hashPassword(password, user.salt);
  if (hash !== user.passwordHash) throw new Error("Email ou mot de passe incorrect");

  const token = await signJWT({ sub: user.id, email: user.email });

  // ✨ Create session in PostgreSQL (replaces localStorage)
  const sessionId = await sessions.createSession(user.id, user.email, token);
  console.log(`✅ Session created in DB: ${sessionId}`);

  return {
    access_token: token,
    token_type: "bearer",
    expires_in: 604800,
    sessionId,  // ← Return sessionId for cookie
    user: { id: user.id, email: user.email, user_metadata: user },
    session: { access_token: token, token_type: "bearer", user: { id: user.id, email: user.email } },
  };
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password + salt),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(salt));
  return base64url(new Uint8Array(sig));
}

// Verify auth from Hono request: try cookie first (DB sessions), then Authorization header (JWT fallback)
export async function verifyAuthRequest(req: any) {
  // ✨ Try DB session cookie first (new secure method)
  const cookieHeader = req.header("Cookie");
  if (cookieHeader) {
    const result = await verifyAuthFromCookie(cookieHeader);
    if (result.user) {
      console.log(`✅ [verifyAuthRequest] Authenticated via DB session`);
      return result;
    }
  }

  // Fallback to Authorization header (JWT - legacy)
  const authHeader = req.header("Authorization");
  if (authHeader) {
    console.log(`🔐 [verifyAuthRequest] Trying Authorization header (JWT fallback)`);
    return await verifyAuth(authHeader);
  }

  console.log(`❌ [verifyAuthRequest] No auth method found (no cookie, no Authorization header)`);
  return { user: null, error: "Unauthorized" };
}
