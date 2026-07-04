export type MeetingType = 'R1' | 'R2' | 'suivi' | 'autre';

export interface AgendaEvent {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  title: string;
  date: string; // Date complète au format ISO (ex: "2024-03-15T14:00:00")
  time: string; // Heure au format HH:mm (ex: "14:00")
  location: string;
  locationType: 'cabinet' | 'client' | 'visio';
  meetingType: MeetingType;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  completed?: boolean;
  notes?: string;
}

export interface AgendaDay {
  date: string; // Format YYYY-MM-DD
  events: AgendaEvent[];
}
