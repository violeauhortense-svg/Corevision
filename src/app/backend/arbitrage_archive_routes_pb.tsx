// Arbitrage Archive Routes - PocketBase
// Archives one completed arbitrage cycle (closure date, treasury need, a
// snapshot of its 5 tasks) and resets the client's live Arbitrage block
// for the next cycle (N+1): tasks back to pending, closure date advanced
// by one year (pre-filled rather than left blank, per the user's request),
// treasury need cleared since that figure is specific to each exercise.

import { Hono } from 'hono';
import { pb } from './pocketbase_client.tsx';

const app = new Hono();

// "2026-06-30" -> "2027-06-30" (one year later, same month/day)
function addOneYear(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const date = new Date(y + 1, m - 1, d);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ─── GET /:clientId (list archived cycles, most recent first) ─────────
app.get('/:clientId', async (c) => {
  try {
    const clientId = c.req.param('clientId');
    const result = await pb.listRecords('arbitrage_archive', {
      filter: `clientId = "${clientId}"`,
      sort: '-archivedAt',
    });
    return c.json({ archives: result.items });
  } catch (err: any) {
    console.error('Error listing arbitrage archive:', err.message);
    return c.json({ archives: [], error: err.message }, 500);
  }
});

// ─── POST / (archive the current cycle, reset for N+1) ────────────────
app.post('/', async (c) => {
  try {
    const { clientId, closureDate, treasuryNeed, tasks } = await c.req.json();
    if (!clientId) return c.json({ error: 'clientId manquant' }, 400);

    const archived = await pb.createRecord('arbitrage_archive', {
      clientId,
      closureDate: closureDate || '',
      treasuryNeed: treasuryNeed || 0,
      tasks: tasks || [],
      archivedAt: new Date().toISOString(),
    });

    // Repart à zéro pour le cycle suivant : mêmes tâches (id/titre/
    // description/bouton), juste remises à "à faire".
    const resetTasks = Array.isArray(tasks)
      ? tasks.map((t: any) => ({ ...t, completed: false, status: 'pending' }))
      : [];
    const nextClosureDate = closureDate ? addOneYear(closureDate) : '';

    const client = await pb.getRecord('clients', clientId);
    const newTaches = { ...(client.taches || {}), Arbitrage: resetTasks };

    const updatedClient = await pb.updateRecord('clients', clientId, {
      taches: newTaches,
      arbitrageClosureDate: nextClosureDate,
      arbitrageTreasuryN1: 0,
    });

    return c.json({ archived, client: updatedClient }, 201);
  } catch (err: any) {
    console.error('Error archiving arbitrage cycle:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

export default app;
