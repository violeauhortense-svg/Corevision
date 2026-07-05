// KV Store - PostgreSQL (remplace SQLite local)
// Persistance garantie sur Render

import { Client } from "https://deno.land/x/postgres@v0.19.3/mod.ts";

const DATABASE_URL = Deno.env.get("DATABASE_URL");

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable not set");
}

const client = new Client(DATABASE_URL);
let _connected = false;

async function ensureConnected(): Promise<void> {
  if (_connected) return;
  await client.connect();
  _connected = true;
  console.log("✅ PostgreSQL connected");
}

async function ensureTableExists(): Promise<void> {
  await ensureConnected();
  await client.queryArray(`
    CREATE TABLE IF NOT EXISTS kv_store_cac859af (
      key TEXT NOT NULL PRIMARY KEY,
      value TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_kv_prefix ON kv_store_cac859af (key);
  `);
}

export const set = async (key: string, value: any): Promise<void> => {
  await ensureTableExists();
  await client.queryArray(
    `INSERT INTO kv_store_cac859af (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT(key) DO UPDATE SET value = $2, updated_at = NOW()`,
    [key, JSON.stringify(value)]
  );
};

export const get = async (key: string): Promise<any> => {
  await ensureTableExists();
  const result = await client.queryArray<[string]>(
    `SELECT value FROM kv_store_cac859af WHERE key = $1`,
    [key]
  );
  if (result && result.length > 0) {
    return JSON.parse(result[0][0]);
  }
  return undefined;
};

export const del = async (key: string): Promise<void> => {
  await ensureTableExists();
  await client.queryArray(
    `DELETE FROM kv_store_cac859af WHERE key = $1`,
    [key]
  );
};

export const mset = async (keys: string[], values: any[]): Promise<void> => {
  await ensureTableExists();
  for (let i = 0; i < keys.length; i++) {
    await client.queryArray(
      `INSERT INTO kv_store_cac859af (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT(key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [keys[i], JSON.stringify(values[i])]
    );
  }
};

export const mget = async (keys: string[]): Promise<any[]> => {
  await ensureTableExists();
  const result = await client.queryArray<[string]>(
    `SELECT key, value FROM kv_store_cac859af WHERE key = ANY($1)`,
    [keys]
  );
  const valueMap = new Map(result?.map(row => [row[0], JSON.parse(row[1])]) || []);
  return keys.map(key => valueMap.get(key));
};

export const mdel = async (keys: string[]): Promise<void> => {
  await ensureTableExists();
  await client.queryArray(
    `DELETE FROM kv_store_cac859af WHERE key = ANY($1)`,
    [keys]
  );
};

export const getByPrefix = async (prefix: string): Promise<any[]> => {
  await ensureTableExists();
  const result = await client.queryArray<[string]>(
    `SELECT value FROM kv_store_cac859af WHERE key LIKE $1`,
    [`${prefix}%`]
  );
  return result?.map(row => JSON.parse(row[0])) || [];
};
