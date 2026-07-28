import { supabase } from '../backend/supabase';
import type { HubMail, MailTraitementStatus, MailNote, HubStats, HubTab } from '../types/mail';

export const hubMailService = {
  // ============= CHARGER LES MAILS =============

  /**
   * Charger les mails d'un onglet spécifique
   */
  async getMailsByTab(tab: HubTab, limit = 50, skip = 0) {
    const { data, error, count } = await supabase
      .from('hub_mails')
      .select('*', { count: 'exact' })
      .eq('hubTab', tab)
      .order('sentAt', { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) throw new Error(`Erreur chargement mails: ${error.message}`);

    // Calculer les stats
    const stats = await this.getStats();

    return { mails: data as HubMail[], total: count || 0, stats };
  },

  /**
   * Charger un mail spécifique
   */
  async getMailById(mailId: string) {
    const { data, error } = await supabase
      .from('hub_mails')
      .select('*')
      .eq('id', mailId)
      .single();

    if (error) throw new Error(`Mail non trouvé: ${error.message}`);
    return data as HubMail;
  },

  // ============= METTRE À JOUR LES MAILS =============

  /**
   * Mettre à jour le statut et les notes d'un mail
   */
  async updateMail(
    mailId: string,
    updates: {
      traitementStatus?: MailTraitementStatus;
      processingNotes?: string;
      clientId?: string;
      clientName?: string;
      clientEmail?: string;
    }
  ) {
    const mail = await this.getMailById(mailId);
    let hubTab = mail.hubTab;

    // Re-classifier si le statut change à "terminé"
    if (updates.traitementStatus === 'termine') {
      hubTab = 'archive';
    }
    // Re-classifier si client associé
    else if (updates.clientId && mail.clientId !== updates.clientId) {
      hubTab = 'conversation_client';
    }

    const updateData: any = {
      ...updates,
      hubTab,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('hub_mails')
      .update(updateData)
      .eq('id', mailId);

    if (error) throw new Error(`Erreur update mail: ${error.message}`);

    return this.getMailById(mailId);
  },

  /**
   * Associer un mail à un client
   */
  async associateClient(mailId: string, clientId: string, clientName: string, clientEmail?: string) {
    return this.updateMail(mailId, { clientId, clientName, clientEmail });
  },

  /**
   * Désassocier un mail d'un client
   */
  async disassociateClient(mailId: string) {
    return this.updateMail(mailId, { clientId: undefined, clientName: undefined, clientEmail: undefined });
  },

  /**
   * Changer le statut de traitement
   */
  async updateStatus(mailId: string, status: MailTraitementStatus) {
    return this.updateMail(mailId, { traitementStatus: status });
  },

  // ============= NOTES =============

  /**
   * Ajouter une note à un mail
   */
  async addNote(mailId: string, content: string, createdBy: string, createdByName: string) {
    const mail = await this.getMailById(mailId);

    const newNote: MailNote = {
      id: `note-${Date.now()}`,
      content,
      createdBy,
      createdByName,
      createdAt: new Date().toISOString(),
    };

    const updatedNotes = [...(mail.notes || []), newNote];

    const { error } = await supabase
      .from('hub_mails')
      .update({
        notes: updatedNotes,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', mailId);

    if (error) throw new Error(`Erreur ajout note: ${error.message}`);

    return newNote;
  },

  /**
   * Supprimer une note
   */
  async deleteNote(mailId: string, noteId: string) {
    const mail = await this.getMailById(mailId);

    const updatedNotes = (mail.notes || []).filter((n) => n.id !== noteId);

    const { error } = await supabase
      .from('hub_mails')
      .update({
        notes: updatedNotes,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', mailId);

    if (error) throw new Error(`Erreur suppression note: ${error.message}`);

    return { success: true };
  },

  // ============= RECHERCHE =============

  /**
   * Rechercher des mails
   */
  async searchMails(query: string, tab?: HubTab, limit = 50) {
    let qry = supabase
      .from('hub_mails')
      .select('*')
      .or(`subject.ilike.%${query}%,body.ilike.%${query}%,from.ilike.%${query}%,clientName.ilike.%${query}%`);

    if (tab) {
      qry = qry.eq('hubTab', tab);
    }

    const { data, error } = await qry.limit(limit).order('sentAt', { ascending: false });

    if (error) throw new Error(`Erreur recherche: ${error.message}`);

    return data as HubMail[];
  },

  // ============= STATISTIQUES =============

  /**
   * Récupérer les statistiques
   */
  async getStats(): Promise<HubStats> {
    const { data, error } = await supabase.from('hub_mails').select('hubTab, traitementStatus, read', {
      count: 'exact',
    });

    if (error) throw new Error(`Erreur stats: ${error.message}`);

    const stats: HubStats = {
      conversation_client: 0,
      interne_externe: 0,
      archive: 0,
      appels: 0,
      a_traiter: 0,
      en_cours: 0,
      a_valider_gl: 0,
      valide_gl: 0,
      unread: 0,
    };

    (data || []).forEach((mail: any) => {
      if (mail.hubTab === 'conversation_client') stats.conversation_client++;
      if (mail.hubTab === 'interne_externe') stats.interne_externe++;
      if (mail.hubTab === 'archive') stats.archive++;
      if (mail.hubTab === 'appels') stats.appels++;

      if (mail.traitementStatus === 'a_traiter') stats.a_traiter++;
      if (mail.traitementStatus === 'en_cours') stats.en_cours++;
      if (mail.traitementStatus === 'a_valider_gl') stats.a_valider_gl++;
      if (mail.traitementStatus === 'valide_gl') stats.valide_gl++;

      if (!mail.read) stats.unread++;
    });

    return stats;
  },

  // ============= RÉPONSES =============

  /**
   * Envoyer une réponse (créer un mail de réponse)
   */
  async sendReply(
    originalMailId: string,
    to: string[],
    subject: string,
    body: string,
    cc?: string[]
  ) {
    const originalMail = await this.getMailById(originalMailId);

    const newMail: HubMail = {
      id: `mail-${Date.now()}`,
      from: 'contact@prudentia.fr', // TODO: Get from session
      to,
      cc,
      subject,
      body,
      isHtml: false,
      sentAt: new Date().toISOString(),
      direction: 'sent',
      read: true,
      clientId: originalMail.clientId,
      clientName: originalMail.clientName,
      clientEmail: originalMail.clientEmail,
      hubTab: originalMail.hubTab,
      traitementStatus: originalMail.traitementStatus,
      attachments: [],
      notes: originalMail.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      importedFrom: 'manual',
      replies: originalMail.replies,
    };

    const { error } = await supabase.from('hub_mails').insert([newMail]);

    if (error) throw new Error(`Erreur envoi réponse: ${error.message}`);

    // Mettre à jour le mail original au statut "en_cours"
    await this.updateStatus(originalMailId, 'en_cours');

    return newMail;
  },

  // ============= CLASSIFICATION =============

  /**
   * Classifier/re-classifier un mail
   */
  async classifyMail(mailId: string, clientId?: string) {
    const mail = await this.getMailById(mailId);

    let hubTab: HubTab = 'interne_externe';

    if (mail.traitementStatus === 'termine') {
      hubTab = 'archive';
    } else if (clientId || mail.clientId) {
      hubTab = 'conversation_client';
    }

    const { error } = await supabase
      .from('hub_mails')
      .update({ hubTab, clientId: clientId || mail.clientId })
      .eq('id', mailId);

    if (error) throw new Error(`Erreur classification: ${error.message}`);

    return { hubTab, success: true };
  },
};
