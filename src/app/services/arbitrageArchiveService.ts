/**
 * Historique des cycles d'arbitrage archivés - voir
 * arbitrage_archive_routes_pb.tsx côté backend.
 */
import { apiBaseUrl } from '../utils/api/info';

export interface ArbitrageArchiveEntry {
  id: string;
  clientId: string;
  closureDate: string;
  treasuryNeed: number;
  tasks: any[];
  archivedAt: string;
  structureType?: string;
  goldenShareHolding?: string;
  goldenShareDocteur?: string;
  creancesRestitution?: number;
  resultatAnnee?: number;
  capitalSocialReserves?: number;
  ccaDocteur?: number;
  disponibilites?: number;
  noteSynthese?: string;
}

export interface ArchiveArbitrageInput {
  clientId: string;
  closureDate: string;
  treasuryNeed: number;
  tasks: any[];
  structureType?: string;
  goldenShareHolding?: string;
  goldenShareDocteur?: string;
  creancesRestitution?: number;
  resultatAnnee?: number;
  capitalSocialReserves?: number;
  ccaDocteur?: number;
  disponibilites?: number;
  noteSynthese?: string;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' };
}

export async function getArbitrageArchive(clientId: string): Promise<ArbitrageArchiveEntry[]> {
  const response = await fetch(`${apiBaseUrl}/api/arbitrage-archive/${clientId}`, {
    headers: authHeaders(),
  });
  if (!response.ok) return [];
  const data = await response.json();
  return data.archives || [];
}

export async function archiveArbitrageCycle(
  input: ArchiveArbitrageInput
): Promise<{ archived: ArbitrageArchiveEntry; client: any }> {
  const response = await fetch(`${apiBaseUrl}/api/arbitrage-archive`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Échec de l'archivage");
  }
  return response.json();
}
