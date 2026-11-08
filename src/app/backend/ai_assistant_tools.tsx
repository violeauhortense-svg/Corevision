// Outils (tool-calling) de l'assistant IA d'organisation.
// Chaque outil interroge les vraies données via le client `pb` existant et
// retourne du JSON compact - le modèle construit sa réponse à partir de ces
// résultats réels, jamais d'invention. Volontairement limité à 4 outils en
// v1 (tâches, recommandations, agenda, mails à traiter), mappés exactement
// sur l'exemple "qu'est-ce qui est urgent cette semaine" de la demande.

import { pb } from './pocketbase_client.tsx';
import { TASK_DEFINITIONS, getTaskDefs } from '../components/tasks/taskDefinitions.ts';

// Même logique que `normalizedClientStatus` dans clientTasksService.ts
// (frontend) - réimplémentée ici plutôt qu'importée, pour ne pas faire
// dépendre ce fichier backend de ClientService (qui appelle apiBaseUrl en
// HTTP, donc le tunnel ngrok, pour une donnée que ce process a déjà en
// local via PocketBase).
const PIPELINE_STATUSES = Object.keys(TASK_DEFINITIONS);
function normalizedClientStatus(client: any): string {
  const raw = client.statusOuvert || client.status || 'Prospect';
  if (String(raw).toLowerCase() === 'terminé') return 'Terminé';
  const match = PIPELINE_STATUSES.find((s) => s.toLowerCase() === String(raw).toLowerCase());
  return match || 'Prospect';
}

const HIDDEN_FROM_TODO = new Set(['p1', 'd1', 's4', 'mep1']);

// ─── Schémas d'outils (format OpenAI-compatible, utilisé tel quel par
// l'API /api/chat d'Ollama) ──────────────────────────────────────────
export const AI_ASSISTANT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_open_tasks',
      description:
        "Retourne la prochaine tâche en attente de chaque client (pipeline), avec client, statut et échéance. C'est la vraie liste de tâches qu'Hortense voit dans son onglet To Do List.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_urgent_recommendations',
      description:
        "Retourne les recommandations clients encore au statut \"proposée\" (en attente de décision du client), avec le chiffre d'affaires associé.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_upcoming_agenda',
      description:
        "Retourne les événements d'agenda à venir dans les prochains jours (rendez-vous, réunions), en signalant ceux dont la réponse (accepté/refusé) est encore en attente.",
      parameters: {
        type: 'object',
        properties: {
          days: { type: 'number', description: 'Fenêtre en jours (défaut 7)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_mails_a_traiter',
      description: "Retourne les mails du Hub Communication encore marqués \"à traiter\".",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
] as const;

// ─── Exécuteurs ───────────────────────────────────────────────────────

async function getOpenTasks() {
  const { items: clients } = await pb.listRecords('clients', { perPage: 500 });
  const open: any[] = [];

  for (const client of clients) {
    const status = normalizedClientStatus(client);
    if (status === 'Terminé') continue;

    const hasAnyTaskHistory = Object.keys(client.taches || {}).length > 0;
    if (!hasAnyTaskHistory && status !== 'Prospect') continue;

    const taskDefs = getTaskDefs(status);
    const existing = client.taches?.[status] || [];
    const clientName = `${client.prenom || ''} ${client.nom || ''}`.trim() || 'Client sans nom';

    for (const def of taskDefs) {
      if (HIDDEN_FROM_TODO.has(def.id)) continue;
      const task = existing.find((t: any) => t.id === def.id);
      const completed = task?.completed || false;
      const taskStatus = task?.status || 'pending';
      if (completed || taskStatus === 'na') continue;

      open.push({
        title: def.title,
        description: def.description,
        clientId: client.id,
        clientName,
        clientStatus: status,
        deadline: task?.deadline || null,
        // Signal simple pour "il te manque ça pour le faire" - pas de
        // jugement par le modèle, juste une détection de champ vide.
        missingInfo: !task?.deadline ? 'pas d\'échéance définie' : null,
      });
      break; // une seule tâche (la prochaine) par client, comme la To Do List
    }
  }

  // Jusqu'à 160 clients -> jusqu'à 160 tâches potentielles : envoyer tout
  // ça tel quel au modèle local l'a fait tronquer sa réponse en cours de
  // génération (observé en test, contexte/temps de génération dépassés).
  // Celles avec une échéance définie passent en premier (plus urgentes à
  // montrer), le tout plafonné à un volume qu'un modèle 7-8B peut
  // réellement synthétiser en une seule réponse.
  open.sort((a, b) => {
    if (a.deadline && !b.deadline) return -1;
    if (!a.deadline && b.deadline) return 1;
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
    return 0;
  });
  return open.slice(0, 20);
}

async function getUrgentRecommendations() {
  const { items: clients } = await pb.listRecords('clients', { perPage: 500 });
  const urgent: any[] = [];

  for (const client of clients) {
    const recos = client.auditRecommendations || [];
    const clientName = `${client.prenom || ''} ${client.nom || ''}`.trim() || 'Client sans nom';
    for (const reco of recos) {
      if (reco.status !== 'proposee') continue;
      urgent.push({
        clientId: client.id,
        clientName,
        title: reco.title,
        chiffreAffaires: reco.chiffreAffaires,
        createdDate: reco.createdDate,
      });
    }
  }

  urgent.sort((a, b) => (b.createdDate || '').localeCompare(a.createdDate || ''));
  return urgent.slice(0, 20);
}

async function getUpcomingAgenda(args: { days?: number }) {
  const days = args?.days && args.days > 0 ? args.days : 7;
  const now = new Date();
  const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const { items } = await pb.listRecords('agenda_events', {
    filter: `startDate >= "${now.toISOString()}" && startDate <= "${until.toISOString()}" && status != "declined"`,
    sort: 'startDate',
    perPage: 200,
  });

  return items.map((e: any) => ({
    title: e.title,
    startDate: e.startDate,
    endDate: e.endDate,
    status: e.status,
    clientId: e.clientId || null,
    needsResponse: e.status === 'not_responded' || !!e.pendingResponse,
  }));
}

async function getMailsATraiter() {
  const mails = await pb.getMailsByStatus('a_traiter');
  return mails
    .sort((a: any, b: any) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
    .slice(0, 20)
    .map((m: any) => ({
      subject: m.subject,
      clientName: m.clientName || null,
      sentAt: m.sentAt,
    }));
}

// ─── Dispatch ───────────────────────────────────────────────────────
export async function executeAiTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'get_open_tasks':
      return getOpenTasks();
    case 'get_urgent_recommendations':
      return getUrgentRecommendations();
    case 'get_upcoming_agenda':
      return getUpcomingAgenda(args || {});
    case 'get_mails_a_traiter':
      return getMailsATraiter();
    default:
      return { error: `Outil inconnu : ${name}` };
  }
}
