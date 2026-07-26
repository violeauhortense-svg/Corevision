import * as moteurPatrimonialIA from './moteur_patrimonial_ia.tsx';
import * as simulateurPatrimonial from './simulateur_patrimonial.tsx';

/**
 * Générer un rapport patrimonial complet pour un client
 */
export async function genererRapportPatrimonial(
  clientData: {
    clientId: string;
    clientName: string;
    profil: any; // ProfilClient du moteur IA
    montagesASimuler?: string[]; // Liste des montages à simuler
  }
): Promise<{
  success: boolean;
  rapport?: any;
  error?: string;
}> {
  console.log(`📊 Génération du rapport patrimonial pour ${clientData.clientName}...`);

  try {
    const startTime = Date.now();

    // 1. ANALYSE IA DU PROFIL
    console.log('   🤖 Étape 1/3 : Analyse IA du profil...');
    const analyse = await moteurPatrimonialIA.analyserProfilClient(clientData.profil);

    // 2. SIMULATIONS DES TOP MONTAGES RECOMMANDÉS
    console.log('   📊 Étape 2/3 : Simulations des montages recommandés...');
    const simulations: any[] = [];
    
    // Prendre les 5 meilleurs montages recommandés
    const montagesASimuler = analyse.montages_recommandes
      .slice(0, 5)
      .filter(r => r.conditions_respectees); // Seulement les montages dont les conditions sont respectées

    for (const recommandation of montagesASimuler) {
      try {
        // Générer les paramètres par défaut
        const parametres = simulateurPatrimonial.genererParametresDefaut(
          recommandation.montage,
          clientData.profil.patrimoine_financier || 100000,
          15, // 15 ans par défaut
          clientData.profil.tranche_marginale_ir || 30
        );

        // Enrichir avec les données du profil
        parametres.nombre_enfants = clientData.profil.nombre_enfants;
        parametres.age_client = clientData.profil.age_client;

        // Simuler
        const simulation = await simulateurPatrimonial.simulerMontage(parametres);
        simulations.push(simulation);
      } catch (error) {
        console.warn(`   ⚠️ Erreur simulation ${recommandation.montage.nom_montage}:`, error);
      }
    }

    console.log(`   ✅ ${simulations.length} simulation(s) réalisée(s)`);

    // 3. GÉNÉRATION DE LA SYNTHÈSE EXÉCUTIVE VIA IA
    console.log('   📝 Étape 3/3 : Génération de la synthèse exécutive...');
    const syntheseExecutive = await genererSyntheseExecutive(
      clientData,
      analyse,
      simulations
    );

    // 4. CONSTRUIRE LE RAPPORT FINAL
    const rapport = {
      // Métadonnées
      rapport_id: `rapport_${clientData.clientId}_${Date.now()}`,
      client_id: clientData.clientId,
      client_name: clientData.clientName,
      date_generation: new Date().toISOString(),
      duree_generation_ms: Date.now() - startTime,

      // Section 1: Profil client
      profil_client: {
        resume: analyse.profil_resume,
        situation_fiscale: analyse.situation_fiscale_actuelle,
        revenus_totaux: analyse.revenus_totaux,
        tranche_marginale: analyse.tranche_marginale_ir,
        objectifs: clientData.profil.objectifs || [],
      },

      // Section 2: Analyse et recommandations IA
      analyse_ia: {
        synthese_generale: analyse.synthese_generale,
        nombre_recommandations: analyse.montages_recommandes.length,
        montages_recommandes: analyse.montages_recommandes.map(r => ({
          nom: r.montage.nom_montage,
          score: r.score_pertinence,
          explication: r.explication,
          fiscalite: r.fiscalite_estimee,
          risques: r.risques_identifies,
          conditions_ok: r.conditions_respectees,
          actions: r.actions_requises,
          economies_estimees: r.economies_fiscales_estimees,
        })),
        regles_fiscales: analyse.regles_fiscales_applicables.slice(0, 10), // Top 10
      },

      // Section 3: Simulations détaillées
      simulations: simulations.map(sim => ({
        montage: sim.montage.nom_montage,
        capital_final: sim.capital_final,
        plus_value: sim.plus_value,
        rendement_annuel_moyen: sim.taux_rendement_annuel_moyen,
        total_fiscalite: sim.total_fiscalite,
        economie_fiscale_vs_bareme: sim.economie_fiscale_vs_bareme,
        horizon_optimal: sim.horizon_optimal,
        seuil_rentabilite: sim.seuil_rentabilite,
        // Données pour graphiques
        flux_annuels_resume: sim.flux_annuels.map((f: any) => ({
          annee: f.annee,
          capital: f.capital_fin,
          fiscalite: f.fiscalite,
          rendement_net: f.rendement_net_final,
        })),
      })),

      // Section 4: Synthèse exécutive
      synthese_executive: syntheseExecutive,

      // Section 5: Plan d'action
      plan_action: genererPlanAction(analyse, simulations),

      // Section 6: Graphiques et tableaux (données formatées)
      graphiques: {
        evolution_capitale: simulations.map(sim => ({
          montage: sim.montage.nom_montage,
          donnees: sim.flux_annuels.map((f: any) => ({
            annee: f.annee,
            capital: f.capital_fin,
          })),
        })),
        comparaison_montages: simulations.map(sim => ({
          montage: sim.montage.nom_montage,
          capital_final: sim.capital_final,
          plus_value: sim.plus_value,
          fiscalite: sim.total_fiscalite,
        })),
      },
    };

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Rapport généré en ${duration}s`);

    return {
      success: true,
      rapport,
    };
  } catch (error) {
    console.error('❌ Erreur génération rapport:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Générer une synthèse exécutive via GPT-4
 */
async function genererSyntheseExecutive(
  clientData: any,
  analyse: any,
  simulations: any[]
): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');

  if (!apiKey) {
    return `Synthèse pour ${clientData.clientName}: ${analyse.montages_recommandes.length} montages identifiés avec un potentiel de ${simulations.length} simulations réalisées.`;
  }

  try {
    // Préparer le contexte
    const topMontages = analyse.montages_recommandes.slice(0, 3);
    const topSimulations = simulations.slice(0, 3);

    const prompt = `Tu es un Conseiller en Gestion de Patrimoine expert rédigeant une synthèse exécutive.

CLIENT: ${clientData.clientName}
${analyse.profil_resume}

TOP 3 RECOMMANDATIONS IA:
${topMontages
  .map(
    (r: any, i: number) =>
      `${i + 1}. ${r.montage.nom_montage} (score: ${r.score_pertinence}/100)
   Explication: ${r.explication}
   Économies estimées: ${r.economies_fiscales_estimees ? r.economies_fiscales_estimees.toLocaleString('fr-FR') + '€' : 'N/A'}`
  )
  .join('\n\n')}

SIMULATIONS RÉALISÉES:
${topSimulations
  .map(
    (s: any, i: number) =>
      `${i + 1}. ${s.montage.nom_montage}
   Capital final: ${s.capital_final.toLocaleString('fr-FR')}€
   Rendement annuel moyen: ${s.taux_rendement_annuel_moyen.toFixed(2)}%
   Économie fiscale: ${s.economie_fiscale_vs_bareme ? s.economie_fiscale_vs_bareme.toLocaleString('fr-FR') + '€' : 'N/A'}`
  )
  .join('\n\n')}

CONSIGNE:
Rédige une synthèse exécutive professionnelle en 4-5 paragraphes maximum (format rapport CGP):
1. Contexte et situation actuelle du client
2. Enjeux et opportunités identifiés
3. Stratégie patrimoniale recommandée (les 3 axes principaux)
4. Bénéfices chiffrés attendus
5. Prochaines étapes

Ton de voix: Professionnel, rassurant, concret et chiffré.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Tu es un Conseiller en Gestion de Patrimoine expert qui rédige des synthèses exécutives de haute qualité.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('❌ Erreur génération synthèse:', error);
    return `Synthèse automatique: ${analyse.synthese_generale}`;
  }
}

