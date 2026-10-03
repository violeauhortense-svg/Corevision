/**
 * PDF attachés à une recommandation (client.auditRecommendations) - voir
 * recommendation_documents_routes_pb.tsx côté backend pour le pourquoi
 * d'une collection séparée plutôt qu'un champ sur la recommandation elle-même.
 */
import { apiBaseUrl } from '../utils/api/info';

export interface RecommendationDocument {
  id: string;
  recommendationId: string;
  clientId: string;
  filename: string;
  uploadedAt: string;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getRecommendationDocuments(recommendationId: string): Promise<RecommendationDocument[]> {
  const response = await fetch(`${apiBaseUrl}/api/recommendations/${recommendationId}/documents`, {
    headers: authHeaders(),
  });
  if (!response.ok) return [];
  const data = await response.json();
  return data.documents || [];
}

export async function uploadRecommendationDocument(
  recommendationId: string,
  clientId: string,
  file: File
): Promise<RecommendationDocument> {
  const formData = new FormData();
  formData.set('clientId', clientId);
  formData.set('file', file, file.name);

  const response = await fetch(`${apiBaseUrl}/api/recommendations/${recommendationId}/documents`, {
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

export async function deleteRecommendationDocument(id: string): Promise<boolean> {
  const response = await fetch(`${apiBaseUrl}/api/recommendations/documents/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return response.ok;
}

export function recommendationDocumentUrl(id: string, { download = false } = {}): string {
  return `${apiBaseUrl}/api/recommendations/documents/${id}/download${download ? '?download=1' : ''}`;
}
