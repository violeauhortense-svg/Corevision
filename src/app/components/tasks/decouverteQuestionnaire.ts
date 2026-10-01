/**
 * Questionnaire de découverte client - utilisé par la modale "Contacter le
 * client pour convenir d'un RDV" pour générer un mail à la carte : chaque
 * question a sa propre case, seules celles cochées apparaissent dans le
 * corps du mail généré (lui-même encore modifiable avant envoi).
 */

export interface QuestionnaireItem {
  id: string;
  text: string;
}

export interface QuestionnaireGroup {
  // Sous-titre optionnel regroupant plusieurs questions (ex: "Résidence
  // principale") - omis si la section n'a pas de sous-groupes.
  label?: string;
  items: QuestionnaireItem[];
}

export interface QuestionnaireSection {
  id: string;
  title: string;
  groups: QuestionnaireGroup[];
}

export const DECOUVERTE_QUESTIONNAIRE: QuestionnaireSection[] = [
  {
    id: 'sec1',
    title: '1/ Concernant votre situation personnelle',
    groups: [
      {
        label: 'Régime matrimonial',
        items: [
          { id: 's1g1a', text: 'Copie de votre livret de famille à jour de votre mariage/PACS' },
          { id: 's1g1b', text: 'Copie de votre contrat de mariage, le cas échéant' },
        ],
      },
      {
        label: 'Train de vie familial courant',
        items: [
          {
            id: 's1g2a',
            text: "Montant mensuel (ou annuel) nécessaire pour faire face à votre train de vie, hors impôt sur le revenu, remboursements de crédits et cotisations sociales",
          },
        ],
      },
      {
        label: 'Résidence principale',
        items: [
          { id: 's1g3a', text: 'Si propriétaire : valeur actuelle estimée' },
          { id: 's1g3b', text: "Si propriétaire : date d'acquisition" },
          { id: 's1g3c', text: "Si propriétaire : valeur d'acquisition" },
          { id: 's1g3d', text: 'Si un prêt est en cours : tableau d\'amortissement complet' },
          { id: 's1g3e', text: 'Si locataire : montant du loyer' },
        ],
      },
      {
        label: 'Votre patrimoine immobilier (autres biens)',
        items: [
          { id: 's1g4a', text: 'Bien propre ou commun (et quotité détenue par chacun si commun)' },
          { id: 's1g4b', text: 'Adresse' },
          { id: 's1g4c', text: 'Loyers bruts' },
          { id: 's1g4d', text: 'Charges locatives' },
          { id: 's1g4e', text: "Date d'acquisition" },
          { id: 's1g4f', text: "Valeur d'acquisition" },
          { id: 's1g4g', text: 'Valeur actuelle estimée' },
          { id: 's1g4h', text: 'Destination à terme (cession ou transmission)' },
          { id: 's1g4i', text: "Tableaux d'amortissement, le cas échéant" },
        ],
      },
      {
        label: 'Pour chaque dispositif Pinel',
        items: [
          { id: 's1g5a', text: 'Adresse précise' },
          { id: 's1g5b', text: 'Date de première mise en location' },
          { id: 's1g5c', text: "Durée initiale d'engagement de location" },
          { id: 's1g5d', text: 'Loyers bruts' },
          { id: 's1g5e', text: 'Charges locatives' },
          { id: 's1g5f', text: 'Destination à terme (cession ou transmission aux enfants)' },
        ],
      },
      {
        label: 'Votre patrimoine financier',
        items: [
          {
            id: 's1g6a',
            text: 'Nature et montant des actifs financiers que vous possédez (livret A, LDDS, assurance vie, PER…)',
          },
        ],
      },
    ],
  },
  {
    id: 'sec2',
    title: '2/ Concernant votre activité professionnelle',
    groups: [
      {
        items: [
          { id: 's2a', text: 'Dernier bilan de la SELARL / de votre BNC' },
          {
            id: 's2b',
            text: 'Confirmation : retenir les éléments chiffrés de 2024 (chiffre d\'affaires réalisé) comme rythme de croisière pour la simulation chiffrée',
          },
          { id: 's2c', text: "Tableau d'amortissement des crédits professionnels en cours (acquisition de la patientèle)" },
        ],
      },
      {
        label: 'SCI/IS détenant les murs professionnels',
        items: [
          { id: 's2g1a', text: 'Tableaux d\'amortissement des crédits bancaires en cours' },
          { id: 's2g1b', text: "Kbis à jour de l'intégration des SEL au capital" },
        ],
      },
    ],
  },
  {
    id: 'sec3',
    title: '3/ Concernant votre activité de marchand de biens',
    groups: [
      {
        items: [
          { id: 's3a', text: 'Effort de trésorerie personnelle à prévoir sur cette structure' },
        ],
      },
    ],
  },
  {
    id: 'sec4',
    title: '4/ Concernant votre activité de conseils et formations',
    groups: [
      {
        items: [
          { id: 's4a', text: 'Effort de trésorerie personnelle à prévoir sur cette structure' },
          { id: 's4b', text: 'Communication des trois derniers bilans' },
        ],
      },
    ],
  },
  {
    id: 'sec5',
    title: '5/ Concernant vos revenus de location meublée (micro-BIC)',
    groups: [
      {
        label: 'Pour chaque bien concerné',
        items: [
          { id: 's5g1a', text: 'Adresse' },
          { id: 's5g1b', text: 'Loyers bruts' },
          { id: 's5g1c', text: 'Charges locatives' },
          { id: 's5g1d', text: "Date d'acquisition" },
          { id: 's5g1e', text: "Valeur d'acquisition" },
          { id: 's5g1f', text: 'Valeur actuelle estimée' },
          { id: 's5g1g', text: 'Destination à terme (cession ou transmission aux enfants)' },
          { id: 's5g1h', text: "Tableaux d'amortissement, le cas échéant" },
        ],
      },
    ],
  },
];

