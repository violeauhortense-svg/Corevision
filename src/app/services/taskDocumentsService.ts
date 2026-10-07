/**
 * PDF attachés à une tâche du pipeline (ex: "Pièces comptables reçues"
 * dans Arbitrage) - voir task_documents_routes_pb.tsx côté backend.
 */
import { apiBaseUrl } from '../utils/api/info';

export interface TaskDocument {
  id: string;
  clientId: string;
  taskId: string;
  filename: string;
  uploadedAt: string;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getTaskDocuments(clientId: string, taskId: string): Promise<TaskDocument[]> {
  const response = await fetch(`${apiBaseUrl}/api/task-documents/${clientId}/${taskId}`, {
    headers: authHeaders(),
  });
  if (!response.ok) return [];
  const data = await response.json();
  return data.documents || [];
}

export async function uploadTaskDocument(clientId: string, taskId: string, file: File): Promise<TaskDocument> {
  const formData = new FormData();
  formData.set('file', file, file.name);

  const response = await fetch(`${apiBaseUrl}/api/task-documents/${clientId}/${taskId}`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Échec de l'envoi du document");
  }
  return response.json();
}

export async function deleteTaskDocument(id: string): Promise<boolean> {
  const response = await fetch(`${apiBaseUrl}/api/task-documents/documents/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return response.ok;
}

export function taskDocumentUrl(id: string, { download = false } = {}): string {
  return `${apiBaseUrl}/api/task-documents/documents/${id}/download${download ? '?download=1' : ''}`;
}
