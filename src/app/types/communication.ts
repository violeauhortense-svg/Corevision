// ============= TYPES COMMUNICATIONS (HUB) =============

export type CommunicationCategory = 'conversation_client' | 'interne' | 'archive' | 'en_attente';
export type CommunicationStatus = 'à_traiter' | 'traité' | 'terminé';
export type CommunicationSource = 'outlook' | 'manual' | 'webhook';

export interface Communication {
  id: string;
  source: CommunicationSource;
  category: CommunicationCategory;
  status: CommunicationStatus;

  // Identité
  clientId?: string;
  clientName?: string;

  // Contenu du mail
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  bodyHtml?: string;

  // Métadonnées
  receivedAt: string;
  updatedAt: string;
  completedAt?: string;

  // Attachments
  attachments?: CommunicationAttachment[];

  // Tagging
  tags?: string[];

  // Archivage
  archivedAt?: string;
  archivedInClientHistoryAt?: string;
}

export interface CommunicationAttachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  url: string;
}

export interface CommunicationHub {
  conversationClient: Communication[];
  interne: Communication[];
  archive: Communication[];
  enAttente: Communication[];
}

export interface CommunicationStats {
  totalReceived: number;
  unread: number;
  toProcess: number;
  processed: number;
  archived: number;
}

// ============= TYPES AGENDA =============

export type MeetingStatus = 'scheduled' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';
export type MeetingType = 'R1' | 'R2' | 'suivi' | 'action' | 'autre';
export type EventSource = 'outlook' | 'tache' | 'manual';

export interface AgendaEvent {
  id: string;
  source: EventSource;

  // Pour les RDVs clients
  clientId?: string;
  clientName?: string;

  // Pour les tâches
  taskId?: string;

  // Contenu
  title: string;
  description?: string;

  // Timing
  startDate: string; // ISO format
  endDate?: string;  // ISO format

  // Localisation
  location?: string;
  locationType?: 'cabinet' | 'client' | 'visio' | 'telephone';

  // Type de meeting
  meetingType?: MeetingType;

  // Status
  status: MeetingStatus;

  // Outlook sync
  outlookEventId?: string;
  outlookSyncedAt?: string;

  // Notes et attendees
  notes?: string;
  attendees?: AgendaAttendee[];

  // Métadonnées
  createdAt: string;
  updatedAt: string;
}

export interface AgendaAttendee {
  email: string;
  name?: string;
  status: 'accepted' | 'declined' | 'tentative' | 'needs_action';
}

export interface AgendaMonth {
  year: number;
  month: number;
  events: AgendaEvent[];
  statistics?: {
    totalEvents: number;
    rdvCount: number;
    taskCount: number;
    actionCount: number;
  };
}
