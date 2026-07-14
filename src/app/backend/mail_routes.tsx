import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';

const mailRoutes = new Hono();

// ============= TEMPLATES =============

// GET /mail-templates - Récupérer tous les templates
mailRoutes.get('/mail-templates', async (c) => {
  try {
    const templates = await kv.getByPrefix('mail_template_');
    return c.json(templates);
  } catch (error) {
    console.error('Erreur lors de la récupération des templates:', error);
    return c.json({ error: 'Impossible de récupérer les templates' }, 500);
  }
});

// POST /mail-templates - Créer ou mettre à jour un template
mailRoutes.post('/mail-templates', async (c) => {
  try {
    const template = await c.req.json();
    const key = `mail_template_${template.id}`;
    await kv.set(key, template);
    return c.json({ success: true, template });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du template:', error);
    return c.json({ error: 'Impossible de sauvegarder le template' }, 500);
  }
});

// DELETE /mail-templates/:id - Supprimer un template
mailRoutes.delete('/mail-templates/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const key = `mail_template_${id}`;
    await kv.del(key);
    return c.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression du template:', error);
    return c.json({ error: 'Impossible de supprimer le template' }, 500);
  }
});

// ============= CONVERSATIONS =============

// GET /mail-conversations - Récupérer toutes les conversations
mailRoutes.get('/mail-conversations', async (c) => {
  try {
    const conversations = await kv.getByPrefix('mail_conversation_');
    return c.json(conversations);
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error);
    return c.json({ error: 'Impossible de récupérer les conversations' }, 500);
  }
});

// POST /mail-conversations - Créer une nouvelle conversation
mailRoutes.post('/mail-conversations', async (c) => {
  try {
    const conversation = await c.req.json();
    const key = `mail_conversation_${conversation.id}`;
    await kv.set(key, conversation);
    return c.json({ success: true, conversation });
  } catch (error) {
    console.error('Erreur lors de la création de la conversation:', error);
    return c.json({ error: 'Impossible de créer la conversation' }, 500);
  }
});

// POST /mail-conversations/:id/reply - Envoyer une réponse
mailRoutes.post('/mail-conversations/:id/reply', async (c) => {
  try {
    const conversationId = c.req.param('id');
    const message = await c.req.json();
    
    const key = `mail_conversation_${conversationId}`;
    const conversation = await kv.get(key);
    
    if (!conversation) {
      return c.json({ error: 'Conversation non trouvée' }, 404);
    }
    
    // Ajouter le message à la conversation
    conversation.messages.push(message);
    conversation.lastMessageDate = message.sentAt;
    
    await kv.set(key, conversation);
    return c.json({ success: true, conversation });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la réponse:', error);
    return c.json({ error: 'Impossible d\'envoyer la réponse' }, 500);
  }
});

// PATCH /mail-conversations/:id/status - Mettre à jour le statut
mailRoutes.patch('/mail-conversations/:id/status', async (c) => {
  try {
    const conversationId = c.req.param('id');
    const { status } = await c.req.json();
    
    const key = `mail_conversation_${conversationId}`;
    const conversation = await kv.get(key);
    
    if (!conversation) {
      return c.json({ error: 'Conversation non trouvée' }, 404);
    }
    
    conversation.status = status;
    await kv.set(key, conversation);
    return c.json({ success: true, conversation });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    return c.json({ error: 'Impossible de mettre à jour le statut' }, 500);
  }
});

// ============= INBOX =============

// GET /mail-inbox - Récupérer les emails de la boîte de réception
mailRoutes.get('/mail-inbox', async (c) => {
  try {
    const emails = await kv.getByPrefix('mail_inbox_');
    return c.json(emails);
  } catch (error) {
    console.error('Erreur lors de la récupération des emails:', error);
    return c.json({ error: 'Impossible de récupérer les emails' }, 500);
  }
});

