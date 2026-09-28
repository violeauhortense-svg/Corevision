// Commandes d'audit CoreVision - créées depuis l'onglet Objectifs d'une
// fiche client ("Commander l'audit"), gérées depuis le panneau admin
// "Commandes CoreVision" (CoreVisionAdminView.tsx / CoreVisionAdminDetailModal.tsx).
//
// `orderId` est un identifiant métier généré côté front
// (`order-${clientId}-${Date.now()}`), distinct de l'id d'enregistrement
// PocketBase - toutes les routes ci-dessous le retrouvent via un filtre.

import { Hono } from 'hono';
import { pb } from './pocketbase_client.tsx';

const app = new Hono();

async function findByOrderId(orderId: string) {
  const { items } = await pb.listRecords('corevision_orders', {
    filter: `orderId = "${orderId}"`,
    perPage: 1,
  });
  return items[0] || null;
}

// ─── GET / - liste toutes les commandes (panneau admin) ────────────────
app.get('/', async (c) => {
  try {
    const { items, total } = await pb.listRecords('corevision_orders', {
      sort: '-validatedAt',
      perPage: 200,
    });
    return c.json({ orders: items, count: total });
  } catch (err: any) {
    console.error('Erreur liste commandes CoreVision:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// ─── POST / - crée une commande (bouton "Commander l'audit") ───────────
app.post('/', async (c) => {
  try {
    const body = await c.req.json();

    if (!body.orderId || !body.clientId) {
      return c.json({ error: 'orderId et clientId requis' }, 400);
    }

    const record = await pb.createRecord('corevision_orders', {
      orderId: body.orderId,
      clientId: body.clientId,
      clientName: body.clientName || '',
      cgpName: body.cgpName || '',
      cgpEmail: body.cgpEmail || '',
      objectifs: body.objectifs || [],
      montant: body.montant || 0,
      validatedAt: body.validatedAt || new Date().toISOString(),
      status: body.status || 'pending',
      createdAt: body.createdAt || new Date().toISOString(),
      bilanData: body.bilanData || null,
    });

    return c.json({ success: true, order: record }, 201);
  } catch (err: any) {
    console.error('Erreur création commande CoreVision:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// ─── PUT /:orderId - met à jour une commande (statut, audit, préconisations...) ─
app.put('/:orderId', async (c) => {
  try {
    const orderId = c.req.param('orderId');
    const updates = await c.req.json();

    const existing = await findByOrderId(orderId);
    if (!existing) {
      return c.json({ error: 'Commande introuvable' }, 404);
    }

    const record = await pb.updateRecord('corevision_orders', existing.id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    return c.json({ success: true, order: record });
  } catch (err: any) {
    console.error('Erreur mise à jour commande CoreVision:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// ─── DELETE /:orderId ────────────────────────────────────────────────
app.delete('/:orderId', async (c) => {
  try {
    const orderId = c.req.param('orderId');

    const existing = await findByOrderId(orderId);
    if (!existing) {
      return c.json({ error: 'Commande introuvable' }, 404);
    }

    await pb.deleteRecord('corevision_orders', existing.id);
    return c.json({ success: true });
  } catch (err: any) {
    console.error('Erreur suppression commande CoreVision:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

export default app;
