// Session Management - PostgreSQL backed (replaces localStorage)
// Sessions stored in DB, retrieved via sessionId cookie

import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const DATABASE_URL = Deno.env.get("DATABASE_URL");
let _pool: Pool | null = null;

function getPool(): Pool {
  if (!_pool) {
    if (!DATABASE_URL) throw new Error("DATABASE_URL not set");
    _pool = new Pool(DATABASE_URL, 10, true);
  }
  return _pool;
}

// Initialize sessions table
export async function initializeSessions(): Promise<void> {
  try {
    const pool = getPool();
    const conn = await pool.connect();

    await conn.queryArray(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        email TEXT NOT NULL,
        access_token TEXT NOT NULL,
        token_type TEXT DEFAULT 'bearer',
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL,
        last_used_at TIMESTAMP DEFAULT NOW(),
        ip_address TEXT,
        user_agent TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);
    `);

    console.log("✅ Sessions table ready");
    conn.release();
  } catch (err) {
    console.error("❌ Error initializing sessions table:", err);
  }
}

// Create a new session
export async function createSession(userId: string, email: string, accessToken: string, expiresInDays = 7): Promise<string> {
  try {
    const pool = getPool();
    const conn = await pool.connect();

    const sessionId = `sess_${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    await conn.queryArray(`
      INSERT INTO sessions (id, user_id, email, access_token, token_type, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [sessionId, userId, email, accessToken, 'bearer', expiresAt.toISOString()]);

    console.log(`✅ Session created: ${sessionId} for user ${userId}`);
    conn.release();

    return sessionId;
  } catch (err) {
    console.error("❌ Error creating session:", err);
    throw err;
  }
}

// Get session by ID
export async function getSession(sessionId: string): Promise<any | null> {
  try {
    const pool = getPool();
    const conn = await pool.connect();

    const result = await conn.queryObject(`
      SELECT * FROM sessions
      WHERE id = $1 AND expires_at > NOW()
    `, [sessionId]);

    conn.release();

    if (result.rows.length === 0) {
      return null;
    }

    const session = result.rows[0];

    // Update last_used_at
    (async () => {
      try {
        const conn2 = await pool.connect();
        await conn2.queryArray(`
          UPDATE sessions SET last_used_at = NOW()
          WHERE id = $1
        `, [sessionId]);
        conn2.release();
      } catch (err) {
        console.error("Error updating session last_used_at:", err);
      }
    })();

    return session;
  } catch (err) {
    console.error("❌ Error getting session:", err);
    return null;
  }
}

// Delete session (logout)
export async function deleteSession(sessionId: string): Promise<void> {
  try {
    const pool = getPool();
    const conn = await pool.connect();

    await conn.queryArray(`
      DELETE FROM sessions WHERE id = $1
    `, [sessionId]);

    console.log(`✅ Session deleted: ${sessionId}`);
    conn.release();
  } catch (err) {
    console.error("❌ Error deleting session:", err);
  }
}

// Delete all sessions for a user (logout all devices)
export async function deleteUserSessions(userId: string): Promise<void> {
  try {
    const pool = getPool();
    const conn = await pool.connect();

    await conn.queryArray(`
      DELETE FROM sessions WHERE user_id = $1
    `, [userId]);

    console.log(`✅ All sessions deleted for user ${userId}`);
    conn.release();
  } catch (err) {
    console.error("❌ Error deleting user sessions:", err);
  }
}

// Cleanup expired sessions (run periodically)
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const pool = getPool();
    const conn = await pool.connect();

    const result = await conn.queryArray(`
      DELETE FROM sessions WHERE expires_at < NOW()
    `);

    const deleted = result.rowsAffected || 0;
    console.log(`🧹 Cleaned up ${deleted} expired sessions`);
    conn.release();

    return deleted;
  } catch (err) {
    console.error("❌ Error cleaning up sessions:", err);
    return 0;
  }
}

// Extract sessionId from cookie header
export function getSessionIdFromCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map(c => c.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith('sessionId=')) {
      return cookie.substring('sessionId='.length);
    }
  }
  return null;
}

// Create Set-Cookie header for sessionId
export function setSessionIdCookie(sessionId: string, expiresInDays = 7): string {
  const expiresDate = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
  return `sessionId=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=${expiresDate.toUTCString()}`;
}