/**
 * Générer un plan d'action structuré
 */
function genererPlanAction(analyse: any, simulations: any[]): any[] {
  const actions = [];

  // Actions à partir des montages recommandés
  const top3Montages = analyse.montages_recommandes.slice(0, 3);

  for (let i = 0; i < top3Montages.length; i++) {
    const montage = top3Montages[i];

    actions.push({
      priorite: i + 1,
      titre: `Mise en place: ${montage.montage.nom_montage}`,
      description: montage.explication,
      etapes: montage.actions_requises,
      delai: montage.montage.complexite === 'simple' ? '1-2 mois' : '3-6 mois',
      conditions_prealables: montage.conditions_respectees
        ? '✅ Toutes les conditions sont remplies'
        : '⚠️ Vérifier les conditions',
      gain_estime:
        montage.economies_fiscales_estimees !== undefined
          ? `${montage.economies_fiscales_estimees.toLocaleString('fr-FR')}€/an`
          : 'À chiffrer',
    });
  }

  // Action de suivi
  actions.push({
    priorite: actions.length + 1,
    titre: 'Rendez-vous de suivi',
    description: 'Point d\'étape sur la mise en œuvre des recommandations',
    etapes: [
      'Faire le bilan des actions entreprises',
      'Ajuster la stratégie si nécessaire',
      'Valider les prochaines priorités',
    ],
    delai: '6 mois',
    conditions_prealables: '✅ Après mise en place des premiers montages',
    gain_estime: 'Suivi de la performance',
  });

  return actions;
}

/**
 * Générer un rapport PDF (format texte structuré pour l'instant)
 */
