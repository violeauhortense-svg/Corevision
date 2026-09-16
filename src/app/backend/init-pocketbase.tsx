// Auto-initialize PocketBase collections
// Run this on backend startup to ensure all collections exist
//
// Note: the "users" auth collection is created automatically by PocketBase
// itself (it's a built-in system collection) and is NOT managed here.

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

export async function initializePocketBase(pbUrl: string) {
  console.log('Initializing PocketBase collections...');

  try {
    adminToken = await getAdminToken(pbUrl);
    if (!adminToken) {
      console.warn('⚠️ Could not authenticate as PocketBase admin, skipping collection setup');
      return false;
    }

    // Create other collections
    await createClientsCollection(pbUrl);
    await createMailsCollection(pbUrl);
    await createTasksCollection(pbUrl);
    await createCallsCollection(pbUrl);

    console.log('✅ Collections initialized');
    return true;
  } catch (err: any) {
    console.error('Error initializing collections:', err.message);
    return false;
  }
}

// Clients collection
async function createClientsCollection(pbUrl: string) {
  try {
    const res = await fetch(`${pbUrl}/api/collections`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    });

    const collections = await res.json();
    const exists = collections.items?.some((c: any) => c.name === 'clients');

    if (!exists) {
      console.log('Creating clients collection...');
      await fetch(`${pbUrl}/api/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          name: 'clients',
          type: 'base',
          schema: [
            { id: 'nom', name: 'nom', type: 'text', required: true },
            { id: 'prenom', name: 'prenom', type: 'text' },
            { id: 'email', name: 'email', type: 'text', unique: true },
            { id: 'telephone', name: 'telephone', type: 'text' },
            { id: 'status', name: 'status', type: 'text' },
          ],
        }),
      });

      console.log('✅ clients collection created');
    }
  } catch (err: any) {
    console.error('Error with clients collection:', err.message);
  }
}

// Hub Mails collection
async function createMailsCollection(pbUrl: string) {
  try {
    const res = await fetch(`${pbUrl}/api/collections`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    });

    const collections = await res.json();
    const exists = collections.items?.some((c: any) => c.name === 'hub_mails');

    if (!exists) {
      console.log('Creating hub_mails collection...');
      await fetch(`${pbUrl}/api/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          name: 'hub_mails',
          type: 'base',
          schema: [
            { id: 'from', name: 'from', type: 'text', required: true },
            { id: 'to', name: 'to', type: 'text' },
            { id: 'subject', name: 'subject', type: 'text', required: true },
            { id: 'body', name: 'body', type: 'text' },
            { id: 'sentAt', name: 'sentAt', type: 'date' },
            { id: 'clientId', name: 'clientId', type: 'text' },
            { id: 'hubTab', name: 'hubTab', type: 'text' },
            { id: 'traitementStatus', name: 'traitementStatus', type: 'text' },
            { id: 'read', name: 'read', type: 'bool' },
          ],
        }),
      });

      console.log('✅ hub_mails collection created');
    }
  } catch (err: any) {
    console.error('Error with hub_mails collection:', err.message);
  }
}

// Tasks collection
async function createTasksCollection(pbUrl: string) {
  try {
    const res = await fetch(`${pbUrl}/api/collections`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    });

    const collections = await res.json();
    const exists = collections.items?.some((c: any) => c.name === 'tasks');

    if (!exists) {
      console.log('Creating tasks collection...');
      await fetch(`${pbUrl}/api/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          name: 'tasks',
          type: 'base',
          schema: [
            { id: 'title', name: 'title', type: 'text', required: true },
            { id: 'description', name: 'description', type: 'text' },
            { id: 'status', name: 'status', type: 'text' },
            { id: 'priority', name: 'priority', type: 'text' },
            { id: 'dueDate', name: 'dueDate', type: 'date' },
            { id: 'clientId', name: 'clientId', type: 'text' },
          ],
        }),
      });

      console.log('✅ tasks collection created');
    }
  } catch (err: any) {
    console.error('Error with tasks collection:', err.message);
  }
}

// Calls collection
async function createCallsCollection(pbUrl: string) {
  try {
    const res = await fetch(`${pbUrl}/api/collections`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    });

    const collections = await res.json();
    const exists = collections.items?.some((c: any) => c.name === 'hub_calls');

    if (!exists) {
      console.log('Creating hub_calls collection...');
      await fetch(`${pbUrl}/api/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          name: 'hub_calls',
          type: 'base',
          schema: [
            { id: 'clientId', name: 'clientId', type: 'text' },
            { id: 'subject', name: 'subject', type: 'text', required: true },
            { id: 'dueDate', name: 'dueDate', type: 'date' },
            { id: 'priority', name: 'priority', type: 'text' },
            { id: 'status', name: 'status', type: 'text' },
          ],
        }),
      });

      console.log('✅ hub_calls collection created');
    }
  } catch (err: any) {
    console.error('Error with hub_calls collection:', err.message);
  }
}
