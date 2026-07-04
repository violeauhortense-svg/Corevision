#!/usr/bin/env deno run --allow-net --allow-env --allow-write --allow-read
// =============================================================================
// Script de migration Supabase → SQLite local
// Usage : deno run --allow-all deploy/migrate-from-supabase.ts
// =============================================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? prompt("Supabase URL:") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? prompt("Service Role Key:") ?? "";
const NEW_API_URL = Deno.env.get("NEW_API_URL") ?? "http://localhost:3000";

// Récupérer les données KV depuis Supabase
async function fetchAllKVData(): Promise<{ key: string; value: unknown }[]> {
  console.log("📥 Récupération des données depuis Supabase...");

  let allData: { key: string; value: unknown }[] = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const resp = await fetch(
      `${SUPABASE_URL}/rest/v1/kv_store_cac859af?select=key,value&limit=${limit}&offset=${offset}`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!resp.ok) {
      throw new Error(`Erreur Supabase: ${resp.status} ${await resp.text()}`);
    }

    const batch = await resp.json();
    allData = allData.concat(batch);

    console.log(`  ↳ ${allData.length} entrées récupérées...`);

    if (batch.length < limit) break;
    offset += limit;
  }

  return allData;
}

// Insérer les données dans le nouveau backend via API
async function importToNewBackend(data: { key: string; value: unknown }[]) {
  console.log(`\n📤 Import de ${data.length} entrées vers le nouveau backend...`);

  // Endpoint d'import batch (à ajouter temporairement au serveur si besoin)
  // Pour l'instant, on génère un fichier SQL pour import direct SQLite
  const sqlLines = data.map(({ key, value }) => {
    const escapedKey = key.replace(/'/g, "''");
    const escapedValue = JSON.stringify(value).replace(/'/g, "''");
    return `INSERT OR REPLACE INTO kv_store_cac859af (key, value) VALUES ('${escapedKey}', '${escapedValue}');`;
  });

  const sql = `-- Migration Supabase → SQLite
-- Généré le ${new Date().toISOString()}
-- ${data.length} entrées

BEGIN TRANSACTION;
${sqlLines.join("\n")}
COMMIT;
`;

  const outputPath = "./migration_data.sql";
  await Deno.writeTextFile(outputPath, sql);
  console.log(`✅ Fichier SQL généré : ${outputPath}`);
  console.log(`\n📋 Pour importer dans SQLite sur le VPS :`);
  console.log(`   scp migration_data.sql user@vps:/opt/corevision/`);
  console.log(`   sqlite3 /opt/corevision/data/corevision.db < /opt/corevision/migration_data.sql`);
}

// Migration des fichiers Supabase Storage → VPS
async function migrateStorage() {
  console.log("\n📁 Migration des fichiers depuis Supabase Storage...");

  const resp = await fetch(
    `${SUPABASE_URL}/storage/v1/bucket/make-cac859af-documents/objects`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  );

  if (!resp.ok) {
    console.warn("⚠️  Impossible de lister les fichiers storage:", resp.status);
    return;
  }

  const files = await resp.json();
  console.log(`  ↳ ${files.length} fichiers à migrer`);

  // Générer un script shell de téléchargement
  const curlCommands = files.map((f: { name: string }) => {
    const signedUrlEndpoint = `${SUPABASE_URL}/storage/v1/object/sign/make-cac859af-documents/${f.name}`;
    return `# ${f.name}
URL=$(curl -s -X POST "${signedUrlEndpoint}" \\
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \\
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{"expiresIn": 3600}' | jq -r '.signedURL')
mkdir -p "/opt/corevision/uploads/$(dirname ${f.name})"
curl -s "$URL" -o "/opt/corevision/uploads/${f.name}"
echo "✅ ${f.name}"`;
  });

  const script = `#!/bin/bash
# Script de migration des fichiers Supabase Storage → VPS
# Exécuter sur le VPS : bash migrate-files.sh

${curlCommands.join("\n\n")}

echo "✅ Migration des fichiers terminée"
`;

  await Deno.writeTextFile("./migrate-files.sh", script);
  console.log("✅ Script shell généré : ./migrate-files.sh");
  console.log("   Copier sur le VPS et exécuter : bash migrate-files.sh");
}

// Vérification santé du nouveau backend
async function checkNewBackend() {
  console.log(`\n🔍 Vérification du nouveau backend (${NEW_API_URL})...`);
  try {
    const resp = await fetch(`${NEW_API_URL}/make-server-cac859af/health`);
    if (resp.ok) {
      const data = await resp.json();
      console.log("✅ Nouveau backend opérationnel:", data.version);
    } else {
      console.warn("⚠️  Backend répond avec status:", resp.status);
    }
  } catch (e) {
    console.error("❌ Backend inaccessible:", (e as Error).message);
    console.log("   Assurez-vous que le serveur est démarré avant d'importer.");
  }
}

// Main
console.log("=".repeat(60));
console.log("MIGRATION SUPABASE → COREVISION SELF-HOSTED");
console.log("=".repeat(60));

await checkNewBackend();
const kvData = await fetchAllKVData();
await importToNewBackend(kvData);
await migrateStorage();

console.log("\n" + "=".repeat(60));
console.log("✅ Migration préparée !");
console.log("\nFichiers générés :");
console.log("  - migration_data.sql  : données KV à importer dans SQLite");
console.log("  - migrate-files.sh    : script de migration des fichiers");
console.log("\nÉtapes finales :");
console.log("  1. Importer migration_data.sql sur le VPS");
console.log("  2. Exécuter migrate-files.sh sur le VPS");
console.log("  3. Changer l'URL dans src/app/utils/supabase/info.tsx");
console.log("  4. Redéployer sur Vercel");
console.log("=".repeat(60));
