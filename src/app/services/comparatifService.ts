/**
 * Comparatif EI/SEL propre à une commande CoreVision - copié depuis le
 * modèle (37 feuilles) à la création de la commande, réimportable une
 * fois édité dans Excel (voir corevision_routes_pb.tsx côté backend).
 */
import { apiBaseUrl } from '../utils/api/info';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function comparatifUrl(orderId: string, { download = false } = {}): string {
  return `${apiBaseUrl}/api/corevision/orders/${orderId}/comparatif/download${download ? '?download=1' : ''}`;
}

export async function uploadComparatif(orderId: string, file: File): Promise<{ comparatifFilename: string; comparatifUpdatedAt: string }> {
  const formData = new FormData();
  formData.set('file', file, file.name);

  const response = await fetch(`${apiBaseUrl}/api/corevision/orders/${orderId}/comparatif`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Échec de l'import du fichier");
  }
  const data = await response.json();
  return data.order;
}
