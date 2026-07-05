// KV Store - PostgreSQL (replaces Deno KV)
// Persists data in PostgreSQL on Render

import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const DATABASE_URL = Deno.env.get("DATABASE_URL");

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL env var not set! Set it in Render dashboard.");
  console.error("Format: postgresql://user:password@host:port/dbname");
}

let _pool: Pool | null = null;
let _dbReady = false;

async function initializeDb(): Promise<void> {
  try {
    if (!DATABASE_URL) {
      console.error("❌ DATABASE_URL env var NOT FOUND");
      throw new Error("DATABASE_URL not configured");
    }

    console.log("🔄 Initializing PostgreSQL connection pool...");
    console.log(`📍 Database host: ${DATABASE_URL.split('@')[1]?.split(':')[0] || 'unknown'}`);

    const startTime = Date.now();

    // Create pool with timeout
    _pool = new Pool(DATABASE_URL, 10, true);

    console.log("🔗 Attempting to connect to database...");
    const conn = await Promise.race([
      _pool.connect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Connection timeout (30s)")), 30000)
      )
    ]) as any;

    console.log("✅ Connected! Creating table...");

    // Create table if doesn't exist
    await conn.queryArray(`
      CREATE TABLE IF NOT EXISTS kv_store (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_key_prefix ON kv_store (key);
    `);

    conn.release();
    _dbReady = true;

    const duration = Date.now() - startTime;
    console.log(`✅ PostgreSQL initialized successfully (${duration}ms)`);
  } catch (err) {
    console.error("❌ CRITICAL: PostgreSQL init failed:", err);
    console.error("Error message:", (err as Error).message);
    console.error("Stack:", (err as Error).stack);
    _dbReady = false;
  }
}

// Launch init at startup
initializeDb();

// Log status after 5s
setTimeout(() => {
  if (_dbReady) {
    console.log("✅ PostgreSQL is ready for requests");
  } else {
    console.error("⚠️ PostgreSQL still not ready after 5s - requests will fail");
  }
}, 5000);

async function getPool(): Promise<Pool> {
  if (!_dbReady || !_pool) {
    let attempts = 0;
    const maxAttempts = 300; // 30 seconds instead of 5
    while (!_dbReady && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!_dbReady) {
      const duration = attempts * 100;
      console.error(`❌ DB timeout after ${duration}ms`);
      throw new Error(`PostgreSQL non disponible (timeout d'initialisation après ${duration}ms)`);
    }
  }

  if (!_pool) {
    throw new Error("PostgreSQL pool not initialized");
  }

  return _pool;
}

export const set = async (key: string, value: any): Promise<void> => {
  const pool = await getPool();
  const conn = await pool.connect();
  try {
    await conn.queryArray(
      `INSERT INTO kv_store (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, JSON.stringify(value)]
    );
  } finally {
    conn.release();
  }
};

export const get = async (key: string): Promise<any> => {
  const pool = await getPool();
  const conn = await pool.connect();
  try {
    const result = await conn.queryArray(
      "SELECT value FROM kv_store WHERE key = $1",
      [key]
    );
    if (result.rows.length === 0) return null;
    return JSON.parse(result.rows[0][0] as string);
  } finally {
    conn.release();
  }
};

export const del = async (key: string): Promise<void> => {
  const pool = await getPool();
  const conn = await pool.connect();
  try {
    await conn.queryArray("DELETE FROM kv_store WHERE key = $1", [key]);
  } finally {
    conn.release();
  }
};

export const mset = async (keys: string[], values: any[]): Promise<void> => {
  const pool = await getPool();
  const conn = await pool.connect();
  try {
    for (let i = 0; i < keys.length; i++) {
      await conn.queryArray(
        `INSERT INTO kv_store (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [keys[i], JSON.stringify(values[i])]
      );
    }
  } finally {
    conn.release();
  }
};

export const mget = async (keys: string[]): Promise<any[]> => {
  const pool = await getPool();
  const conn = await pool.connect();
  try {
    const result = await conn.queryArray(
      `SELECT value FROM kv_store WHERE key = ANY($1)`,
      [keys]
    );
    return result.rows.map(row => JSON.parse(row[0] as string));
  } finally {
    conn.release();
  }
};

export const mdel = async (keys: string[]): Promise<void> => {
  const pool = await getPool();
  const conn = await pool.connect();
  try {
    await conn.queryArray(
      "DELETE FROM kv_store WHERE key = ANY($1)",
      [keys]
    );
  } finally {
    conn.release();
  }
};

export const getByPrefix = async (prefix: string): Promise<any[]> => {
  const pool = await getPool();
  const conn = await pool.connect();
  try {
    const result = await conn.queryArray(
      "SELECT value FROM kv_store WHERE key LIKE $1",
      [`${prefix}%`]
    );
    return result.rows.map(row => JSON.parse(row[0] as string));
  } finally {
    conn.release();
  }
};

// Graceful shutdown
if (typeof Deno !== "undefined" && "unload" in Deno) {
  (Deno as any).unload = async () => {
    if (_pool) {
      await _pool.end();
      console.log("✅ PostgreSQL pool closed");
    }
  };
}
