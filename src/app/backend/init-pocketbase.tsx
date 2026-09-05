// Auto-initialize PocketBase collections
// Run this on backend startup to ensure all collections exist

export async function initializePocketBase(pbUrl: string) {
  console.log('Initializing PocketBase collections...');

  try {
    // Create users collection if it doesn't exist
    await createUsersCollection(pbUrl);

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

// Users collection
async function createUsersCollection(pbUrl: string) {
  try {
    const res = await fetch(`${pbUrl}/api/collections`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const collections = await res.json();
    const exists = collections.items?.some((c: any) => c.name === 'users');

    if (!exists) {
      console.log('Creating users collection...');
      await fetch(`${pbUrl}/api/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'users',
          type: 'base',
          schema: [
            { id: 'email', name: 'email', type: 'text', required: true, unique: true },
            { id: 'password', name: 'password', type: 'text', required: true },
            { id: 'name', name: 'name', type: 'text' },
            { id: 'role', name: 'role', type: 'text' },
          ],
        }),
      });

      // Create test user
      console.log('Creating test user...');
      await fetch(`${pbUrl}/api/collections/users/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'violeau.hortense@gmail.com',
          password: 'Hvguillote78',
          name: 'Hortense Violeau',
          role: 'consultant',
        }),
      });

      console.log('✅ users collection created with test user');
    } else {
      console.log('✅ users collection already exists');
    }
  } catch (err: any) {
    console.error('Error with users collection:', err.message);
  }
}

// Clients collection
async function createClientsCollection(pbUrl: string) {
  try {
    const res = await fetch(`${pbUrl}/api/collections`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const collections = await res.json();
    const exists = collections.items?.some((c: any) => c.name === 'clients');

    if (!exists) {
      console.log('Creating clients collection...');
      await fetch(`${pbUrl}/api/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
    });

    const collections = await res.json();
    const exists = collections.items?.some((c: any) => c.name === 'hub_mails');

    if (!exists) {
      console.log('Creating hub_mails collection...');
      await fetch(`${pbUrl}/api/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
    });

    const collections = await res.json();
    const exists = collections.items?.some((c: any) => c.name === 'tasks');

    if (!exists) {
      console.log('Creating tasks collection...');
      await fetch(`${pbUrl}/api/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
    });

    const collections = await res.json();
    const exists = collections.items?.some((c: any) => c.name === 'hub_calls');

    if (!exists) {
      console.log('Creating hub_calls collection...');
      await fetch(`${pbUrl}/api/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