// PATCH /mail-inbox/:id/read - Marquer un email comme lu/non lu
mailRoutes.patch('/mail-inbox/:id/read', async (c) => {
  try {
    const emailId = c.req.param('id');
    const { read } = await c.req.json();
    
    const key = `mail_inbox_${emailId}`;
    const email = await kv.get(key);
    
    if (!email) {
      return c.json({ error: 'Email non trouvé' }, 404);
    }
    
    email.read = read !== undefined ? read : true;
    await kv.set(key, email);
    return c.json({ success: true, email });
  } catch (error) {
    console.error('Erreur lors du marquage de l\'email:', error);
    return c.json({ error: 'Impossible de marquer l\'email' }, 500);
  }
});

// DELETE /mail-inbox/:id - Supprimer un email
mailRoutes.delete('/mail-inbox/:id', async (c) => {
  try {
    const emailId = c.req.param('id');
    const key = `mail_inbox_${emailId}`;
    await kv.del(key);
    return c.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'email:', error);
    return c.json({ error: 'Impossible de supprimer l\'email' }, 500);
  }
});

// ============= INTERNAL MESSAGES =============

// GET /mail-internal - Récupérer les messages internes
mailRoutes.get('/mail-internal', async (c) => {
  try {
    const messages = await kv.getByPrefix('mail_internal_');
    return c.json(messages);
  } catch (error) {
    console.error('Erreur lors de la récupération des messages internes:', error);
    return c.json({ error: 'Impossible de récupérer les messages' }, 500);
  }
});

// POST /mail-internal - Envoyer un message interne
mailRoutes.post('/mail-internal', async (c) => {
  try {
    const message = await c.req.json();
    const key = `mail_internal_${message.id}`;
    await kv.set(key, message);
    return c.json({ success: true, message });
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message interne:', error);
    return c.json({ error: 'Impossible d\'envoyer le message' }, 500);
  }
});

// PATCH /mail-internal/:id/read - Marquer un message comme lu
mailRoutes.patch('/mail-internal/:id/read', async (c) => {
  try {
    const messageId = c.req.param('id');
    const key = `mail_internal_${messageId}`;
    const message = await kv.get(key);
    
    if (!message) {
      return c.json({ error: 'Message non trouvé' }, 404);
    }
    
    message.read = true;
    await kv.set(key, message);
    return c.json({ success: true, message });
  } catch (error) {
    console.error('Erreur lors du marquage du message:', error);
    return c.json({ error: 'Impossible de marquer le message' }, 500);
  }
});

// ============= STATS =============

// GET /mail-stats - Récupérer les statistiques des mails
mailRoutes.get('/mail-stats', async (c) => {
  try {
    // Récupérer toutes les données nécessaires
    const conversations = await kv.getByPrefix('mail_conversation_');
    const inboxEmails = await kv.getByPrefix('mail_inbox_');
    const internalMessages = await kv.getByPrefix('mail_internal_');
    const templates = await kv.getByPrefix('mail_template_');
    
    // Calculer les statistiques
    const totalSent = conversations.reduce((acc, conv) => {
      return acc + conv.messages.filter((m: any) => m.direction === 'sent').length;
    }, 0) + internalMessages.filter((m: any) => m.from === 'conseiller@corevision.fr').length;
    
    const totalReceived = conversations.reduce((acc, conv) => {
      return acc + conv.messages.filter((m: any) => m.direction === 'received').length;
    }, 0) + inboxEmails.length;
    
    const unreadCount = inboxEmails.filter((e: any) => !e.read).length +
      internalMessages.filter((m: any) => !m.read && m.to.includes('conseiller@corevision.fr')).length;
    
    const templatesUsed = templates.reduce((acc: number, t: any) => acc + (t.usageCount || 0), 0);
    
    // Stats fictives pour l'ouverture et la réponse (à implémenter avec un vrai système de tracking)
    const stats = {
      totalSent,
      totalReceived,
      unreadCount,
      openRate: 68.5, // Taux fictif
      responseRate: 45.2, // Taux fictif
      avgResponseTime: 4.3, // Temps fictif en heures
      templatesUsed,
    };
    
    return c.json(stats);
  } catch (error) {
    console.error('Erreur lors du calcul des statistiques:', error);
    return c.json({ error: 'Impossible de calculer les statistiques' }, 500);
  }
});

export { mailRoutes };
