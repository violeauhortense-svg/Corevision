/**
 * CLIENT MEETINGS SERVICE
 *
 * The app has no separate "agenda events" collection - each client has a
 * single "next appointment" slot (dateNextRdv + nextRdvDetails). This
 * service reads/writes that slot across all clients so the Agenda,
 * Dashboard, and client detail Tasks tab (RDV modal) all stay in sync
 * through the same data instead of a parallel, disconnected calendar.
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
  return { date: dateNextRdv, time: '' };
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

  return meetings;
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
