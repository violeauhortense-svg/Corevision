// KV Store - PostgreSQL (remplace SQLite local)
// Persistance garantie sur Render

import { Pool } from "jsr:@postgres/postgres@^0.17";

const DATABASE_URL = Deno.env.get("DATABASE_URL");

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable not set");
}

const pool = new Pool(DATABASE_URL, {
  max: 20,
});

let _initialized = false;

async function ensureTableExists(): Promise<void> {
  if (_initialized) return;

  const client = await pool.connect();
  try {
    await client.queryArray(`
      CREATE TABLE IF NOT EXISTS kv_store_cac859af (
        key TEXT NOT NULL PRIMARY KEY,
        value TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_kv_prefix ON kv_store_cac859af (key);
    `);
    _initialized = true;
    console.log("✅ PostgreSQL KV table initialized");
  } finally {
    client.release();
  }
}

export const set = async (key: string, value: any): Promise<void> => {
  await ensureTableExists();
  const client = await pool.connect();
  try {
    await client.queryArray(
      `INSERT INTO kv_store_cac859af (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT(key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, JSON.stringify(value)]
    );
  } finally {
    client.release();
  }
};

export const get = async (key: string): Promise<any> => {
  await ensureTableExists();
  const client = await pool.connect();
  try {
    const result = await client.queryArray<[string]>(
      `SELECT value FROM kv_store_cac859af WHERE key = $1`,
      [key]
    );
    if (result.rows && result.rows.length > 0) {
      return JSON.parse(result.rows[0][0]);
    }
    return undefined;
  } finally {
    client.release();
  }
};

export const del = async (key: string): Promise<void> => {
  await ensureTableExists();
  const client = await pool.connect();
  try {
    await client.queryArray(
      `DELETE FROM kv_store_cac859af WHERE key = $1`,
      [key]
    );
  } finally {
    client.release();
  }
};

export const mset = async (keys: string[], values: any[]): Promise<void> => {
  await ensureTableExists();
  const client = await pool.connect();
  try {
    for (let i = 0; i < keys.length; i++) {
      await client.queryArray(
        `INSERT INTO kv_store_cac859af (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT(key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [keys[i], JSON.stringify(values[i])]
      );
    }
  } finally {
    client.release();
  }
};

export const mget = async (keys: string[]): Promise<any[]> => {
  await ensureTableExists();
  const client = await pool.connect();
  try {
    const result = await client.queryArray<[string]>(
      `SELECT value FROM kv_store_cac859af WHERE key = ANY($1)`,
      [keys]
    );
    const valueMap = new Map(result.rows?.map(row => [JSON.parse(row[0]).key, row[0]]) || []);
    return keys.map(key => {
      const val = result.rows?.find(row => JSON.parse(row[0])?.key === key);
      return val ? JSON.parse(val[0]) : undefined;
    });
  } finally {
    client.release();
  }
};

export const mdel = async (keys: string[]): Promise<void> => {
  await ensureTableExists();
  const client = await pool.connect();
  try {
    await client.queryArray(
      `DELETE FROM kv_store_cac859af WHERE key = ANY($1)`,
      [keys]
    );
  } finally {
    client.release();
  }
};

export const getByPrefix = async (prefix: string): Promise<any[]> => {
  await ensureTableExists();
  const client = await pool.connect();
  try {
    const result = await client.queryArray<[string]>(
      `SELECT value FROM kv_store_cac859af WHERE key LIKE $1`,
      [`${prefix}%`]
    );
    return result.rows?.map(row => JSON.parse(row[0])) || [];
  } finally {
    client.release();
  }
};
