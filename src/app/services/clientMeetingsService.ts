/**
 * CLIENT MEETINGS SERVICE
 *
 * Each client has a single "next appointment" slot (dateNextRdv +
 * nextRdvDetails); this service reads/writes that slot across all
 * clients so the Agenda, Dashboard, and client detail Tasks tab (RDV
 * modal) all stay in sync through the same data. getAllUpcomingMeetings
 * also merges in events synced from Outlook via the bridge (agenda_events
 * collection), which live outside any client's slot.
 */

import { apiBaseUrl } from '../utils/api/info';
import { ClientService } from './ClientService';

export interface ClientMeeting {
  id: string; // same as clientId - one slot per client
  clientId: string;
  clientName: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  location?: string;
  locationType?: 'cabinet' | 'client' | 'visio';
  meetingType?: string;
  completed: boolean;
}

function splitDateTime(dateNextRdv: string): { date: string; time: string } {
  if (dateNextRdv.includes('T')) {
    const [date, timePart] = dateNextRdv.split('T');
    return { date, time: (timePart || '').slice(0, 5) };
  }
  // Outlook-synced events store "yyyy-MM-dd HH:mm:ss" (space-separated).
  if (dateNextRdv.includes(' ')) {
    const [date, timePart] = dateNextRdv.split(' ');
    return { date, time: (timePart || '').slice(0, 5) };
  }
  return { date: dateNextRdv, time: '' };
}

async function getOutlookSyncedMeetings(): Promise<ClientMeeting[]> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/agenda-events`);
    if (!response.ok) return [];
    const { data } = await response.json();
    if (!Array.isArray(data)) return [];

    return data
      .filter((event: any) => event.startDate)
      .map((event: any) => {
        const { date, time } = splitDateTime(event.startDate);
        const attendeeNames = (event.attendees || [])
          .map((a: any) => a.email || a)
          .filter(Boolean)
          .join(', ');

        return {
          id: `outlook_${event.outlookEventId || event.id}`,
          clientId: event.clientId || '',
          clientName: attendeeNames || 'Outlook',
          title: event.title || 'Événement Outlook',
          description: '',
          date,
          time,
          location: '',
          locationType: 'cabinet' as const,
          meetingType: 'autre',
          completed: false,
        };
      });
  } catch {
    // Bridge/backend unreachable - just show client-based meetings.
    return [];
  }
}

export async function getAllUpcomingMeetings(): Promise<ClientMeeting[]> {
  const { clients } = await ClientService.getAllClients();
  const meetings: ClientMeeting[] = [];

  for (const client of clients) {
    if (!client.dateNextRdv) continue;
    const { date, time } = splitDateTime(client.dateNextRdv);
    const details = (client as any).nextRdvDetails || {};
    const clientName = `${client.prenom || ''} ${client.nom || ''}`.trim() || 'Client sans nom';

    meetings.push({
      id: client.id,
      clientId: client.id,
      clientName,
      title: details.title || `RDV avec ${clientName}`,
      description: details.description || '',
      date,
      time,
      location: details.location || '',
      locationType: details.locationType || 'cabinet',
      meetingType: details.meetingType || 'autre',
      completed: false,
    });
  }

  const outlookMeetings = await getOutlookSyncedMeetings();
  return [...meetings, ...outlookMeetings];
}

export async function setClientMeeting(
  clientId: string,
  meeting: {
    startDate: string; // ISO date or date+time (YYYY-MM-DDTHH:mm)
    title: string;
    description?: string;
    location?: string;
    locationType?: string;
    meetingType?: string;
  }
): Promise<boolean> {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${apiBaseUrl}/api/clients/${clientId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      dateNextRdv: meeting.startDate,
      nextRdvDetails: {
        title: meeting.title,
        description: meeting.description || '',
        location: meeting.location || '',
        locationType: meeting.locationType || 'cabinet',
        meetingType: meeting.meetingType || 'autre',
      },
    }),
  });

  if (response.ok) {
    ClientService.clearCache();
    return true;
  }
  return false;
}

/** Marks a meeting done by clearing the client's next-appointment slot. */
export async function clearClientMeeting(clientId: string): Promise<boolean> {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${apiBaseUrl}/api/clients/${clientId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ dateNextRdv: '', nextRdvDetails: {} }),
  });

  if (response.ok) {
    ClientService.clearCache();
    return true;
  }
  return false;
}
