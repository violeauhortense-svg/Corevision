// Dashboard Routes - PocketBase
// Provides metrics and kanban data for the frontend dashboard, computed
// from the real clients collection (no more hardcoded zeros).

import { Hono } from 'hono';
import { pb } from './pocketbase_client.tsx';

const app = new Hono();

const STATUSES = [
  'Prospect',
  'Découverte',
  'Simulation',
  'Lettre Mission',
  'Rapport/Audit',
  'Suivi MEP',
  'Suivi CSP',
  'Arbitrage',
];

function normalizedStatus(client: any): string {
  const raw = client.statusOuvert || client.status || 'Prospect';
  // "Terminé" n'est pas un statut du pipeline (pas de bloc de tâches) -
  // sans ce cas particulier, il serait introuvable dans STATUSES et
  // retomberait sur "Prospect", ce qui compterait les tâches (inexistantes)
  // du premier statut pour un dossier pourtant terminé, et ferait
  // réapparaître le client dans la colonne Kanban "Prospect".
  if (String(raw).toLowerCase() === 'terminé') return 'Terminé';
  const match = STATUSES.find((s) => s.toLowerCase() === String(raw).toLowerCase());
  return match || 'Prospect';
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isWithinNext7Days(date: Date, now: Date): boolean {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return date >= start && date < end;
}

// ─── GET /metrics ────────────────────────────────────────────────────
app.get('/metrics', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const clients = await pb.listRecords('clients', { perPage: 500 });
    const now = new Date();

    let rdvAujourdHui = 0;
    let rdvCetteSemaine = 0;
    let tachesAujourdHui = 0;
    let caTotal = 0;

    for (const client of clients.items) {
      // RDV: count clients whose next appointment falls today / in the next 7 days
      if (client.dateNextRdv) {
        const rdvDate = new Date(client.dateNextRdv);
        if (!isNaN(rdvDate.getTime())) {
          if (isSameDay(rdvDate, now)) rdvAujourdHui++;
          if (isWithinNext7Days(rdvDate, now)) rdvCetteSemaine++;
        }
      }

      // Pending tasks in the client's current pipeline block
      const status = normalizedStatus(client);
      const tasksForStatus = client.taches?.[status] || [];
      tachesAujourdHui += tasksForStatus.filter((t: any) => !t.completed && t.status !== 'na').length;

      // Revenue
      caTotal += Number(client.tauxCA) || 0;

      // Recommandations' CA only counts toward the dashboard total when
      // attributed to Hortense herself AND actually accepted by the
      // client - 'proposee' isn't real revenue yet, and 'refusee' never
      // will be. CA credited to M. Lecler or a service is tracked in the
      // module but shouldn't inflate her own revenue card.
      const recommendations = Array.isArray(client.auditRecommendations) ? client.auditRecommendations : [];
      for (const rec of recommendations) {
        const acceptedByClient = rec.status !== 'proposee' && rec.status !== 'refusee';
        if (rec.venduPar === 'moi' && acceptedByClient) {
          caTotal += Number(rec.chiffreAffaires) || 0;
        }
      }
    }

    let mailsATraiter = 0;
    try {
      const mails = await pb.listRecords('hub_mails', {
        filter: 'traitementStatus = "a_traiter" || traitementStatus = ""',
        perPage: 1,
      });
      mailsATraiter = mails.total;
    } catch {
      // hub_mails collection may be empty/unreachable - not critical for the dashboard
    }

    return c.json({
      metrics: {
        rdvAujourdHui,
        rdvCetteSemaine,
        tachesAujourdHui,
        caTotal,
        mailsATraiter,
        suiviDossiers: clients.total,
      },
    }, 200);
  } catch (err: any) {
    console.error('Dashboard metrics error:', err.message);
    return c.json({
      metrics: {
        rdvAujourdHui: 0,
        rdvCetteSemaine: 0,
        tachesAujourdHui: 0,
        caTotal: 0,
        mailsATraiter: 0,
        suiviDossiers: 0,
      },
    }, 200);
  }
});

// ─── GET /kanban ────────────────────────────────────────────────────
app.get('/kanban', async (c) => {
  const kanban: Record<string, any> = {};
  for (const status of STATUSES) {
    kanban[status] = { count: 0, actions: 0, clients: [] };
  }

  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const clients = await pb.listRecords('clients', { perPage: 500 });

    for (const client of clients.items) {
      const status = normalizedStatus(client);

      // Un dossier "Terminé" n'a pas de colonne dans ce Kanban (ce n'est
      // pas un statut du pipeline) - sans ce skip, kanban[status] serait
      // undefined ci-dessous et ferait planter toute la requête.
      if (status === 'Terminé') continue;

      const tasksForStatus = client.taches?.[status] || [];
      const pendingActions = tasksForStatus.filter((t: any) => !t.completed && t.status !== 'na').length;

      // Prochaine tâche à réaliser pour ce client, dans son statut actuel -
      // pas pertinent pour "Suivi CSP" (aucun remplacement demandé, on
      // l'omet) ni pour "Arbitrage" (la date de clôture d'exercice est
      // affichée à la place, voir arbitrageClosureDate ci-dessous).
      let nextTaskTitle = '';
      if (status !== 'Suivi CSP' && status !== 'Arbitrage') {
        const nextTask = tasksForStatus.find((t: any) => !t.completed && t.status !== 'na');
        nextTaskTitle = nextTask?.title || '';
      }

      kanban[status].count += 1;
      kanban[status].actions += pendingActions;
      kanban[status].clients.push({
        id: client.id,
        nom: `${client.prenom || client.firstName || ''} ${client.nom || client.lastName || ''}`.trim() || 'Sans nom',
        nextTaskTitle,
        arbitrageClosureDate: status === 'Arbitrage' ? (client.arbitrageClosureDate || '') : '',
        taskCount: pendingActions,
        tauxCA: Number(client.tauxCA) || 0,
      });
    }

    return c.json(kanban, 200);
  } catch (err: any) {
    console.error('Dashboard kanban error:', err.message);
    return c.json(kanban, 200);
  }
});

export default app;
