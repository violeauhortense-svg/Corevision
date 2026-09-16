// Auto-initialize PocketBase collections
// Run this on backend startup to ensure all collections exist
//
// Note: the "users" auth collection is created automatically by PocketBase
// itself (it's a built-in system collection) and is NOT managed here.
//
// Uses PocketBase's current "fields" schema format (PocketBase 0.23+).
// The older "schema" array format silently produces collections with no
// custom fields at all on this version, which is why this file rewrites
// missing fields onto existing collections rather than only creating new
// ones the first time.

let adminToken: string | null = null;

async function getAdminToken(pbUrl: string): Promise<string | null> {
  const email = Deno.env.get('PB_ADMIN_EMAIL') || 'admin@corevision.local';
  const password = Deno.env.get('PB_ADMIN_PASSWORD') || 'AdminCoreVision2026!';

  try {
    const res = await fetch(`${pbUrl}/api/collections/_superusers/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: email, password }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token;
  } catch {
    return null;
  }
}

interface FieldDef {
  name: string;
  type: 'text' | 'bool' | 'date' | 'json' | 'number';
  required?: boolean;
}

async function ensureCollection(pbUrl: string, name: string, fields: FieldDef[]) {
  try {
    const listRes = await fetch(`${pbUrl}/api/collections`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    });
    const collections = await listRes.json();
    const existing = collections.items?.find((c: any) => c.name === name);

    const fieldDefs = fields.map((f) => ({ name: f.name, type: f.type, required: !!f.required }));

    if (!existing) {
      console.log(`Creating ${name} collection...`);
      const res = await fetch(`${pbUrl}/api/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ name, type: 'base', fields: fieldDefs }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed to create ${name}`);
      }
      console.log(`✅ ${name} collection created`);
      return;
    }

    // Collection exists — make sure every expected field is present
    // (handles collections previously created with no custom fields).
    const existingNames = new Set((existing.fields || []).map((f: any) => f.name));
    const missing = fieldDefs.filter((f) => !existingNames.has(f.name));

    if (missing.length > 0) {
      console.log(`Adding missing fields to ${name}: ${missing.map((f) => f.name).join(', ')}`);
      const res = await fetch(`${pbUrl}/api/collections/${existing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ fields: [...existing.fields, ...missing] }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed to update ${name}`);
      }
      console.log(`✅ ${name} collection updated with missing fields`);
    } else {
      console.log(`✅ ${name} collection already up to date`);
    }
  } catch (err: any) {
    console.error(`Error with ${name} collection:`, err.message);
  }
}

export async function initializePocketBase(pbUrl: string) {
  console.log('Initializing PocketBase collections...');

  try {
    adminToken = await getAdminToken(pbUrl);
    if (!adminToken) {
      console.warn('⚠️ Could not authenticate as PocketBase admin, skipping collection setup');
      return false;
    }

    await ensureCollection(pbUrl, 'clients', [
      { name: 'nom', type: 'text', required: true },
      { name: 'prenom', type: 'text' },
      { name: 'email', type: 'text' },
      { name: 'telephone', type: 'text' },
      { name: 'status', type: 'text' },
      { name: 'patrimoine', type: 'json' },
    ]);

    await ensureCollection(pbUrl, 'hub_mails', [
      { name: 'from', type: 'text', required: true },
      { name: 'to', type: 'text' },
      { name: 'subject', type: 'text', required: true },
      { name: 'body', type: 'text' },
      { name: 'sentAt', type: 'date' },
      { name: 'clientId', type: 'text' },
      { name: 'hubTab', type: 'text' },
      { name: 'traitementStatus', type: 'text' },
      { name: 'read', type: 'bool' },
    ]);

    await ensureCollection(pbUrl, 'tasks', [
      { name: 'title', type: 'text', required: true },
      { name: 'description', type: 'text' },
      { name: 'status', type: 'text' },
      { name: 'priority', type: 'text' },
      { name: 'dueDate', type: 'date' },
      { name: 'clientId', type: 'text' },
    ]);

    await ensureCollection(pbUrl, 'hub_calls', [
      { name: 'clientId', type: 'text' },
      { name: 'subject', type: 'text', required: true },
      { name: 'dueDate', type: 'date' },
      { name: 'priority', type: 'text' },
      { name: 'status', type: 'text' },
    ]);

    console.log('✅ Collections initialized');
    return true;
  } catch (err: any) {
    console.error('Error initializing collections:', err.message);
    return false;
  }
}
