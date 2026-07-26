// ============================================
// HELPER FUNCTIONS
// ============================================

// Tâches avec IDs pour les 8 nouveaux statuts
const TASK_IDS_MAP: Record<string, Array<{ id: string; title: string }>> = {
  'Prospect': [
    { id: 'p1', title: 'Origine du prospect' },
    { id: 'p2', title: 'Contacter le client pour convenir d\'un RDV' },
    { id: 'p3', title: 'Demande d\'informations au comptable' },
    { id: 'p4', title: 'Interne' },
  ],
  'Découverte': [
    { id: 'd1', title: 'Collecte des documents' },
    { id: 'd2', title: 'Conformité 1' },
    { id: 'd3', title: 'Remplissage des informations dans bilan' },
    { id: 'd4', title: 'RDV découverte (validation infos et objectifs)' },
  ],
  'Simulation': [
    { id: 's1', title: 'Simulation chiffrée (réalisation)' },
    { id: 's2', title: 'Validation GL de la simulation' },
    { id: 's3', title: 'RDV Présentation simulation chiffré' },
    { id: 's4', title: 'Confirmation client pour poursuivre' },
    { id: 's5', title: 'Conformité 2' },
  ],
  'Lettre Mission': [
    { id: 'lm1', title: 'Réception des documents de vigilance' },
    { id: 'lm2', title: 'Envoi lettre de mission pour signature' },
    { id: 'lm3', title: 'Acceptation LM des clients (LM signé)' },
    { id: 'lm4', title: 'Écriture du rapport/audit' },
  ],
  'Rapport/Audit': [
    { id: 'ra1', title: 'Validation du rapport par GL' },
    { id: 'ra2', title: 'Incorporation des recommandations' },
    { id: 'ra3', title: 'Envoi du rapport au client pour signature' },
  ],
  'Suivi MEP': [
    { id: 'mep1', title: 'Confirmation des recommandations à mettre en place' },
    { id: 'mep2', title: 'Envoi au service juridique pour DPJ' },
  ],
  'Suivi CSP': [
    { id: 'csp1', title: 'Prendre contact avec le client (annuel)' },
    { id: 'csp2', title: 'Nouvelles recommandations' },
    { id: 'csp3', title: 'Compte rendu par mail + O2S' },
  ],
  'Arbitrage': [
    { id: 'arb1', title: 'Pièces comptables reçues' },
    { id: 'arb2', title: 'Demander besoin trésorerie année en cours' },
    { id: 'arb3', title: 'Remplir fichier excel (IR, cotisations sociales)' },
    { id: 'arb4', title: 'Prévenir comptable' },
    { id: 'arb5', title: 'Note O2S' },
  ],
};

export function getTasksWithIdsForStatus(statut: string): Array<{ id: string; title: string }> {
  return TASK_IDS_MAP[statut] || [];
}

