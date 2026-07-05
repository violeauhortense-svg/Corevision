// KV Store - Deno KV (persiste automatiquement sur Render)
// Aucun package externe nécessaire

let _kv: Deno.Kv | null = null;

async function getKv(): Promise<Deno.Kv> {
  if (!_kv) {
    _kv = await Deno.openKv();
    console.log("✅ Deno KV opened and persisting on Render");
  }
  return _kv;
}

export const set = async (key: string, value: any): Promise<void> => {
  const kv = await getKv();
  await kv.set([key], value);
};

export const get = async (key: string): Promise<any> => {
  const kv = await getKv();
  const entry = await kv.get([key]);
  return entry.value;
};

export const del = async (key: string): Promise<void> => {
  const kv = await getKv();
  await kv.delete([key]);
};

export const mset = async (keys: string[], values: any[]): Promise<void> => {
  const kv = await getKv();
  const entries: Array<[string[], any]> = keys.map((key, i) => [[key], values[i]]);

  const tx = kv.atomic();
  for (const [k, v] of entries) {
    tx.set(k, v);
  }
  await tx.commit();
};

export const mget = async (keys: string[]): Promise<any[]> => {
  const kv = await getKv();
  const results = await Promise.all(keys.map(k => kv.get([k])));
  return results.map(r => r.value);
};

export const mdel = async (keys: string[]): Promise<void> => {
  const kv = await getKv();
  const tx = kv.atomic();
  for (const key of keys) {
    tx.delete([key]);
  }
  await tx.commit();
};

export const getByPrefix = async (prefix: string): Promise<any[]> => {
  const kv = await getKv();
  const results: any[] = [];

  for await (const entry of kv.list({ prefix: [prefix] })) {
    results.push(entry.value);
  }

  return results;
};
