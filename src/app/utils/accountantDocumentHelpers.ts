/**
 * Documents comptables à demander au comptable
 * Liste spécifique pour demandes de pièces comptables/professionnelles
 */

export interface AccountantDocumentCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  documents: string[];
}

export const ACCOUNTANT_DOCUMENT_CATEGORIES: AccountantDocumentCategory[] = [
  {
    id: 'societal',
    label: 'Documents sociétaires',
    icon: '📋',
    color: 'purple',
    documents: [
      'Statuts de la société (à jour)',
      'Kbis de moins de 3 mois',
      'Pacte d\'associés (le cas échéant)',
      'Table de capitalisation / tableau des associés',
      'Conventions de compte courant d\'associé',
    ],
  },
  {
    id: 'accounting',
    label: 'Documents comptables & fiscaux',
    icon: '📊',
    color: 'blue',
    documents: [
      '3 derniers bilans comptables complets (liasse fiscale)',
      'Dernière liasse fiscale (2065, 2033 ou 2031…)',
      'Déclaration de revenus professionnels 2035 ou 2031',
      'Avis d\'imposition (IR professionnel)',
      'Déclaration 2074 (plus-values) si applicable',
    ],
  },
  {
    id: 'valuation',
    label: 'Valorisation & stratégie',
    icon: '💎',
    color: 'amber',
    documents: [
      'Valorisation de la société (méthode retenue)',
      'Dernière évaluation d\'actifs',
      'Projections financières (si disponibles)',
    ],
  },
  {
    id: 'management',
    label: 'Gestion & prévoyance',
    icon: '🏢',
    color: 'green',
    documents: [
      'Contrat de dirigeant : statut TNS ou assimilé salarié',
      'Contrat Madelin (retraite/prévoyance TNS)',
      'Contrat de prévoyance collective (si salarié)',
      'Bulletins de salaire des 3 derniers mois',
    ],
  },
  {
    id: 'equity',
    label: 'Participations & options',
    icon: '📈',
    color: 'indigo',
    documents: [
      'BSA, BSPCE, AGA (tableau récapitulatif)',
      'Accords de participation salariale',
      'Relevés de titres détenus',
    ],
  },
  {
    id: 'liabilities',
    label: 'Passif & dettes',
    icon: '💰',
    color: 'coral',
    documents: [
      'Tableau d\'amortissement des crédits professionnels',
      'Garanties données (cautions, hypothèques, nantissements)',
      'Crédit-bail ou leasing en cours',
      'Comptes courants d\'associés (solde et conditions)',
    ],
  },
];

/**
 * Génère le contenu de l'email pour demande de documents au comptable
 */
export function generateAccountantRequestEmailContent(params: {
  clientName: string;
  companyName: string;
  documentsRequested: string[];
}): string {
  const { clientName, companyName, documentsRequested } = params;

  let content = `Bonjour,

Madame, Monsieur,

Dans le cadre de la mise à jour du bilan patrimonial de notre client, ${clientName}, relative à l'entreprise « ${companyName} », je vous demande de bien vouloir me transmettre les pièces comptables et documents suivants :`;

  if (documentsRequested.length > 0) {
    content += '\n\n';
    documentsRequested.forEach((doc) => {
      content += `• ${doc}\n`;
    });
  }

  content += `

Ces documents nous sont indispensables pour établir un diagnostic complet et formuler des recommandations adaptées à la situation financière et patrimoniale de notre client.

Je vous demande de bien vouloir me retourner ces pièces dans un délai de 15 jours si possible.

Vous pouvez me joindre pour toute question ou précision.

Je vous remercie pour votre aide et votre collaboration.

Cordialement,`;

  return content;
}
