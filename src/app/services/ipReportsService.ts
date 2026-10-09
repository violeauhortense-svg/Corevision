/**
 * Rapports IP (6 matrices Word selon profession/structure) propres à une
 * commande CoreVision - voir corevision_routes_pb.tsx côté backend.
 * Contrairement au comparatif EI/SEL, chaque variante est générée à la
 * demande (l'admin choisit laquelle concerne la commande), pas à la
 * création de la commande.
 */
import { apiBaseUrl } from '../utils/api/info';

export interface IpTemplateOption {
  key: string;
  label: string;
}

export interface IpGeneratedDoc {
  filename: string;
  updatedAt: string;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function listIpReports(orderId: string): Promise<{
  templates: IpTemplateOption[];
  generated: Record<string, IpGeneratedDoc>;
}> {
  const response = await fetch(`${apiBaseUrl}/api/corevision/orders/${orderId}/ip-reports`, {
    headers: authHeaders(),
  });
  if (!response.ok) return { templates: [], generated: {} };
  return response.json();
}

export async function generateIpReport(orderId: string, templateKey: string): Promise<IpGeneratedDoc> {
  const response = await fetch(
    `${apiBaseUrl}/api/corevision/orders/${orderId}/ip-reports/${templateKey}/generate`,
    { method: 'POST', headers: authHeaders() }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Échec de la génération');
  }
  return response.json();
}

export async function uploadIpReport(orderId: string, templateKey: string, file: File): Promise<IpGeneratedDoc> {
  const formData = new FormData();
  formData.set('file', file, file.name);

  const response = await fetch(`${apiBaseUrl}/api/corevision/orders/${orderId}/ip-reports/${templateKey}`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Échec de l'import du fichier");
  }
  return response.json();
}

export function ipReportUrl(orderId: string, templateKey: string, { download = false } = {}): string {
  return `${apiBaseUrl}/api/corevision/orders/${orderId}/ip-reports/${templateKey}/download${download ? '?download=1' : ''}`;
}
