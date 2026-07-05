// KV Store - Deno KV (persiste automatiquement sur Render)
// Aucun package externe nécessaire

let _kv: Deno.Kv | null = null;
let _kvReady = false;

// Initialise KV au startup (pas de await, ça va se faire en arrière-plan)
async function initializeKv(): Promise<void> {
  try {
    console.log("🔄 Initializing Deno KV...");
    const startTime = Date.now();
    _kv = await Deno.openKv();
    const duration = Date.now() - startTime;
    _kvReady = true;
    console.log(`✅ Deno KV initialized successfully (${duration}ms)`);
  } catch (err) {
    console.error("❌ CRITICAL: Deno KV init failed:", err);
    console.error("Stack:", (err as Error).stack);
    console.error("Render may not support Deno KV - consider using PostgreSQL");
    _kvReady = false;
  }
}

// Lance l'init au démarrage
initializeKv();

// Optionnel: log l'état après 10 secondes
setTimeout(() => {
  if (_kvReady) {
    console.log("✅ KV is ready for requests");
  } else {
    console.error("⚠️ KV still not ready after 10s - requests will timeout");
  }
}, 10000);

async function getKv(): Promise<Deno.Kv> {
  // Attendre que KV soit prêt (augmenté de 5s à 30s)
  let attempts = 0;
  const maxAttempts = 300; // 30 secondes
  while (!_kvReady && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }

  if (!_kvReady) {
    const duration = attempts * 100;
    console.error(`❌ KV timeout after ${duration}ms (max wait: 30s)`);
    throw new Error(`Deno KV non disponible (timeout d'initialisation après ${duration}ms)`);
  }

  if (!_kv) {
    throw new Error("Deno KV non disponible (instance null)");
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
