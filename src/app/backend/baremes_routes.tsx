import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

/**
 * 🧮 ROUTES DE GESTION DES BARÈMES FISCAUX
 * 
 * Permet de gérer dynamiquement les barèmes :
 * - Impôt sur le revenu (IR)
 * - Impôt sur la Fortune Immobilière (IFI)
 * - Prélèvements sociaux
 * - Abattements et plafonds
 */

export function setupBaremesRoutes(app: Hono) {
  
  // ============================================
  // GET : Récupérer les barèmes d'une année
  // ============================================
  
  app.get("/make-server-cac859af/baremes/:annee", async (c) => {
    try {
      const annee = c.req.param("annee");
      
      // Récupérer tous les barèmes de l'année
      const [baremeIR, baremeIFI, prelevementsSociaux, abattements] = await Promise.all([
        kv.get(`bareme_ir_${annee}`),
        kv.get(`bareme_ifi_${annee}`),
        kv.get(`prelevements_sociaux_${annee}`),
        kv.get(`abattements_${annee}`),
      ]);
      
      // Si aucun barème n'existe, initialiser avec les valeurs par défaut
      if (!baremeIR) {
        await initBaremes2026();
        
        // Récupérer à nouveau après initialisation
        const [baremeIRInit, baremeIFIInit, prelevementsSociauxInit, abattementsInit] = await Promise.all([
          kv.get(`bareme_ir_${annee}`),
          kv.get(`bareme_ifi_${annee}`),
          kv.get(`prelevements_sociaux_${annee}`),
          kv.get(`abattements_${annee}`),
        ]);
        
        return c.json({
          annee,
          baremeIR: baremeIRInit,
          baremeIFI: baremeIFIInit,
          prelevementsSociaux: prelevementsSociauxInit,
          abattements: abattementsInit,
          initialise: true,
        });
      }
      
      return c.json({
        annee,
        baremeIR,
        baremeIFI,
        prelevementsSociaux,
        abattements,
        initialise: false,
      });
      
    } catch (error) {
      console.error("❌ Erreur récupération barèmes:", error);
      return c.json({ error: String(error) }, 500);
    }
  });
  
  // ============================================
  // PUT : Mettre à jour les barèmes
  // ============================================
  
  app.put("/make-server-cac859af/baremes/:annee", async (c) => {
    try {
      const annee = c.req.param("annee");
      const body = await c.req.json();
      
      
      const { baremeIR, baremeIFI, prelevementsSociaux, abattements } = body;
      
      // Sauvegarder tous les barèmes
      await Promise.all([
        baremeIR && kv.set(`bareme_ir_${annee}`, baremeIR),
        baremeIFI && kv.set(`bareme_ifi_${annee}`, baremeIFI),
        prelevementsSociaux && kv.set(`prelevements_sociaux_${annee}`, prelevementsSociaux),
        abattements && kv.set(`abattements_${annee}`, abattements),
      ].filter(Boolean));
      
      // Sauvegarder la date de dernière modification
      await kv.set(`bareme_${annee}_updated`, new Date().toISOString());
      
      
      return c.json({
        success: true,
        annee,
        updated: new Date().toISOString(),
      });
      
    } catch (error) {
      console.error("❌ Erreur mise à jour barèmes:", error);
      return c.json({ error: String(error) }, 500);
    }
  });
  
  // ============================================
  // GET : Liste des années disponibles
  // ============================================
  
  app.get("/make-server-cac859af/baremes", async (c) => {
    try {
      
      // Récupérer tous les barèmes IR (pour identifier les années)
      const allBaremes = await kv.getByPrefix("bareme_ir_");
      
      const annees = allBaremes
        .map((item: any) => {
          const match = item.key.match(/bareme_ir_(\d{4})/);
          return match ? match[1] : null;
        })
        .filter(Boolean)
        .sort()
        .reverse();
      
      return c.json({
        annees,
        count: annees.length,
      });
      
    } catch (error) {
      console.error("❌ Erreur liste barèmes:", error);
      return c.json({ error: String(error) }, 500);
    }
  });
}

// ============================================
// INITIALISATION DES BARÈMES 2026
// ============================================

async function initBaremes2026() {
  
  // ⚠️ BARÈME IR 2025 OFFICIEL (source : service-public.fr)
  // https://www.service-public.fr/particuliers/vosdroits/F1419
  // Les barèmes 2026 seront publiés dans la Loi de Finances 2026
  // En attendant, on utilise les barèmes 2025 vérifiés
  const baremeIR2026 = [
    { min: 0, max: 11600, taux: 0, label: "Tranche 1 : 0%" },
    { min: 11600, max: 29579, taux: 0.11, label: "Tranche 2 : 11%" },
    { min: 29579, max: 84577, taux: 0.30, label: "Tranche 3 : 30%" },
    { min: 84577, max: 181917, taux: 0.41, label: "Tranche 4 : 41%" },
    { min: 181917, max: null, taux: 0.45, label: "Tranche 5 : 45%" },
  ];
  
  // Barème IFI 2026 (stable depuis plusieurs années)
  const baremeIFI2026 = [
    { min: 0, max: 800000, taux: 0, label: "Exonération" },
    { min: 800000, max: 1300000, taux: 0.005, label: "0,5%" },
    { min: 1300000, max: 2570000, taux: 0.007, label: "0,7%" },
    { min: 2570000, max: 5000000, taux: 0.01, label: "1%" },
    { min: 5000000, max: 10000000, taux: 0.0125, label: "1,25%" },
    { min: 10000000, max: null, taux: 0.015, label: "1,5%" },
  ];
  
  // Prélèvements sociaux 2026 (stable depuis 2018)
  const prelevementsSociaux2026 = {
    CSG: 0.092, // 9,2%
    CRDS: 0.005, // 0,5%
    PRELEVEMENT_SOLIDARITE: 0.075, // 7,5%
    TOTAL: 0.172, // 17,2%
  };
  
  // Abattements et plafonds 2026
  const abattements2026 = {
    abattement10PourcentPlafond: 13522, // Plafond abattement 10%
    abattement10PourcentPlancher: 472, // Plancher abattement 10%
    decoteCelibatairePlafond: 1929, // Plafond décote célibataire
    decoteCouplePlafond: 3191, // Plafond décote couple
    decoteCelibataireMax: 873, // Décote max célibataire
    decoteCoupleMax: 1444, // Décote max couple
    microFoncierPlafond: 15000, // Plafond micro-foncier
    microFoncierAbattement: 0.30, // Abattement micro-foncier 30%
  };
  
  await Promise.all([
    kv.set("bareme_ir_2026", baremeIR2026),
    kv.set("bareme_ifi_2026", baremeIFI2026),
    kv.set("prelevements_sociaux_2026", prelevementsSociaux2026),
    kv.set("abattements_2026", abattements2026),
    kv.set("bareme_2026_created", new Date().toISOString()),
  ]);
  
}
