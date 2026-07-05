// KV Store - Deno KV (persiste automatiquement sur Render)
// Aucun package externe nécessaire

let _kv: Deno.Kv | null = null;
let _kvReady = false;

// Initialise KV au startup (pas de await, ça va se faire en arrière-plan)
async function initializeKv(): Promise<void> {
  try {
    _kv = await Deno.openKv();
    _kvReady = true;
    console.log("✅ Deno KV initialized and persisting on Render");
  } catch (err) {
    console.error("❌ Erreur Deno KV:", err);
    _kvReady = false;
  }
}

// Lance l'init au démarrage
initializeKv();

async function getKv(): Promise<Deno.Kv> {
  // Attendre que KV soit prêt
  let attempts = 0;
  while (!_kvReady && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }

  if (!_kv) {
    throw new Error("Deno KV non disponible");
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
