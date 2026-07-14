// KV Store - PostgreSQL (replaces Deno KV)
// Persists data in PostgreSQL on Render

import postgres from "npm:postgres";

const DATABASE_URL = Deno.env.get("DATABASE_URL");

if (!DATABASE_URL) {
  console.error("DATABASE_URL env var not set");
}

let _sql: any = null;
let _dbReady = false;

async function initializeDb(): Promise<void> {
  try {
    if (!DATABASE_URL) {
      throw new Error("DATABASE_URL not configured");
    }

    _sql = postgres(DATABASE_URL);

    // Try to create table
    (async () => {
      try {
        await _sql`
          CREATE TABLE IF NOT EXISTS kv_store (
            key TEXT PRIMARY KEY,
            value JSONB NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_key_prefix ON kv_store (key);
        `;
      } catch (err) {
        console.error("Could not create table:", (err as Error).message);
      }
    })();

    _dbReady = true;
  } catch (err) {
    console.error("PostgreSQL init failed:", (err as Error).message);
    _dbReady = false;
  }
}

// Launch init at startup
initializeDb();

async function getSql() {
  if (!_dbReady || !_sql) {
    let attempts = 0;
    while (!_dbReady && attempts < 300) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!_dbReady) {
      throw new Error("PostgreSQL not available");
    }
  }

  return _sql;
}

export const set = async (key: string, value: any): Promise<void> => {
  const sql = await getSql();
  await sql`
    INSERT INTO kv_store (key, value, updated_at)
    VALUES (${key}, ${JSON.stringify(value)}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(value)}, updated_at = NOW()
  `;
};

export const get = async (key: string): Promise<any> => {
  const sql = await getSql();
  const result = await sql`SELECT value FROM kv_store WHERE key = ${key}`;
  if (result.length === 0) return null;
  const value = result[0].value;
  return typeof value === 'string' ? JSON.parse(value) : value;
};

export const del = async (key: string): Promise<void> => {
  const sql = await getSql();
  await sql`DELETE FROM kv_store WHERE key = ${key}`;
};

export const mset = async (keys: string[], values: any[]): Promise<void> => {
  const sql = await getSql();
  for (let i = 0; i < keys.length; i++) {
    await sql`
      INSERT INTO kv_store (key, value, updated_at)
      VALUES (${keys[i]}, ${JSON.stringify(values[i])}, NOW())
      ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(values[i])}, updated_at = NOW()
    `;
  }
};

export const mget = async (keys: string[]): Promise<any[]> => {
  const sql = await getSql();
  const result = await sql`SELECT value FROM kv_store WHERE key = ANY(${keys})`;
  return result.map(row => {
    const value = row.value;
    return typeof value === 'string' ? JSON.parse(value) : value;
  });
};

export const mdel = async (keys: string[]): Promise<void> => {
  const sql = await getSql();
  await sql`DELETE FROM kv_store WHERE key = ANY(${keys})`;
};

export const getByPrefix = async (prefix: string): Promise<any[]> => {
  const sql = await getSql();
  const result = await sql`SELECT value FROM kv_store WHERE key LIKE ${prefix + '%'}`;
  return result.map(row => {
    const value = row.value;
    return typeof value === 'string' ? JSON.parse(value) : value;
  });
};

export const delByPrefix = async (prefix: string): Promise<number> => {
  const sql = await getSql();
  const result = await sql`DELETE FROM kv_store WHERE key LIKE ${prefix + '%'}`;
  return result.count;
};

// Graceful shutdown
if (typeof Deno !== "undefined" && "unload" in Deno) {
  (Deno as any).unload = async () => {
    if (_pool) {
      await _pool.end();
    }
  };
}
