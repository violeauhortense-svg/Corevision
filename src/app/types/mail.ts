// ============= TYPES MAILS =============

export interface MailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: MailTemplateCategory;
  variables: string[]; // Variables disponibles comme {{nom_client}}, {{date}}, etc.
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

export type MailTemplateCategory =
  | 'prospection'
  | 'bienvenue'
  | 'audit'
  | 'recommandations'
  | 'suivi'
  | 'relance'
  | 'administratif'
  | 'evenement'
  | 'autre';

export interface MailConversation {
  id: string;
  clientId: string;
  clientName: string;
  subject: string;
  lastMessageDate: string;
  unreadCount: number;
  status: ConversationStatus;
  tags: string[];
  messages: MailMessage[];
}

export type ConversationStatus = 'ouvert' | 'en_attente' | 'resolu' | 'archive';

export interface MailMessage {
  id: string;
  conversationId: string;
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  isHtml: boolean;
  sentAt: string;
  direction: 'sent' | 'received';
  read: boolean;
  attachments?: MailAttachment[];
  linkedClientId?: string;
  linkedTaskId?: string;
  linkedTemplateId?: string;
}

export interface MailAttachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  url: string;
}

export interface InternalMessage {
  id: string;
  from: string;
  fromName: string;
  to: string[];
  toNames: string[];
  subject: string;
  body: string;
  sentAt: string;
  read: boolean;
  priority: MessagePriority;
  linkedClientId?: string;
  linkedClientName?: string;
  replyToId?: string;
}

export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

export interface MailStats {
  totalSent: number;
  totalReceived: number;
  unreadCount: number;
  openRate: number;
  responseRate: number;
  avgResponseTime: number; // en heures
  templatesUsed: number;
}

export interface MailFilters {
  search?: string;
  status?: ConversationStatus[];
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
  unreadOnly?: boolean;
}