// Fonction pour obtenir les templates de tâches selon le statut
// Support NOUVEAU pipeline 8 statuts (Prospect → Arbitrage)
export function getTasksForStatus(statut: string): string[] {
  switch (statut) {
    // 🆕 NOUVEAUX STATUTS (8 statuts)
    case 'Prospect':
      return [
        'Origine du prospect',
        'Contacter le client pour convenir d\'un RDV',
        'Demande d\'informations au comptable',
        'Interne',
      ];
    case 'Découverte':
      return [
        'Collecte des documents',
        'Conformité 1',
        'Remplissage des informations dans bilan',
        'RDV découverte (validation infos et objectifs)',
      ];
    case 'Simulation':
      return [
        'Simulation chiffrée (réalisation)',
        'Validation GL de la simulation',
        'RDV Présentation simulation chiffré',
        'Confirmation client pour poursuivre',
        'Conformité 2',
      ];
    case 'Lettre Mission':
      return [
        'Réception des documents de vigilance',
        'Envoi lettre de mission pour signature',
        'Acceptation LM des clients (LM signé)',
        'Écriture du rapport/audit',
      ];
    case 'Rapport/Audit':
      return [
        'Validation du rapport par GL',
        'Incorporation des recommandations',
        'Envoi du rapport au client pour signature',
      ];
    case 'Suivi MEP':
      return [
        'Confirmation des recommandations à mettre en place',
        'Envoi au service juridique pour DPJ',
      ];
    case 'Suivi CSP':
      return [
        'Prendre contact avec le client (annuel)',
        'Nouvelles recommandations',
        'Compte rendu par mail + O2S',
      ];
    case 'Arbitrage':
      return [
        'Pièces comptables reçues',
        'Demander besoin trésorerie année en cours',
        'Remplir fichier excel (IR, cotisations sociales)',
        'Prévenir comptable',
        'Note O2S',
      ];
    // 🔄 ANCIENS STATUTS (rétrocompat)
    case 'R0 - Prospect':
      return [
        'Origine du prospect',
        'Contacter le client / planifier le premier rendez-vous',
        'Contacter le comptable pour obtenir les infos pro (si chez fiteco)',
      ];
    case 'R0-R1 - Découverte':
      return [
        'Collecter documents et infos (perso + pro)',
        'RDV découverte – finalisation de remplissage des infos et objectifs clients',
        'Transmission du devis au client',
        'Réception accord étude patrimoniale + date de restitution',
      ];
    case 'R1 - Audit patrimonial':
      return [
        'Rédaction de l\'audit',
        'Incorporation des recommandations avec deadline',
        'Créer synthèse/présentation d\'audit et axes de recommandations',
      ];
    case 'R1-R2 - Stratégie définie':
      return [
        'Présentation de l\'audit (restitution) Date',
        'Validation des recommandations par le client + mail de compte rendu d\'echange du rdv',
        'Validation des responsables et échéances pour mise en place',
      ];
    case 'R2 - Recommandation proposée':
      return [
        'Suivi de mise en place des recommandations',
        'Relance partenaires ou client si blocage',
      ];
    case 'Rsuivi - Suivi patrimonial':
      return [
        'Planifier rendez-vous réguliers de suivi',
        'Réactualiser projections et recommandations si besoin',
      ];
    default:
      return [];
  }
}

// Fonction pour calculer le score de risque
export function calculateRiskScore(responses: any): number {
  let score = 0;

  // Situation financière (max 34 pts)
  const patrimFinMapping: Record<string, number> = {
    '0-50k': 0, '51-250k': 2, '251-500k': 4, '501k-1M': 6, '>1M': 8
  };
  const epargneMapping: Record<string, number> = {
    '0-5k': 0, '6-10k': 0, '11-15k': 1, '16-20k': 1, '>20k': 2
  };
  const revenusMapping: Record<string, number> = {
    '0-30k': 0, '31-45k': 1, '46-75k': 2, '76-100k': 3, '>100k': 4
  };
  const chargesMapping: Record<string, number> = {
    '0-10%': 8, '11-20%': 6, '21-30%': 4, '31-40%': 2, '>40%': 0
  };
  const capaciteMapping: Record<string, number> = {
    '0-500': 0, '501-1000': 1, '1001-1500': 2, '1501-2000': 3, '>2000': 4
  };

  score += patrimFinMapping[responses.patrimoineFinancier] || 0;
  score += epargneMapping[responses.epargnePrec] || 0;
  score += patrimFinMapping[responses.patrimoineImmo] || 0;
  score += revenusMapping[responses.revenusReguliers] || 0;
  score += chargesMapping[responses.chargesReg] || 0;
  score += capaciteMapping[responses.capaciteEpargne] || 0;

  // Objectifs (max 46 pts)
  const horizonMapping: Record<string, number> = {
    '0-4': 0, '4-8': 4, '8-15': 8, '>15': 10
  };
  const ageMapping: Record<string, number> = {
    '<55': 6, '55-69': 4, '70-85': 2, '>85': 0
  };
  const orientationMapping: Record<string, number> = {
    'A': 0, 'B': 15, 'C': 30
  };

  score += horizonMapping[responses.horizonPlacement] || 0;
  score += ageMapping[responses.trancheAge] || 0;
  score += orientationMapping[responses.orientationPlacement] || 0;

  // Connaissance et expérience (max 20 pts)
  let quizCorrect = 0;
  const correctAnswers: Record<string, boolean> = {
    'q1': true, 'q2': true, 'q3': true, 'q4': true, 'q5': true,
    'q6': true, 'q7': true, 'q8': true, 'q9': false, 'q10': false
  };
  Object.keys(correctAnswers).forEach(key => {
    if (responses.quizReponses?.[key] === correctAnswers[key]) {
      quizCorrect++;
    }
  });
  score += quizCorrect >= 6 ? 4 : 0;

  const produitsScore = (responses.produitsInvestis?.length || 0) * 0.5;
  score += Math.min(produitsScore, 4);

  const reactionBaisseMapping: Record<string, number> = {
    'vendre': 0, 'conserver': 3, 'investir-plus': 6
  };
  score += reactionBaisseMapping[responses.reactionBaisse] || 0;

  const reactionHausseMapping: Record<string, number> = {
    'vendre-part': 6, 'patienter': 6, 'investir-plus': 0
  };
  score += reactionHausseMapping[responses.reactionHausse] || 0;

  return Math.min(score, 100);
}

