import { supabase } from '../backend/supabase';
import type { CallToHandle } from '../types/mail';

export const hubCallsService = {
  // ============= CHARGER LES APPELS =============

  /**
   * Charger les appels à traiter
   */
  async getCallsToHandle(status?: 'pending' | 'in_progress' | 'completed', limit = 50, skip = 0) {
    let query = supabase.from('hub_calls').select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    } else {
      // Par défaut, montrer tous sauf les completed
      query = query.in('status', ['pending', 'in_progress']);
    }

    const { data, error, count } = await query
      .order('dueDate', { ascending: true })
      .range(skip, skip + limit - 1);

    if (error) throw new Error(`Erreur chargement appels: ${error.message}`);

    return { calls: data as CallToHandle[], total: count || 0 };
  },

  /**
   * Charger un appel spécifique
   */
  async getCallById(callId: string) {
    const { data, error } = await supabase
      .from('hub_calls')
      .select('*')
      .eq('id', callId)
      .single();

    if (error) throw new Error(`Appel non trouvé: ${error.message}`);
    return data as CallToHandle;
  },

  // ============= CRÉER/METTRE À JOUR LES APPELS =============

  /**
   * Créer un nouvel appel à traiter
   */
  async createCall(call: Omit<CallToHandle, 'id' | 'createdAt'>) {
    const newCall: CallToHandle = {
      ...call,
      id: `call-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const { error } = await supabase.from('hub_calls').insert([newCall]);

    if (error) throw new Error(`Erreur création appel: ${error.message}`);

    return newCall;
  },

  /**
   * Mettre à jour un appel
   */
  async updateCall(callId: string, updates: Partial<CallToHandle>) {
    const { error } = await supabase
      .from('hub_calls')
      .update(updates)
      .eq('id', callId);

    if (error) throw new Error(`Erreur update appel: ${error.message}`);

    return this.getCallById(callId);
  },

  /**
   * Marquer un appel comme complété
   */
  async completeCall(callId: string) {
    return this.updateCall(callId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });
  },

  /**
   * Marquer un appel comme en cours
   */
  async startCall(callId: string) {
    return this.updateCall(callId, {
      status: 'in_progress',
    });
  },

  /**
   * Ajouter des notes à un appel
   */
  async addNoteToCall(callId: string, note: string) {
    const call = await this.getCallById(callId);

    const updatedNotes = call.notes ? `${call.notes}\n\n---\n${note}` : note;

    return this.updateCall(callId, { notes: updatedNotes });
  },

  // ============= RECHERCHE =============

  /**
   * Rechercher les appels
   */
  async searchCalls(query: string, limit = 50) {
    const { data, error } = await supabase
      .from('hub_calls')
      .select('*')
      .or(
        `clientName.ilike.%${query}%,subject.ilike.%${query}%,reason.ilike.%${query}%,clientPhone.ilike.%${query}%`
      )
      .limit(limit)
      .order('dueDate', { ascending: true });

    if (error) throw new Error(`Erreur recherche appels: ${error.message}`);

    return data as CallToHandle[];
  },

  // ============= GROUPER PAR PRIORITÉ =============

  /**
   * Charger les appels groupés par priorité
   */
  async getCallsByPriority() {
    const { calls: allCalls } = await this.getCallsToHandle();

    return {
      urgent: allCalls.filter((c) => c.priority === 'urgent'),
      normal: allCalls.filter((c) => c.priority === 'normal'),
      low: allCalls.filter((c) => c.priority === 'low'),
    };
  },

  // ============= LIÉ À UN MAIL =============

  /**
   * Créer un appel lié à un mail
   */
  async createCallFromMail(
    clientName: string,
    clientEmail: string,
    linkedMailId: string,
    subject: string
  ) {
    return this.createCall({
      clientName,
      clientEmail,
      subject,
      reason: `Suivi mail: ${subject}`,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h from now
      priority: 'normal',
      status: 'pending',
      linkedMailId,
      notes: `Créé automatiquement pour suivi du mail: ${subject}`,
    });
  },

  /**
   * Récupérer les appels liés à un mail
   */
  async getCallsForMail(mailId: string) {
    const { data, error } = await supabase
      .from('hub_calls')
      .select('*')
      .eq('linkedMailId', mailId);

    if (error) throw new Error(`Erreur appels du mail: ${error.message}`);

    return data as CallToHandle[];
  },
};