export function genererRapportPDF(rapport: any): string {
  const sections: string[] = [];

  // En-tête
  sections.push('═══════════════════════════════════════════════════════════');
  sections.push('         RAPPORT PATRIMONIAL - ANALYSE & RECOMMANDATIONS');
  sections.push('═══════════════════════════════════════════════════════════');
  sections.push('');
  sections.push(`Client: ${rapport.client_name}`);
  sections.push(`Date: ${new Date(rapport.date_generation).toLocaleDateString('fr-FR')}`);
  sections.push(`Référence: ${rapport.rapport_id}`);
  sections.push('');
  sections.push('───────────────────────────────────────────────────────────');
  sections.push('');

  // Section 1: Profil client
  sections.push('📋 SECTION 1 - PROFIL CLIENT');
  sections.push('───────────────────────────────────────────────────────────');
  sections.push('');
  sections.push(rapport.profil_client.resume);
  sections.push('');
  sections.push(`Situation fiscale: ${rapport.profil_client.situation_fiscale}`);
  sections.push(`Objectifs: ${rapport.profil_client.objectifs.join(', ')}`);
  sections.push('');
  sections.push('───────────────────────────────────────────────────────────');
  sections.push('');

  // Section 2: Synthèse exécutive
  sections.push('📝 SECTION 2 - SYNTHÈSE EXÉCUTIVE');
  sections.push('───────────────────────────────────────────────────────────');
  sections.push('');
  sections.push(rapport.synthese_executive);
  sections.push('');
  sections.push('───────────────────────────────────────────────────────────');
  sections.push('');

  // Section 3: Recommandations
  sections.push('🎯 SECTION 3 - RECOMMANDATIONS PATRIMONIALES');
  sections.push('───────────────────────────────────────────────────────────');
  sections.push('');

  rapport.analyse_ia.montages_recommandes.slice(0, 5).forEach((m: any, i: number) => {
    sections.push(`${i + 1}. ${m.nom.toUpperCase()} - Score: ${m.score}/100`);
    sections.push('');
    sections.push(`   ${m.explication}`);
    sections.push('');
    sections.push(`   Fiscalité: ${m.fiscalite}`);
    sections.push('');
    sections.push('   Risques identifiés:');
    m.risques.forEach((r: string) => {
      sections.push(`   • ${r}`);
    });
    sections.push('');
    sections.push('   Actions requises:');
    m.actions.forEach((a: string) => {
      sections.push(`   → ${a}`);
    });
    sections.push('');
    if (m.economies_estimees) {
      sections.push(
        `   💰 Économies fiscales estimées: ${m.economies_estimees.toLocaleString('fr-FR')}€`
      );
      sections.push('');
    }
    sections.push('   ─────────────────────────────────────────────────────');
    sections.push('');
  });

  // Section 4: Simulations
  sections.push('📊 SECTION 4 - SIMULATIONS FINANCIÈRES');
  sections.push('───────────────────────────────────────────────────────────');
  sections.push('');

  rapport.simulations.forEach((sim: any, i: number) => {
    sections.push(`${i + 1}. ${sim.montage.toUpperCase()}`);
    sections.push('');
    sections.push(
      `   Capital final (15 ans):         ${sim.capital_final.toLocaleString('fr-FR')}€`
    );
    sections.push(
      `   Plus-value générée:             ${sim.plus_value.toLocaleString('fr-FR')}€`
    );
    sections.push(`   Rendement annuel moyen:         ${sim.rendement_annuel_moyen.toFixed(2)}%`);
    sections.push(
      `   Fiscalité totale:               ${sim.total_fiscalite.toLocaleString('fr-FR')}€`
    );
    if (sim.economie_fiscale_vs_bareme) {
      sections.push(
        `   Économie vs barème progressif:  ${sim.economie_fiscale_vs_bareme.toLocaleString('fr-FR')}€`
      );
    }
    sections.push(`   Horizon optimal:                ${sim.horizon_optimal} ans`);
    sections.push('');
    sections.push('   ─────────────────────────────────────────────────────');
    sections.push('');
  });

  // Section 5: Plan d'action
  sections.push('🚀 SECTION 5 - PLAN D\'ACTION');
  sections.push('───────────────────────────────────────────────────────────');
  sections.push('');

  rapport.plan_action.forEach((action: any) => {
    sections.push(`${action.priorite}. ${action.titre.toUpperCase()}`);
    sections.push('');
    sections.push(`   ${action.description}`);
    sections.push('');
    sections.push(`   Délai estimé: ${action.delai}`);
    sections.push(`   ${action.conditions_prealables}`);
    sections.push(`   Gain estimé: ${action.gain_estime}`);
    sections.push('');
    sections.push('   Étapes:');
    action.etapes.forEach((etape: string) => {
      sections.push(`   • ${etape}`);
    });
    sections.push('');
    sections.push('   ─────────────────────────────────────────────────────');
    sections.push('');
  });

  // Footer
  sections.push('');
  sections.push('═══════════════════════════════════════════════════════════');
  sections.push('    Rapport généré automatiquement par le système IA CGP');
  sections.push(`           Date: ${new Date(rapport.date_generation).toLocaleString('fr-FR')}`);
  sections.push('═══════════════════════════════════════════════════════════');

  return sections.join('\n');
}