// Fonction pour déterminer le profil de risque
export function determineRiskProfile(score: number): string {
  if (score < 40) return 'modérée';
  if (score < 60) return 'équilibrée';
  return 'dynamique';
}

// Fonction pour générer le document HTML du profil de risque
export function generateRiskProfileDocument(questionnaire: any, responses: any, score: number, profile: string): string {
  const { clientName, clientEmail, createdAt } = questionnaire;
  
  // Mapping des profils
  const profileLabels: Record<string, string> = {
    'modérée': 'Profil Modéré',
    'équilibrée': 'Profil Équilibré',
    'dynamique': 'Profil Dynamique'
  };
  
  const profileColors: Record<string, string> = {
    'modérée': '#f59e0b',
    'équilibrée': '#3b82f6',
    'dynamique': '#10b981'
  };
  
  const profileLabel = profileLabels[profile] || 'Profil Inconnu';
  const profileColor = profileColors[profile] || '#6b7280';
  
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Profil Investisseur - ${clientName}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
          line-height: 1.6;
          color: #1f2937;
          background: linear-gradient(135deg, ${profileColor} 0%, #667eea 100%);
          padding: 40px 20px;
          min-height: 100vh;
        }
        
        .document-container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }
        
        .document-header {
          background: linear-gradient(135deg, ${profileColor} 0%, #667eea 100%);
          color: white;
          padding: 50px 40px;
          text-align: center;
        }
        
        .document-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        
        h1 {
          font-size: 36px;
          font-weight: 700;
          margin-bottom: 15px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .document-meta {
          display: flex;
          justify-content: center;
          gap: 30px;
          margin-top: 20px;
          flex-wrap: wrap;
        }
        
        .meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.2);
          padding: 8px 16px;
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }
        
        .document-content {
          padding: 50px;
        }
        
        .profile-result {
          text-align: center;
          padding: 40px;
          background: linear-gradient(135deg, ${profileColor}15 0%, #667eea15 100%);
          border-radius: 16px;
          margin-bottom: 40px;
          border: 3px solid ${profileColor};
        }
        
        .profile-badge {
          display: inline-block;
          padding: 15px 40px;
          background: ${profileColor};
          color: white;
          border-radius: 50px;
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 20px;
          box-shadow: 0 4px 12px ${profileColor}50;
        }
        
        .score-display {
          font-size: 48px;
          font-weight: 700;
          color: ${profileColor};
          margin: 20px 0;
        }
        
        .score-label {
          font-size: 18px;
          color: #6b7280;
          font-weight: 500;
        }
        
        .section {
          margin-bottom: 40px;
        }
        
        .section-title {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 3px solid ${profileColor};
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        
        .info-card {
          background: #f9fafb;
          padding: 20px;
          border-radius: 12px;
          border-left: 4px solid ${profileColor};
        }
        
        .info-label {
          font-size: 13px;
          color: #6b7280;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        
        .info-value {
          font-size: 16px;
          color: #1f2937;
          font-weight: 600;
        }
        
        .profile-description {
          background: white;
          padding: 30px;
          border-radius: 12px;
          border: 2px solid #e5e7eb;
          margin-top: 20px;
        }
        
        .description-text {
          color: #4b5563;
          line-height: 1.8;
          margin-bottom: 15px;
        }
        
        .document-footer {
          background: #1f2937;
          color: #9ca3af;
          text-align: center;
          padding: 30px;
          font-size: 13px;
        }
        
        .document-footer p {
          margin: 8px 0;
        }
        
        @media print {
          body {
            background: white;
            padding: 0;
          }
          
          .document-container {
            box-shadow: none;
            border-radius: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="document-container">
        <!-- En-tête -->
        <div class="document-header">
          <div class="document-icon">📊</div>
          <h1>Profil Investisseur</h1>
          <div class="document-meta">
            <div class="meta-item">
              <span>👤</span>
              <span><strong>${clientName}</strong></span>
            </div>
            <div class="meta-item">
              <span>📅</span>
              <span>${new Date(createdAt).toLocaleDateString('fr-FR')}</span>
            </div>
            <div class="meta-item">
              <span>📧</span>
              <span>${clientEmail}</span>
            </div>
          </div>
        </div>

        <!-- Contenu -->
        <div class="document-content">
          <!-- Résultat du profil -->
          <div class="profile-result">
            <div class="profile-badge">${profileLabel}</div>
            <div class="score-display">${score}/100</div>
            <div class="score-label">Score de tolérance au risque</div>
          </div>

          <!-- Description du profil -->
          <div class="section">
            <h2 class="section-title">📋 Votre Profil</h2>
            <div class="profile-description">
              ${profile === 'modérée' ? `
                <p class="description-text">
                  <strong>Profil Modéré :</strong> Vous privilégiez la sécurité et la préservation de votre capital. 
                  Vous acceptez une prise de risque limitée et préférez des investissements stables.
                </p>
                <p class="description-text">
                  <strong>Recommandations :</strong> Fonds euros, obligations d'État, SCPI de rendement, 
                  avec une exposition actions limitée (0-30%).
                </p>
              ` : profile === 'équilibrée' ? `
                <p class="description-text">
                  <strong>Profil Équilibré :</strong> Vous recherchez un équilibre entre sécurité et performance. 
                  Vous acceptez une volatilité modérée pour obtenir un rendement supérieur.
                </p>
                <p class="description-text">
                  <strong>Recommandations :</strong> Mix fonds euros/unités de compte, SCPI diversifiées, 
                  exposition actions modérée (30-60%).
                </p>
              ` : `
                <p class="description-text">
                  <strong>Profil Dynamique :</strong> Vous recherchez la performance et acceptez une volatilité importante. 
                  Vous comprenez que des pertes temporaires font partie du processus d'investissement.
                </p>
                <p class="description-text">
                  <strong>Recommandations :</strong> Forte exposition actions (60-100%), ETF, SCPI de valorisation, 
                  Private Equity, avec horizon long terme.
                </p>
              `}
            </div>
          </div>

          <!-- Synthèse des réponses -->
          <div class="section">
            <h2 class="section-title">📈 Synthèse de votre situation</h2>
            <div class="info-grid">
              <div class="info-card">
                <div class="info-label">💰 Patrimoine financier</div>
                <div class="info-value">${responses.patrimoineFinancier || 'Non renseigné'}</div>
              </div>
              <div class="info-card">
                <div class="info-label">🏠 Patrimoine immobilier</div>
                <div class="info-value">${responses.patrimoineImmo || 'Non renseigné'}</div>
              </div>
              <div class="info-card">
                <div class="info-label">💵 Revenus annuels</div>
                <div class="info-value">${responses.revenusReguliers || 'Non renseigné'}</div>
              </div>
              <div class="info-card">
                <div class="info-label">💳 Charges régulières</div>
                <div class="info-value">${responses.chargesReg || 'Non renseigné'}</div>
              </div>
              <div class="info-card">
                <div class="info-label">📅 Horizon placement</div>
                <div class="info-value">${responses.horizonPlacement ? responses.horizonPlacement + ' ans' : 'Non renseigné'}</div>
              </div>
              <div class="info-card">
                <div class="info-label">🎯 Orientation</div>
                <div class="info-value">${responses.orientationPlacement === 'A' ? 'Sécurité' : responses.orientationPlacement === 'B' ? 'Croissance' : responses.orientationPlacement === 'C' ? 'Performance' : 'Non renseigné'}</div>
              </div>
            </div>
          </div>

          <!-- Détail des réponses au questionnaire -->
          <div class="section">
            <h2 class="section-title">📋 Détail des réponses au questionnaire</h2>
            <div class="profile-description">
              <p class="description-text" style="margin-bottom: 25px; font-style: italic; color: #6b7280;">
                Ce détail permet de justifier le profil investisseur attribué conformément à la réglementation MIF 2.
              </p>
              
              <!-- Situation patrimoniale -->
              <div style="margin-bottom: 30px; padding: 20px; background: #f3f4f6; border-radius: 10px;">
                <h3 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-bottom: 15px; border-bottom: 2px solid ${profileColor}; padding-bottom: 8px;">
                  💰 Situation Patrimoniale
                </h3>
                <div style="display: grid; gap: 12px;">
                  <div style="padding: 10px; background: white; border-radius: 6px;">
                    <strong>Patrimoine financier :</strong> ${responses.patrimoineFinancier || 'Non renseigné'}
                  </div>
                  <div style="padding: 10px; background: white; border-radius: 6px;">
                    <strong>Patrimoine immobilier :</strong> ${responses.patrimoineImmo || 'Non renseigné'}
                  </div>
                  <div style="padding: 10px; background: white; border-radius: 6px;">
                    <strong>Épargne de précaution :</strong> ${responses.epargnePrec || 'Non renseigné'}
                  </div>
                </div>
              </div>

              <!-- Revenus et charges -->
              <div style="margin-bottom: 30px; padding: 20px; background: #f3f4f6; border-radius: 10px;">
                <h3 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-bottom: 15px; border-bottom: 2px solid ${profileColor}; padding-bottom: 8px;">
                  💵 Revenus et Charges
                </h3>
                <div style="display: grid; gap: 12px;">
                  <div style="padding: 10px; background: white; border-radius: 6px;">
                    <strong>Revenus réguliers :</strong> ${responses.revenusReguliers || 'Non renseigné'}
                  </div>
                  <div style="padding: 10px; background: white; border-radius: 6px;">
                    <strong>Charges régulières :</strong> ${responses.chargesReg || 'Non renseigné'}
                  </div>
                  <div style="padding: 10px; background: white; border-radius: 6px;">
                    <strong>Capacité d'épargne mensuelle :</strong> ${responses.capaciteEpargneMens || 'Non renseigné'}
                  </div>
                  ${responses.origineRevenus && responses.origineRevenus.length > 0 ? `
                  <div style="padding: 10px; background: white; border-radius: 6px;">
                    <strong>Origine des revenus :</strong> ${responses.origineRevenus.join(', ')}
                  </div>
                  ` : ''}
                </div>
              </div>

              <!-- Objectifs et horizon -->
              <div style="margin-bottom: 30px; padding: 20px; background: #f3f4f6; border-radius: 10px;">
                <h3 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-bottom: 15px; border-bottom: 2px solid ${profileColor}; padding-bottom: 8px;">
                  🎯 Objectifs d'Investissement
                </h3>
                <div style="display: grid; gap: 12px;">
                  <div style="padding: 10px; background: white; border-radius: 6px;">
                    <strong>Horizon de placement :</strong> ${responses.horizonPlacement ? responses.horizonPlacement + ' ans' : 'Non renseigné'}
                  </div>
                  <div style="padding: 10px; background: white; border-radius: 6px;">
                    <strong>Orientation :</strong> ${responses.orientationPlacement === 'A' ? 'Sécurité du capital' : responses.orientationPlacement === 'B' ? 'Croissance modérée' : responses.orientationPlacement === 'C' ? 'Performance maximale' : 'Non renseigné'}
                  </div>
                  ${responses.objectifsPrioritaires && responses.objectifsPrioritaires.length > 0 ? `
                  <div style="padding: 10px; background: white; border-radius: 6px;">
                    <strong>Objectifs prioritaires :</strong> ${responses.objectifsPrioritaires.join(', ')}
                  </div>
                  ` : ''}
                </div>
              </div>

              <!-- Tolérance au risque -->
              <div style="margin-bottom: 30px; padding: 20px; background: #f3f4f6; border-radius: 10px;">
                <h3 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-bottom: 15px; border-bottom: 2px solid ${profileColor}; padding-bottom: 8px;">
                  ⚖️ Tolérance au Risque
                </h3>
                <div style="display: grid; gap: 12px;">
                  <div style="padding: 10px; background: white; border-radius: 6px;">
                    <strong>Perte acceptable :</strong> ${responses.tolerancePertes || 'Non renseigné'}
                  </div>
                  <div style="padding: 10px; background: white; border-radius: 6px;">
                    <strong>Réaction à une baisse :</strong> ${responses.reactionBaisse || 'Non renseigné'}
                  </div>
                  <div style="padding: 10px; background: white; border-radius: 6px;">
                    <strong>Part du patrimoine à risque :</strong> ${responses.partPatrimoineRisque || 'Non renseigné'}
                  </div>
                </div>
              </div>

              <!-- Connaissances financières -->
              <div style="margin-bottom: 30px; padding: 20px; background: #f3f4f6; border-radius: 10px;">
                <h3 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-bottom: 15px; border-bottom: 2px solid ${profileColor}; padding-bottom: 8px;">
                  📚 Connaissances et Expérience
                </h3>
                <div style="display: grid; gap: 12px;">
                  <div style="padding: 10px; background: white; border-radius: 6px;">
                    <strong>Niveau de connaissance :</strong> ${responses.niveauConnaissance || 'Non renseigné'}
                  </div>
                  ${responses.produitsConnus && responses.produitsConnus.length > 0 ? `
                  <div style="padding: 10px; background: white; border-radius: 6px;">
                    <strong>Produits connus :</strong> ${responses.produitsConnus.join(', ')}
                  </div>
                  ` : ''}
                  ${responses.produitsInvestis && responses.produitsInvestis.length > 0 ? `
                  <div style="padding: 10px; background: white; border-radius: 6px;">
                    <strong>Produits déjà investis :</strong> ${responses.produitsInvestis.join(', ')}
                  </div>
                  ` : ''}
                  ${responses.habitesGestion && responses.habitesGestion.length > 0 ? `
                  <div style="padding: 10px; background: white; border-radius: 6px;">
                    <strong>Habitudes de gestion :</strong> ${responses.habitesGestion.join(', ')}
                  </div>
                  ` : ''}
                </div>
              </div>

              <!-- Préférences ESG -->
              ${responses.preferencesESG !== undefined ? `
              <div style="margin-bottom: 30px; padding: 20px; background: #f3f4f6; border-radius: 10px;">
                <h3 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-bottom: 15px; border-bottom: 2px solid ${profileColor}; padding-bottom: 8px;">
                  🌱 Préférences ESG
                </h3>
                <div style="padding: 10px; background: white; border-radius: 6px;">
                  <strong>Intérêt pour les critères ESG :</strong> ${responses.preferencesESG ? 'Oui, je souhaite intégrer des critères environnementaux, sociaux et de gouvernance' : 'Non'}
                </div>
              </div>
              ` : ''}

              <!-- Résultats du quiz de connaissances -->
              ${responses.quizReponses && Object.keys(responses.quizReponses).length > 0 ? `
              <div style="margin-bottom: 30px; padding: 20px; background: #f3f4f6; border-radius: 10px;">
                <h3 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-bottom: 15px; border-bottom: 2px solid ${profileColor}; padding-bottom: 8px;">
                  🧠 Quiz de Connaissances
                </h3>
                <div style="padding: 10px; background: white; border-radius: 6px;">
                  <p style="margin-bottom: 10px;"><strong>Résultats du quiz :</strong></p>
                  <ul style="margin-left: 20px; list-style: disc;">
                    ${Object.entries(responses.quizReponses).map(([key, value]) => `
                      <li style="margin: 5px 0;">Question ${key} : ${value}</li>
                    `).join('')}
                  </ul>
                </div>
              </div>
              ` : ''}
            </div>
          </div>

          <!-- Mentions légales -->
          <div class="section">
            <h2 class="section-title">⚖️ Mentions Légales</h2>
            <div class="profile-description">
              <p class="description-text">
                Ce profil investisseur a été établi sur la base des réponses fournies au questionnaire le ${new Date(createdAt).toLocaleDateString('fr-FR')}. 
                Il est valable pour une durée d'un an et doit être mis à jour en cas de changement significatif de votre situation.
              </p>
              <p class="description-text">
                Les recommandations d'investissement qui vous seront proposées tiendront compte de ce profil, 
                conformément à la réglementation MIF 2 et aux obligations de conseil.
              </p>
              <p class="description-text">
                <strong>Score obtenu :</strong> ${score}/100 | <strong>Profil :</strong> ${profileLabel}
              </p>
            </div>
          </div>
        </div>

        <!-- Pied de page -->
        <div class="document-footer">
          <p><strong>Document généré par CRM-CoreVision</strong></p>
          <p>Profil Investisseur établi conformément à la directive MIF 2</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Fonction pour générer le document HTML du DER
export function generateDERDocumentHTML(derSignature: any): string {
  const { 
    clientName, 
    clientEmail,
    spouseName,
    spouseEmail,
    clientSigned,
    clientSignedAt,
    clientSignatureData,
    spouseSigned,
    spouseSignedAt,
    spouseSignatureData,
    derFullContent,
    createdAt,
    signerType // 'client' ou 'spouse'
  } = derSignature;

  // Déterminer qui visualise le document
  const isClientViewing = signerType === 'client';
  const viewerName = isClientViewing ? clientName : spouseName;
  const viewerEmail = isClientViewing ? clientEmail : spouseEmail;

  // Si pas de contenu DER, afficher un message par défaut
  const derContent = derFullContent || 'Contenu du Document d\'Entrée en Relation non disponible.';

  // Fonction helper pour générer un encadré de signature
  const generateSignatureBox = (
    signerName: string,
    signerEmail: string,
    isSigned: boolean,
    signedAt: string | null,
    signatureData: any,
    signerLabel: string
  ) => {
    return `
      <div class="signature-box ${isSigned ? 'signed' : 'pending'}">
        <div class="signature-header">
          <div class="signature-icon">${isSigned ? '✅' : '⏳'}</div>
          <div class="signature-title-box">
            <div class="signature-role">${signerLabel}</div>
            <div class="signature-status">${isSigned ? 'Document signé' : 'En attente de signature'}</div>
          </div>
        </div>
        
        ${isSigned ? `
          <div class="signature-details">
            <div class="detail-row">
              <span class="detail-label">👤 Signataire</span>
              <span class="detail-value">${signatureData?.prenom || ''} ${signatureData?.nom || ''}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">📧 Email</span>
              <span class="detail-value">${signatureData?.email || signerEmail}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">📅 Date</span>
              <span class="detail-value">${new Date(signedAt).toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">🕐 Heure</span>
              <span class="detail-value">${new Date(signedAt).toLocaleTimeString('fr-FR')}</span>
            </div>
          </div>
          <div class="signature-badge signed">✓ SIGNATURE VALIDÉE</div>
        ` : `
          <div class="signature-pending-message">
            <p>⏳ En attente de la signature de <strong>${signerName}</strong></p>
            <p class="email-info">Email : ${signerEmail}</p>
          </div>
          <div class="signature-badge pending">EN ATTENTE</div>
        `}
      </div>
    `;
  };

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document d'Entrée en Relation - ${viewerName}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
          line-height: 1.6;
          color: #1f2937;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 20px;
          min-height: 100vh;
        }
        
        .document-container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }
        
        .document-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 50px 40px;
          text-align: center;
        }
        
        .document-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        
        h1 {
          font-size: 36px;
          font-weight: 700;
          margin-bottom: 15px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .document-meta {
          display: flex;
          justify-content: center;
          gap: 30px;
          margin-top: 20px;
          flex-wrap: wrap;
        }
        
        .meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.2);
          padding: 8px 16px;
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }
        
        .document-content {
          padding: 50px;
        }
        
        .content-text {
          white-space: pre-wrap;
          line-height: 1.8;
          color: #374151;
          font-size: 15px;
          margin-bottom: 50px;
        }
        
        .signatures-section {
          margin-top: 60px;
          padding: 40px;
          background: #f9fafb;
          border-radius: 16px;
        }
        
        .signatures-title {
          text-align: center;
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        
        .signatures-grid {
          display: grid;
          grid-template-columns: ${spouseName ? '1fr 1fr' : '1fr'};
          gap: 30px;
          margin-bottom: 30px;
        }
        
        @media (max-width: 768px) {
          .signatures-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .signature-box {
          background: white;
          border-radius: 16px;
          padding: 30px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .signature-box:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
        
        .signature-box.signed {
          border: 3px solid #10b981;
        }
        
        .signature-box.pending {
          border: 3px solid #f59e0b;
        }
        
        .signature-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 25px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .signature-icon {
          font-size: 48px;
          line-height: 1;
        }
        
        .signature-title-box {
          flex: 1;
        }
        
        .signature-role {
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 4px;
        }
        
        .signature-status {
          font-size: 14px;
          color: #6b7280;
        }
        
        .signature-details {
          margin: 20px 0;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .detail-row:last-child {
          border-bottom: none;
        }
        
        .detail-label {
          font-weight: 600;
          color: #6b7280;
          font-size: 14px;
        }
        
        .detail-value {
          font-weight: 600;
          color: #1f2937;
          font-size: 14px;
          text-align: right;
        }
        
        .signature-badge {
          display: block;
          text-align: center;
          padding: 12px 20px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.5px;
          margin-top: 20px;
        }
        
        .signature-badge.signed {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        
        .signature-badge.pending {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }
        
        .signature-pending-message {
          text-align: center;
          padding: 20px;
          color: #6b7280;
        }
        
        .signature-pending-message p {
          margin: 8px 0;
        }
        
        .email-info {
          font-size: 13px;
          color: #9ca3af;
        }
        
        .legal-notice {
          margin-top: 40px;
          padding: 30px;
          background: white;
          border-radius: 12px;
          border-left: 5px solid #667eea;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .legal-title {
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .legal-text {
          font-size: 13px;
          color: #6b7280;
          line-height: 1.6;
          margin-bottom: 15px;
        }
        
        .document-footer {
          background: #1f2937;
          color: #9ca3af;
          text-align: center;
          padding: 30px;
          font-size: 13px;
        }
        
        .document-footer p {
          margin: 8px 0;
        }
        
        @media print {
          body {
            background: white;
            padding: 0;
          }
          
          .document-container {
            box-shadow: none;
            border-radius: 0;
          }
          
          .signature-box:hover {
            transform: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="document-container">
        <!-- En-tête -->
        <div class="document-header">
          <div class="document-icon">📄</div>
          <h1>Document d'Entrée en Relation</h1>
          <div class="document-meta">
            <div class="meta-item">
              <span>👤</span>
              <span><strong>${viewerName}</strong></span>
            </div>
            <div class="meta-item">
              <span>📅</span>
              <span>${new Date(createdAt).toLocaleDateString('fr-FR')}</span>
            </div>
            <div class="meta-item">
              <span>📧</span>
              <span>${viewerEmail}</span>
            </div>
          </div>
        </div>

        <!-- Contenu -->
        <div class="document-content">
          <div class="content-text">${derContent}</div>

          <!-- Section Signatures -->
          <div class="signatures-section">
            <div class="signatures-title">
              <span>✍️</span>
              <span>Signatures Électroniques</span>
            </div>
            
            <div class="signatures-grid">
              <!-- Signature Client -->
              ${generateSignatureBox(
                clientName,
                clientEmail,
                clientSigned,
                clientSignedAt,
                clientSignatureData,
                '👤 Client Principal'
              )}
              
              <!-- Signature Conjoint (si existe) -->
              ${spouseName ? generateSignatureBox(
                spouseName,
                spouseEmail,
                spouseSigned,
                spouseSignedAt,
                spouseSignatureData,
                '💑 Conjoint'
              ) : ''}
            </div>

            <!-- Mentions légales -->
            <div class="legal-notice">
              <div class="legal-title">
                <span>🔒</span>
                <span>Valeur Juridique</span>
              </div>
              <p class="legal-text">
                La signature électronique a la même valeur juridique qu'une signature manuscrite conformément 
                au règlement eIDAS (UE) n°910/2014 et aux articles 1366 et 1367 du Code civil français.
              </p>
              
              <div class="legal-title">
                <span>📋</span>
                <span>Informations du Document</span>
              </div>
              <p class="legal-text">
                <strong>Client principal :</strong> ${clientName} ${clientSigned ? '(✅ Signé le ' + new Date(clientSignedAt).toLocaleDateString('fr-FR') + ')' : '(⏳ En attente)'}<br>
                ${spouseName ? `<strong>Conjoint :</strong> ${spouseName} ${spouseSigned ? '(✅ Signé le ' + new Date(spouseSignedAt).toLocaleDateString('fr-FR') + ')' : '(⏳ En attente)'}<br>` : ''}
                <strong>Identifiant :</strong> ${derSignature.id || 'N/A'}<br>
                <strong>Date d'émission :</strong> ${new Date(createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </div>

        <!-- Pied de page -->
        <div class="document-footer">
          <p><strong>Document généré par CRM-CoreVision</strong></p>
          <p>Ce document peut être imprimé ou sauvegardé pour vos archives</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
