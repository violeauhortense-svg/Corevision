// ============================================
// COREVISION ORDERS ROUTES
// ============================================

import * as rapportPatrimonial from './rapport_patrimonial.tsx';

export function setupCoreVisionRoutes(app: any, supabaseAdmin: any, kv: any) {
  // Route pour créer/envoyer une commande CoreVision
  app.post("/make-server-cac859af/corevision/orders", async (c: any) => {
    try {
      const body = await c.req.json();
      const { clientId, clientName, cgpName, cgpEmail, objectifs, validatedAt, bilanData, profilsInvestisseurs } = body;

      if (!clientId || !clientName || !cgpName || !objectifs) {
        return c.json({ error: "Données manquantes" }, 400);
      }

      // Générer un ID unique pour la commande
      const orderId = `order_${clientId}_${Date.now()}`;

      // Sauvegarder la commande dans le KV store
      const orderData = {
        orderId,
        clientId,
        clientName,
        cgpName,
        cgpEmail,
        objectifs,
        validatedAt,
        status: 'pending', // pending, in_progress, completed
        createdAt: new Date().toISOString(),
        bilanData: bilanData || null,
        profilsInvestisseurs: profilsInvestisseurs || null,
        audit: '',
        preconisations: [],
        presentationClient: '',
        validatedByAdmin: false,
      };

      await kv.set(`corevision_order_${orderId}`, orderData);

      console.log(`✅ Commande CoreVision créée: ${orderId} pour client ${clientName} par CGP ${cgpName}`);

      return c.json({ 
        success: true, 
        orderId,
        message: "Commande envoyée avec succès"
      });
    } catch (error: any) {
      console.error("❌ Erreur création commande CoreVision:", error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Route pour récupérer toutes les commandes (ADMIN)
  app.get("/make-server-cac859af/corevision/orders", async (c: any) => {
    try {
      // Récupérer toutes les commandes
      const orders = await kv.getByPrefix('corevision_order_');

      // Trier par date (plus récentes en premier)
      const sortedOrders = orders.sort((a: any, b: any) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      console.log(`📋 ${sortedOrders.length} commande(s) CoreVision récupérée(s)`);

      return c.json({ 
        success: true,
        orders: sortedOrders,
        count: sortedOrders.length
      });
    } catch (error: any) {
      console.error("❌ Erreur récupération commandes:", error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Route pour mettre à jour le statut d'une commande (ADMIN)
  app.put("/make-server-cac859af/corevision/orders/:orderId", async (c: any) => {
    try {
      const orderId = c.req.param('orderId');
      const body = await c.req.json();
      const { status, adminNotes, audit, preconisations, presentationClient, validatedByAdmin, validatedAt } = body;

      if (!orderId) {
        return c.json({ error: "ID de commande manquant" }, 400);
      }

      // Récupérer la commande existante
      const existingOrder = await kv.get(`corevision_order_${orderId}`);
      
      if (!existingOrder) {
        return c.json({ error: "Commande non trouvée" }, 404);
      }

      // Mettre à jour la commande
      const updatedOrder = {
        ...existingOrder,
        status: status !== undefined ? status : existingOrder.status,
        adminNotes: adminNotes !== undefined ? adminNotes : existingOrder.adminNotes,
        audit: audit !== undefined ? audit : existingOrder.audit,
        preconisations: preconisations !== undefined ? preconisations : existingOrder.preconisations,
        presentationClient: presentationClient !== undefined ? presentationClient : existingOrder.presentationClient,
        validatedByAdmin: validatedByAdmin !== undefined ? validatedByAdmin : existingOrder.validatedByAdmin,
        validatedAt: validatedAt || existingOrder.validatedAt,
        updatedAt: new Date().toISOString(),
      };

      await kv.set(`corevision_order_${orderId}`, updatedOrder);

      console.log(`✅ Commande ${orderId} mise à jour`);
      if (audit !== undefined) console.log(`  → Audit: ${audit.substring(0, 50)}...`);
      if (preconisations !== undefined) console.log(`  → Préconisations: ${preconisations.length}`);
      if (presentationClient !== undefined) console.log(`  → Présentation: ${presentationClient.substring(0, 50)}...`);
      if (status !== undefined) console.log(`  → Status: ${status}`);

      return c.json({ 
        success: true,
        order: updatedOrder
      });
    } catch (error: any) {
      console.error("❌ Erreur mise à jour commande:", error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Route pour supprimer une commande (ADMIN)
  app.delete("/make-server-cac859af/corevision/orders/:orderId", async (c: any) => {
    try {
      const orderId = c.req.param('orderId');

      if (!orderId) {
        return c.json({ error: "ID de commande manquant" }, 400);
      }

      await kv.del(`corevision_order_${orderId}`);

      console.log(`✅ Commande ${orderId} supprimée`);

      return c.json({ 
        success: true,
        message: "Commande supprimée"
      });
    } catch (error: any) {
      console.error("❌ Erreur suppression commande:", error);
      return c.json({ error: error.message }, 500);
    }
  });

  // ============================================
  // RAPPORT PATRIMONIAL IA - NOUVELLES ROUTES
  // ============================================

  // Générer un rapport patrimonial complet pour une commande CoreVision
  app.post("/make-server-cac859af/corevision/rapport-patrimonial", async (c: any) => {
    try {
      const body = await c.req.json();
      const { clientId, clientName, profil, orderId } = body;

      if (!clientId || !clientName || !profil) {
        return c.json({ error: "Données manquantes (clientId, clientName, profil requis)" }, 400);
      }

      console.log(`📊 Génération rapport patrimonial pour commande CoreVision: ${clientName}`);

      // Générer le rapport
      const result = await rapportPatrimonial.genererRapportPatrimonial({
        clientId,
        clientName,
        profil,
      });

      if (!result.success) {
        return c.json({ error: result.error }, 500);
      }

      // Sauvegarder le rapport dans le KV store
      const rapportId = result.rapport.rapport_id;
      await kv.set(`rapport_patrimonial_${rapportId}`, result.rapport);

      // Si un orderId est fourni, mettre à jour la commande
      if (orderId) {
        const existingOrder = await kv.get(`corevision_order_${orderId}`);
        if (existingOrder) {
          await kv.set(`corevision_order_${orderId}`, {
            ...existingOrder,
            rapport_patrimonial_id: rapportId,
            rapport_generated_at: new Date().toISOString(),
          });
          console.log(`  → Commande ${orderId} mise à jour avec rapport ${rapportId}`);
        }
      }

      console.log(`✅ Rapport patrimonial généré: ${rapportId}`);

      return c.json({
        success: true,
        rapport_id: rapportId,
        rapport: result.rapport,
      });
    } catch (error: any) {
      console.error("❌ Erreur génération rapport:", error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Récupérer un rapport patrimonial par ID
  app.get("/make-server-cac859af/corevision/rapport-patrimonial/:rapportId", async (c: any) => {
    try {
      const rapportId = c.req.param('rapportId');

      if (!rapportId) {
        return c.json({ error: "ID de rapport manquant" }, 400);
      }

      const rapport = await kv.get(`rapport_patrimonial_${rapportId}`);

      if (!rapport) {
        return c.json({ error: "Rapport non trouvé" }, 404);
      }

      console.log(`📄 Rapport ${rapportId} récupéré`);

      return c.json({
        success: true,
        rapport,
      });
    } catch (error: any) {
      console.error("❌ Erreur récupération rapport:", error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Générer le PDF d'un rapport (format texte)
  app.get("/make-server-cac859af/corevision/rapport-patrimonial/:rapportId/pdf", async (c: any) => {
    try {
      const rapportId = c.req.param('rapportId');

      if (!rapportId) {
        return c.json({ error: "ID de rapport manquant" }, 400);
      }

      const rapport = await kv.get(`rapport_patrimonial_${rapportId}`);

      if (!rapport) {
        return c.json({ error: "Rapport non trouvé" }, 404);
      }

      console.log(`📄 Génération PDF pour rapport ${rapportId}`);

      const pdfContent = rapportPatrimonial.genererRapportPDF(rapport);

      // Retourner en tant que texte brut
      return new Response(pdfContent, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="rapport_${rapport.client_name.replace(/\s+/g, '_')}_${rapportId}.txt"`,
        },
      });
    } catch (error: any) {
      console.error("❌ Erreur génération PDF:", error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Récupérer tous les rapports d'un client
  app.get("/make-server-cac859af/corevision/rapports-client/:clientId", async (c: any) => {
    try {
      const clientId = c.req.param('clientId');

      if (!clientId) {
        return c.json({ error: "ID de client manquant" }, 400);
      }

      const allRapports = await kv.getByPrefix('rapport_patrimonial_');

      const rapportsClient = allRapports
        .filter((r: any) => r.client_id === clientId)
        .sort((a: any, b: any) => {
          return new Date(b.date_generation).getTime() - new Date(a.date_generation).getTime();
        });

      console.log(`📚 ${rapportsClient.length} rapport(s) trouvé(s) pour client ${clientId}`);

      return c.json({
        success: true,
        count: rapportsClient.length,
        rapports: rapportsClient,
      });
    } catch (error: any) {
      console.error("❌ Erreur récupération rapports client:", error);
      return c.json({ error: error.message }, 500);
    }
  });

  console.log("✅ CoreVision routes configurées");
}