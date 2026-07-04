// KV Store - SQLite local (remplace Supabase PostgreSQL)
// Interface identique à l'original pour compatibilité totale

import { Database } from "jsr:@db/sqlite@^0.12";

const DATA_DIR = Deno.env.get("DATA_DIR") ?? "/opt/corevision/data";
const DB_PATH = `${DATA_DIR}/corevision.db`;

try { Deno.mkdirSync(DATA_DIR, { recursive: true }); } catch { /* exists */ }

let _db: Database | null = null;

function getDb(): Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.exec(`
      CREATE TABLE IF NOT EXISTS kv_store_cac859af (
        key TEXT NOT NULL PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_kv_prefix ON kv_store_cac859af (key);
    `);
  }
  return _db;
}

export const set = async (key: string, value: any): Promise<void> => {
  getDb().exec(
    "INSERT INTO kv_store_cac859af (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [key, JSON.stringify(value)]
  );
};

export const get = async (key: string): Promise<any> => {
  const row = getDb()
    .prepare("SELECT value FROM kv_store_cac859af WHERE key = ?")
    .value<[string]>(key);
  return row ? JSON.parse(row[0]) : undefined;
};

export const del = async (key: string): Promise<void> => {
  getDb().exec("DELETE FROM kv_store_cac859af WHERE key = ?", [key]);
};

export const mset = async (keys: string[], values: any[]): Promise<void> => {
  const stmt = getDb().prepare(
    "INSERT INTO kv_store_cac859af (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  );
  for (let i = 0; i < keys.length; i++) {
    stmt.run(keys[i], JSON.stringify(values[i]));
  }
};

export const mget = async (keys: string[]): Promise<any[]> => {
  const db = getDb();
  return keys.map(key => {
    const row = db.prepare("SELECT value FROM kv_store_cac859af WHERE key = ?").value<[string]>(key);
    return row ? JSON.parse(row[0]) : undefined;
  });
};

export const mdel = async (keys: string[]): Promise<void> => {
  const db = getDb();
  for (const key of keys) {
    db.exec("DELETE FROM kv_store_cac859af WHERE key = ?", [key]);
  }
};

export const getByPrefix = async (prefix: string): Promise<any[]> => {
  const rows = getDb()
    .prepare("SELECT value FROM kv_store_cac859af WHERE key LIKE ?")
    .values<[string]>(`${prefix}%`);
  return rows.map(row => JSON.parse(row[0]));
};
