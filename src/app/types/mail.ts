// ============= HUB COMMUNICATION TYPES =============

// === TYPES FONDAMENTAUX ===

export type HubTab = 'conversation_client' | 'interne_externe' | 'archive' | 'appels';

export type MailTraitementStatus =
  | 'a_traiter'        // 📥 Mail juste arrivé
  | 'en_cours'         // 🔵 En traitement
  | 'a_valider_gl'     // 🟡 En attente validation GL
  | 'valide_gl'        // 🟢 Validé par GL
  | 'termine';         // ✅ Complété, archivé

export type MailDirection = 'received' | 'sent';

// === PIÈCES JOINTES ===

export interface MailAttachment {
  id: string;
  name: string;
  size: number;                    // en bytes
  mimeType: string;
  data?: string;                   // Base64 pour stockage
  url?: string;                    // URL de téléchargement
  downloadedAt?: string;
}

// === NOTES (Système complet) ===

export interface MailNote {
  id: string;
  content: string;
  createdBy: string;               // Email de l'auteur
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
  attachments?: MailAttachment[];
}

// === EMAIL/MAIL PRINCIPAL ===

export interface HubMail {
  id: string;

  // Identifiants
  messageId?: string;              // ID unique Outlook
  threadId?: string;               // Thread subject grouping

  // Expéditeur/Destinataire
  from: string;                    // Email de l'expéditeur
  fromName?: string;
  to: string[];                    // Emails destinataires
  toNames?: string[];
  cc?: string[];
  bcc?: string[];

  // Contenu
  subject: string;
  body: string;                    // Contenu complet du mail
  isHtml: boolean;
  bodyPreview?: string;            // Aperçu (premiers 100 chars)

  // Métadonnées
  sentAt: string;                  // ISO date
  receivedAt?: string;
  direction: MailDirection;        // 'received' ou 'sent'
  read: boolean;

  // Classification (Critique pour Hub Communication)
  clientId?: string;               // Lié à quel client (optionnel)
  clientName?: string;             // Nom du client associé
  clientEmail?: string;            // Email du client (pour auto-detect)

  // Onglet de classification automatique
  hubTab?: HubTab;                 // Calculé basé sur clientId + direction

  // Traitement/Suivi
  traitementStatus: MailTraitementStatus;  // État du traitement
  traitementAssignedTo?: string;   // Email de la personne
  traitementAssignedToName?: string;

  // Notes (Système complet avec historique)
  notes: MailNote[];

  // Pièces jointes
  attachments: MailAttachment[];

  // Métadonnées système
  importedFrom?: 'outlook' | 'manual';
  sourceId?: string;               // ID du message dans Outlook
  bridge_device_id?: string;       // Device qui a fait l'import
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;             // Si "Terminé"

  // Réponses (Optionnel: historique de réponses)
  replies?: HubMail[];
}

// === APPELS À TRAITER ===

export interface CallToHandle {
  id: string;
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  subject: string;
  reason: string;
  dueDate: string;
  priority: 'urgent' | 'normal' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  notes?: string;
  linkedMailId?: string;           // Lié à un mail si applicable
  createdAt: string;
  completedAt?: string;
}

// === STATISTIQUES ===

export interface HubStats {
  conversation_client: number;     // Nb mails avec clientId
  interne_externe: number;         // Nb mails sans clientId
  archive: number;                 // Nb mails "Terminé"
  appels: number;                  // Nb appels à traiter

  // Sous-stats
  a_traiter: number;
  en_cours: number;
  a_valider_gl: number;
  valide_gl: number;
  unread: number;
}

// === FILTRES ===

export interface HubMailFilters {
  tab?: HubTab;
  search?: string;                 // Cherche dans subject + body
  from?: string;                   // Expéditeur
  clientId?: string;               // Client spécifique
  traitementStatus?: MailTraitementStatus;
  dateFrom?: string;
  dateTo?: string;
  unreadOnly?: boolean;
  assignedToMe?: boolean;
}

// === ANCIENS TYPES (Rétro-compatibilité) ===

export interface MailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: MailTemplateCategory;
  variables: string[];
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
  avgResponseTime: number;
  templatesUsed: number;
}
