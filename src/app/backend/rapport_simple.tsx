/**
 * ============================================
 * GÉNÉRATEUR DE RAPPORT SIMPLIFIÉ  
 * ============================================
 * 
 * Version simplifiée sans dépendances complexes
 * pour debugging et fallback
 */

export async function genererRapportSimple(clientId: string, clientData: any): Promise<any> {
  
  try {
    // Extraire les données de base
    const nom = clientData.nom || clientData.lastName || 'Client';
    const prenom = clientData.prenom || clientData.firstName || '';
    const fullName = `${prenom} ${nom}`.trim();
    
    // Patrimoine simplifié
    const patrimoineData = clientData.patrimoineData || {};
    const actifsFinanciers = patrimoineData.actifsFinanciers || [];
    const immobilier = patrimoineData.immobilier || [];
    const passifs = patrimoineData.passifs || [];
    
    const totalActifsFinanciers = actifsFinanciers.reduce((sum: number, a: any) => sum + (a.value || 0), 0);
    const totalImmobilier = immobilier.reduce((sum: number, i: any) => sum + (i.value || 0), 0);
    const totalPassifs = passifs.reduce((sum: number, p: any) => sum + (p.value || 0), 0);
    const patrimoineNet = totalActifsFinanciers + totalImmobilier - totalPassifs;
    
    // Revenus simplifiés
    const revenus = clientData.revenus || [];
    const totalRevenus = revenus.reduce((sum: number, r: any) => sum + (r.montantAnnuel || 0), 0);
    
    // TMI
    const tmi = parseInt(clientData.imposition?.trancheMarginaleTMI || clientData.imposition?.tmi || '30');
    
    // Famille
    const familyInfo = clientData.familyInfo || {};
    const nbEnfants = (familyInfo.children || []).length;
    const regimeMatrimonial = familyInfo.regimeMatrimonial || 'Communauté réduite aux acquêts';
    
    // Construire le rapport simplifié
    const rapport = {
      success: true,
      client_id: clientId,
      client_name: fullName,
      date_generation: new Date().toISOString(),
      
      situation_actuelle: {
        synthese: `Vous disposez d'un patrimoine net de ${patrimoineNet.toLocaleString('fr-FR')} € et percevez ${totalRevenus.toLocaleString('fr-FR')} € de revenus annuels. Vous êtes ${familyInfo.maritalStatus || 'marié(e)'} sous le régime ${regimeMatrimonial} avec ${nbEnfants} enfant${nbEnfants > 1 ? 's' : ''}. Votre TMI est de ${tmi}%.`,
        donnees_cles: [
          { label: 'Patrimoine net', valeur: `${patrimoineNet.toLocaleString('fr-FR')} €`, icon: 'TrendingUp' },
          { label: 'Revenus annuels', valeur: `${totalRevenus.toLocaleString('fr-FR')} €`, icon: 'Euro' },
          { label: 'TMI', valeur: `${tmi}%`, icon: 'PieChart' },
          { label: 'Enfants', valeur: `${nbEnfants}`, icon: 'Users' },
          { label: 'Régime matrimonial', valeur: regimeMatrimonial, icon: 'Heart' }
        ],
        graphiques: [
          {
            type: 'pie' as const,
            titre: 'Répartition du patrimoine',
            donnees: [
              { name: 'Actifs financiers', value: totalActifsFinanciers, color: '#3b82f6' },
              { name: 'Immobilier', value: totalImmobilier, color: '#10b981' },
              { name: 'Passifs', value: -totalPassifs, color: '#ef4444' }
            ].filter(d => Math.abs(d.value) > 0)
          }
        ]
      },
      
      analyse_patrimoniale: {
        problemes_detectes: [
          ...(patrimoineNet < 100000 ? [{
            description: 'Patrimoine limité nécessitant une stratégie de croissance',
            gravite: 'moyenne' as const,
            impact_financier: 0
          }] : []),
          ...(totalPassifs > totalActifsFinanciers * 0.5 ? [{
            description: 'Endettement significatif à optimiser',
            gravite: 'haute' as const,
            impact_financier: totalPassifs * 0.05
          }] : [])
        ],
        points_forts: [
          ...(patrimoineNet > 500000 ? ['Patrimoine conséquent permettant une diversification'] : []),
          ...(totalRevenus > 100000 ? ['Revenus élevés favorisant l\'épargne'] : []),
          'Situation patrimoniale structurée'
        ],
        recommendations_prioritaires: [
          ...(totalPassifs > 0 ? ['Optimiser la structure de financement'] : []),
          'Diversifier les placements',
          'Optimiser la fiscalité',
          'Anticiper la transmission'
        ]
      },
      
      analyse_civile: {
        synthese: `Vous êtes sous le régime ${regimeMatrimonial}. ${nbEnfants > 0 ? `La présence de ${nbEnfants} enfant${nbEnfants > 1 ? 's' : ''} nécessite d'anticiper la transmission.` : 'Il est recommandé d\'organiser votre succession.'}`,
        points_cles: [
          `Régime : ${regimeMatrimonial}`,
          `${nbEnfants} enfant${nbEnfants > 1 ? 's' : ''}`,
          ...(nbEnfants > 0 ? ['Protection du conjoint à renforcer'] : [])
        ]
      },
      
      analyse_fiscale: {
        synthese: `Votre TMI de ${tmi}% implique une optimisation fiscale ciblée. ${totalRevenus > 100000 ? 'Vos revenus élevés justifient une stratégie d\'optimisation approfondie.' : ''}`,
        points_cles: [
          `TMI : ${tmi}%`,
          `Revenus : ${totalRevenus.toLocaleString('fr-FR')} €`,
          `Pression fiscale à optimiser`
        ],
        optimisations: [
          ...(totalRevenus > 50000 ? [{
            type: 'Défiscalisation',
            gain_estime: totalRevenus * (tmi / 100) * 0.1,
            description: 'Versements PER pour réduire l\'IR'
          }] : []),
          ...(patrimoineNet > 300000 ? [{
            type: 'Transmission',
            gain_estime: 50000,
            description: 'Donations anticipées pour réduire les droits de succession'
          }] : [])
        ]
      },
      
      analyse_sociale: {
        synthese: `Votre statut professionnel ${clientData.entreprises && clientData.entreprises.length > 0 ? 'de dirigeant' : 'de salarié'} détermine votre protection sociale.`,
        points_cles: [
          clientData.entreprises && clientData.entreprises.length > 0 ? 'Statut : Dirigeant' : 'Statut : Salarié',
          'Protection sociale à évaluer',
          'Retraite à anticiper'
        ]
      },
      
      strategies: [
        {
          montage_id: 'simple_1',
          nom: 'Optimisation fiscale de base',
          pertinence: 8,
          objectif: 'Réduire la pression fiscale',
          conditions: 'TMI élevée',
          avantages: 'Économies d\'impôts',
          risques: 'Faibles',
          fiscalite: `Économie potentielle : ${Math.round(totalRevenus * (tmi / 100) * 0.1).toLocaleString('fr-FR')} €/an`,
          etapes: '1. Analyse 2. Mise en place 3. Suivi'
        }
      ],
      
      plan_action: {
        actions_immediates: [
          {
            titre: 'Bilan patrimonial approfondi',
            description: 'Réaliser un audit complet de votre situation',
            delai: '1 mois'
          }
        ],
        actions_court_terme: [
          {
            titre: 'Optimisation fiscale',
            description: 'Mettre en place des stratégies de défiscalisation',
            delai: '3-6 mois'
          }
        ],
        actions_moyen_terme: [
          {
            titre: 'Stratégie de transmission',
            description: 'Anticiper la transmission du patrimoine',
            delai: '1-2 ans'
          }
        ]
      },
      
      preconisations: [
        'Réaliser un bilan patrimonial complet',
        'Optimiser la fiscalité des revenus',
        'Diversifier les placements',
        'Anticiper la transmission',
        'Sécuriser le patrimoine professionnel'
      ],
      
      score_global: 7,
      
      meta: {
        version: 'simple',
        generated_at: new Date().toISOString()
      }
    };
    
    return rapport;
    
  } catch (error) {
    console.error('❌ Erreur génération rapport simple:', error);
    throw error;
  }
}
