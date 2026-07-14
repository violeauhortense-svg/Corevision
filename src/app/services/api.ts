import { apiBaseUrl, publicAnonKey } from '../utils/api/info';
import { supabase } from '../utils/api/client';

const BASE_URL = apiBaseUrl;

console.log('🔗 API Base URL:', BASE_URL);

// ─── Session ───────────────────────────────────────────────────────────────

async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    return { access_token: session.access_token, user: session.user, isValid: true };
  }
  // Non connecté — pas de fallback localStorage pour les données sensibles
  return { access_token: publicAnonKey, user: { id: 'anonymous' }, isValid: false };
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const session = await getSession();
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

// ─── Mapping tâches : serveur (champs FR) ↔ frontend (champs EN) ───────────

function taskToFrontend(task: any): any {
  const priorityMap: Record<string, string> = {
    'Haute': 'high', 'Moyenne': 'normal', 'Basse': 'low',
  };
  return {
    ...task,
    clientId: task.client_id,
    title: task.titre ?? task.title ?? '',
    description: task.description ?? '',
    priority: priorityMap[task.priorite] ?? task.priority ?? 'normal',
    deadline: task.date_echeance ?? task.deadline ?? '',
    completed: task.statut === 'Terminé' || task.completed === true,
    stage: task.stage ?? null,
    createdAt: task.date_creation ?? task.createdAt ?? new Date().toISOString(),
    documentRequests: task.documentRequests ?? [],
  };
}

function taskToServer(taskData: any): any {
  const priorityMap: Record<string, string> = {
    'high': 'Haute', 'normal': 'Moyenne', 'low': 'Basse',
  };
  return {
    titre: taskData.titre ?? taskData.title,
    description: taskData.description,
    priorite: priorityMap[taskData.priority ?? taskData.priorite] ?? taskData.priorite ?? 'Moyenne',
    date_echeance: taskData.date_echeance ?? taskData.deadline,
    statut: taskData.completed === true ? 'Terminé' : (taskData.statut ?? 'À faire'),
    stage: taskData.stage,
    documentRequests: taskData.documentRequests,
  };
}

// =============================================================================
// CLIENT API — données sur le serveur uniquement
// =============================================================================

function clientToFrontend(client: any): any {
  return {
    ...client,
    firstName: client.firstName ?? client.prenom ?? '',
    lastName: client.lastName ?? client.nom ?? '',
    phone: client.phone ?? client.telephone ?? '',
    status: client.status ?? client.statut ?? 'R0 - Prospect',
    name: `${client.prenom || client.firstName || ''} ${client.nom || client.lastName || ''}`.trim(),
  };
}

function clientToServer(clientData: any): any {
  return {
    ...clientData,
    nom: clientData.lastName ?? clientData.nom ?? '',
    prenom: clientData.firstName ?? clientData.prenom ?? '',
    telephone: clientData.phone ?? clientData.telephone ?? '',
    statut: clientData.status ?? clientData.statut ?? 'R0 - Prospect',
  };
}

export const clientAPI = {
  async getById(clientId: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/clients/${clientId}`, { headers });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Erreur serveur ${response.status}`);
    }
    const data = await response.json();
    const client = data.client ?? data;
    return clientToFrontend(client);
  },

  async getAll() {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/clients`, { headers });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Erreur serveur ${response.status}`);
    }
    const data = await response.json();
    const clients = data.clients ?? data ?? [];
    return Array.isArray(clients) ? clients.map(clientToFrontend) : [];
  },

  async create(clientData: any) {
    const payload = clientToServer(clientData);
    const response = await fetch(`${BASE_URL}/clients`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Échec de la création du client');
    }
    const data = await response.json();
    const client = data.client ?? data;
    return clientToFrontend(client);
  },

  async update(clientId: string, clientData: any) {
    const payload = clientToServer(clientData);
    const response = await fetch(`${BASE_URL}/clients/${clientId}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Échec de la mise à jour du client');
    }
    const data = await response.json();
    const client = data.client ?? data;
    return clientToFrontend(client);
  },

  async delete(clientId: string) {
    const response = await fetch(`${BASE_URL}/clients/${clientId}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Échec de la suppression du client');
    }
    return response.json();
  },
};

// =============================================================================
// TASK API — données sur le serveur uniquement
// =============================================================================

export const taskAPI = {
  async getAll() {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/client-tasks`, { headers });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Erreur serveur ${response.status}`);
    }
    const data = await response.json();
    const tasks = data.tasks ?? data ?? [];
    return tasks.map(taskToFrontend);
  },

  async getByClientId(clientId: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/clients/${clientId}/tasks`, { headers });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Erreur serveur ${response.status}`);
    }
    const data = await response.json();
    const tasks = data.tasks ?? data ?? [];
    return tasks.map(taskToFrontend);
  },

  async create(clientId: string, taskData: {
    titre?: string;
    title?: string;
    description: string;
    priorite?: string;
    priority?: string;
    date_echeance?: string;
    deadline?: string;
    stage?: string;
  }) {
    const payload = taskToServer({ ...taskData, clientId });
    const response = await fetch(`${BASE_URL}/clients/${clientId}/tasks`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Échec de la création de la tâche');
    }
    const data = await response.json();
    return taskToFrontend(data.task ?? data);
  },

  async update(taskId: string, taskData: any) {
    const payload = taskToServer(taskData);
    const response = await fetch(`${BASE_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ ...payload, documentRequests: taskData.documentRequests }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Échec de la mise à jour de la tâche');
    }
    const data = await response.json();
    return taskToFrontend(data.task ?? data);
  },

  async delete(taskId: string) {
    const response = await fetch(`${BASE_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Échec de la suppression de la tâche');
    }
    return response.json();
  },
};

// ─── RDV API ──────────────────────────────────────────────────────────────

export const rdvAPI = {
  async createProposal(proposalData: {
    clientId: string;
    date: string;
    time: string;
    location: string;
    locationOther?: string;
    documentsRequested: string[];
    sendToSpouse: boolean;
    emailContent: string;
    clientEmail: string;
    clientName: string;
    spouseEmail?: string;
    spouseName?: string;
  }) {
    const response = await fetch(`${BASE_URL}/rdv/create-proposal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proposalData),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Échec de la création de la proposition de RDV');
    }
    return response.json();
  },

  async createAccountantRequest(requestData: {
    clientId: string;
    accountantEmail: string;
    accountantName: string;
    companyName: string;
    documentsRequested: string[];
    emailContent: string;
  }) {
    const response = await fetch(`${BASE_URL}/accountant-request/create-proposal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Échec de la création de la demande comptable');
    }
    return response.json();
  },
};
