import { Client } from "npm:pg";

const databaseUrl = Deno.env.get('DATABASE_URL');

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

export const postgres = new Client(databaseUrl);

// Connection pool for Deno
let connected = false;

export async function ensureConnected() {
  if (!connected) {
    await postgres.connect();
    connected = true;
    console.log('✅ PostgreSQL connected');
  }
}

export async function query(sql: string, params: any[] = []) {
  await ensureConnected();
  return postgres.queryObject(sql, params);
}

export async function queryOne(sql: string, params: any[] = []) {
  const result = await query(sql, params);
  return result.rows?.[0] || null;
}
