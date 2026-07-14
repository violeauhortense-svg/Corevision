// ============================================
// EMAIL WEBHOOK HANDLER - DEPRECATED
// ============================================
// Note: This handler was used for Brevo email event tracking.
// With native IMAP/SMTP implementation, email tracking will be handled
// directly via the email service provider's native capabilities.
// This webhook is kept for backwards compatibility but is no longer active.

import * as kv from "./kv_store.tsx";

export function setupEmailWebhookRoutes(app: any) {
  // ⚠️ DEPRECATED: Brevo webhook - no longer used
  // Email tracking will be implemented via native email service
  app.post("/make-server-cac859af/webhook/brevo-email", async (c) => {
    console.warn('⚠️ Brevo webhook endpoint called but deprecated. Use email service tracking instead.');
    return c.json({
      success: true,
      message: 'Webhook deprecated - use email service tracking',
      deprecated: true
    });
    try {
      const body = await c.req.json();
      
      const event = body.event; // 'delivered', 'opened', 'click', 'bounce', 'soft_bounce', etc.
      const email = body.email; // Email du destinataire
      const messageId = body['message-id']; // ID du message Brevo
      const timestamp = body.date || new Date().toISOString();
      
      
      // Mapper les événements Brevo vers nos statuts
      const statusMapping: Record<string, 'delivered' | 'opened' | 'clicked' | 'bounced' | 'error'> = {
        'delivered': 'delivered',
        'opened': 'opened',
        'click': 'clicked',
        'unique_opened': 'opened',
        'hard_bounce': 'bounced',
        'soft_bounce': 'bounced',
        'invalid_email': 'bounced',
        'blocked': 'error',
        'error': 'error',
      };
      
      const newStatus = statusMapping[event];
      
      if (!newStatus) {
        return c.json({ success: true, message: 'Event not tracked' });
      }
      
      // ✅ Mettre à jour toutes les tâches qui ont envoyé un email à cette adresse
      
      // Récupérer tous les clients
      const allClients = await kv.getByPrefix('client:');
      let updatedCount = 0;
      
      for (const client of allClients) {
        // Récupérer toutes les tâches de ce client
        const clientTasks = await kv.getByPrefix(`task:${client.conseiller_id}:${client.id}:`);
        
        for (const task of clientTasks) {
          if (!task.emailHistory || !Array.isArray(task.emailHistory)) {
            continue;
          }
          
          // Vérifier si cette tâche a un email envoyé à cette adresse
          let hasUpdates = false;
          const updatedEmailHistory = task.emailHistory.map((emailEntry: any) => {
            if (emailEntry.recipient === email) {
              // Mettre à jour le statut si c'est une progression
              const statusPriority = ['sent', 'delivered', 'opened', 'clicked', 'bounced', 'error'];
              const currentPriority = statusPriority.indexOf(emailEntry.status);
              const newPriority = statusPriority.indexOf(newStatus);
              
              if (newPriority > currentPriority || (newStatus === 'bounced' || newStatus === 'error')) {
                hasUpdates = true;
                return {
                  ...emailEntry,
                  status: newStatus,
                  lastUpdated: timestamp,
                  events: [
                    ...(emailEntry.events || []),
                    {
                      event,
                      timestamp,
                      messageId,
                    }
                  ]
                };
              }
            }
            return emailEntry;
          });
          
          if (hasUpdates) {
            // Sauvegarder la tâche mise à jour
            const updatedTask = {
              ...task,
              emailHistory: updatedEmailHistory,
            };
            
            await kv.set(`task:${client.conseiller_id}:${client.id}:${task.id}`, updatedTask);
            updatedCount++;
          }
        }
      }
      
      
      return c.json({ 
        success: true, 
        message: `Event ${event} processed`,
        updatedTasks: updatedCount 
      });
    } catch (err) {
      console.error('❌ Erreur traitement webhook Brevo:', err);
      return c.json({ error: 'Failed to process webhook: ' + err.message }, 500);
    }
  });
  
  // Endpoint de test pour le webhook (PROTECTED - pour debug)
  app.post("/make-server-cac859af/webhook/brevo-email/test", async (c) => {
    try {
      const body = await c.req.json();
      const { email, event } = body;
      
      if (!email || !event) {
        return c.json({ error: 'Missing email or event' }, 400);
      }
      
      // Simuler un webhook Brevo
      const simulatedWebhook = {
        event,
        email,
        'message-id': 'test-' + Date.now(),
        date: new Date().toISOString(),
      };
      
      // Appeler le handler
      
      
      return c.json({ 
        success: true, 
        message: 'Test webhook sent',
        webhook: simulatedWebhook 
      });
    } catch (err) {
      console.error('❌ Erreur test webhook:', err);
      return c.json({ error: 'Failed to test webhook: ' + err.message }, 500);
    }
  });
}
