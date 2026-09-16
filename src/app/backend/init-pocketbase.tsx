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
      { name: 'statut', type: 'text' },
      { name: 'patrimoine', type: 'json' },
      { name: 'dateNaissance', type: 'text' },
      { name: 'adresse', type: 'text' },
      { name: 'ville', type: 'text' },
      { name: 'codePostal', type: 'text' },
      { name: 'situation', type: 'text' },
      { name: 'profession', type: 'text' },
      { name: 'revenus', type: 'json' },
      { name: 'foyer', type: 'json' },
      { name: 'objectifs', type: 'json' },
      { name: 'recommendations', type: 'json' },
      { name: 'entreprises', type: 'json' },
      { name: 'contacts', type: 'json' },
      { name: 'score', type: 'number' },
      { name: 'derniereActivite', type: 'text' },
      { name: 'date_creation', type: 'text' },
      { name: 'statusOuvert', type: 'text' },
      { name: 'dateNextRdv', type: 'text' },
      { name: 'nextRdvDetails', type: 'json' },
      { name: 'tauxCA', type: 'number' },
      { name: 'cspSigne', type: 'bool' },
      { name: 'taches', type: 'json' },
      { name: 'mailsATraiter', type: 'number' },
      { name: 'categoriesDossier', type: 'json' },
      { name: 'arbitrageClosureDate', type: 'text' },
      { name: 'arbitrageTreasuryN1', type: 'number' },
      // Fields used by the detailed client edit view (useClientData.ts /
      // saveToAPI), which uses a different field naming scheme than
      // ClientService.ts's Client type above.
      { name: 'name', type: 'text' },
      { name: 'firstName', type: 'text' },
      { name: 'lastName', type: 'text' },
      { name: 'phone', type: 'text' },
      { name: 'address', type: 'text' },
      { name: 'birthDate', type: 'text' },
      { name: 'majorationPartFiscale', type: 'bool' },
      { name: 'auditCoreVision', type: 'json' },
      { name: 'presentationCoreVision', type: 'json' },
      { name: 'preconisationsCoreVision', type: 'json' },
      { name: 'maritalStatus', type: 'text' },
      { name: 'regimeMatrimonial', type: 'text' },
      { name: 'spouse', type: 'json' },
      { name: 'children', type: 'json' },
      { name: 'imposition', type: 'json' },
      { name: 'patrimoineData', type: 'json' },
      { name: 'auditRecommendations', type: 'json' },
      { name: 'documents', type: 'json' },
      { name: 'regulatoryDocs', type: 'json' },
      { name: 'contactsProfessionnels', type: 'json' },
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