const CLOSING_PARAGRAPH =
  "Vous remerciant par avance de vos réponses et restant à votre disposition pour tout renseignement complémentaire.";

export interface QuestionnaireEmailOptions {
  selectedIds: Set<string>;
  clientFirstName?: string;
  // Déjà formatés pour affichage (ex: "15 octobre 2026", "14h00") - le
  // bandeau de confirmation RDV n'apparaît que si les deux sont fournis.
  rdvDateLabel?: string;
  rdvTimeLabel?: string;
  // Mot personnalisé optionnel, inséré entre la formule d'appel et la
  // phrase introduisant la liste des questions.
  introMessage?: string;
}

function sectionsWithSelection(selectedIds: Set<string>) {
  return DECOUVERTE_QUESTIONNAIRE.map((section) => ({
    section,
    groups: section.groups
      .map((group) => ({ group, items: group.items.filter((it) => selectedIds.has(it.id)) }))
      .filter((g) => g.items.length > 0),
  })).filter((s) => s.groups.length > 0);
}

/**
 * Génère le corps du mail en texte brut (stocké comme repli/affichage
 * interne dans Hub Communication - le mail réellement envoyé au client
 * utilise la version HTML ci-dessous).
 */
export function buildQuestionnaireText(opts: QuestionnaireEmailOptions): string {
  const { selectedIds, clientFirstName, rdvDateLabel, rdvTimeLabel, introMessage } = opts;
  const lines: string[] = [];
  lines.push(`Bonjour${clientFirstName ? ' ' + clientFirstName : ''},`);
  lines.push('');

  if (rdvDateLabel && rdvTimeLabel) {
    lines.push(
      `Nous confirmons notre rendez-vous du ${rdvDateLabel} à ${rdvTimeLabel}, qui se tiendra en visioconférence. Le lien de connexion vous sera communiqué dans un second e-mail.`
    );
    lines.push('');
  }

  if (introMessage?.trim()) {
    lines.push(introMessage.trim());
    lines.push('');
  }

  const sections = sectionsWithSelection(selectedIds);
  if (sections.length > 0) {
    lines.push('Afin de préparer au mieux votre dossier, pourriez-vous nous transmettre les éléments suivants :');
    lines.push('');

    for (const { section, groups } of sections) {
      lines.push(section.title);
      lines.push('');
      for (const { group, items } of groups) {
        if (group.label) lines.push(`${group.label} :`);
        for (const item of items) lines.push(`- ${item.text}`);
        lines.push('');
      }
    }
  }

  lines.push(CLOSING_PARAGRAPH);
  return lines.join('\n');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Génère le corps du mail en HTML (cartes numérotées) - mise en page par
 * tableaux et styles en ligne uniquement, pour un rendu correct dans
 * Outlook (son moteur HTML ignore la plupart du CSS moderne).
 */
export function buildQuestionnaireHtml(opts: QuestionnaireEmailOptions): string {
  const { selectedIds, clientFirstName, rdvDateLabel, rdvTimeLabel, introMessage } = opts;
  const parts: string[] = [];
  const FONT = "font-family:Arial,Helvetica,sans-serif;";

  parts.push(`<div style="${FONT}font-size:14px;color:#1f2937;max-width:600px;">`);

  if (rdvDateLabel && rdvTimeLabel) {
    parts.push(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;margin-bottom:20px;">
        <tr><td style="padding:14px 16px;">
          <p style="margin:0 0 4px 0;font-weight:bold;color:#1e40af;">📅 RDV confirmé : ${escapeHtml(rdvDateLabel)} à ${escapeHtml(rdvTimeLabel)}</p>
          <p style="margin:0;color:#1e40af;">En visioconférence — le lien de connexion vous sera communiqué dans un second e-mail.</p>
        </td></tr>
      </table>`);
  }

  parts.push(`<p>Bonjour${clientFirstName ? ' ' + escapeHtml(clientFirstName) : ''},</p>`);

  if (introMessage?.trim()) {
    parts.push(`<p>${escapeHtml(introMessage.trim()).replace(/\n/g, '<br>')}</p>`);
  }

  const sections = sectionsWithSelection(selectedIds);
  if (sections.length > 0) {
    parts.push('<p>Afin de préparer au mieux votre dossier, pourriez-vous nous transmettre les éléments suivants :</p>');

    sections.forEach(({ section, groups }, idx) => {
      const number = idx + 1;
      parts.push(`
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid #e5e7eb;border-radius:8px;">
          <tr>
            <td style="width:36px;background:#2563eb;color:#ffffff;font-weight:bold;text-align:center;vertical-align:top;border-radius:8px 0 0 8px;padding:12px 0;">${number}</td>
            <td style="padding:12px 16px;">
              <p style="margin:0 0 8px 0;font-weight:bold;color:#111827;">${escapeHtml(section.title.replace(/^\d+\/\s*/, ''))}</p>`);

      for (const { group, items } of groups) {
        if (group.label) {
          parts.push(`<p style="margin:8px 0 2px 0;font-weight:bold;font-size:13px;color:#374151;">${escapeHtml(group.label)}</p>`);
        }
        parts.push('<ul style="margin:0 0 8px 0;padding-left:20px;">');
        for (const item of items) {
          parts.push(`<li style="margin:2px 0;">${escapeHtml(item.text)}</li>`);
        }
        parts.push('</ul>');
      }

      parts.push('</td></tr></table>');
    });
  }

  parts.push(`<p>${CLOSING_PARAGRAPH}</p>`);
  parts.push('</div>');

  return parts.join('\n');
}
