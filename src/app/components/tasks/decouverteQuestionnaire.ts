/**
 * Questionnaire de découverte client - utilisé par la modale "Contacter le
 * client pour convenir d'un RDV" pour générer un mail à la carte : chaque
 * question a sa propre case, seules celles cochées apparaissent dans le
 * mail généré.
 *
 * Chaque question est classée 'field' (une information/un chiffre à nous
 * renseigner - affichée avec une case à compléter directement dans le
 * mail) ou 'document' (une pièce à joindre - regroupée séparément dans un
 * récapitulatif de documents en fin de mail, plutôt que mélangée au
 * milieu des questions).
 */

export type QuestionnaireItemKind = 'field' | 'document';

export interface QuestionnaireItem {
  id: string;
  text: string;
  kind: QuestionnaireItemKind;
}

export interface QuestionnaireGroup {
  // Sous-titre optionnel regroupant plusieurs questions (ex: "Résidence
  // principale") - omis si la section n'a pas de sous-groupes.
  label?: string;
  items: QuestionnaireItem[];
  // 'list' (défaut) : chaque item -> une ligne question/case à remplir.
  // 'matrix' : le groupe devient un tableau à lignes fixes (le texte des
  // items n'est pas affiché, juste utilisé comme case à cocher pour
  // inclure le bloc) - ex: patrimoine financier, avec un type de
  // placement par ligne et une colonne par information demandée.
  // 'repeatable' : le groupe se répète en plusieurs fiches numérotées
  // (une par bien), chaque fiche reprenant les mêmes champs - ex:
  // patrimoine immobilier, pour ne pas mélanger plusieurs biens dans une
  // seule liste de questions.
  kind?: 'list' | 'matrix' | 'repeatable';
  matrix?: { columns: string[]; rows: string[] };
  repeatFields?: string[];
  repeatNoun?: string; // "Bien" -> "Bien n°1", "Bien n°2"...
}

export interface QuestionnaireSection {
  id: string;
  title: string;
  groups: QuestionnaireGroup[];
}

const f = (id: string, text: string): QuestionnaireItem => ({ id, text, kind: 'field' });
const doc = (id: string, text: string): QuestionnaireItem => ({ id, text, kind: 'document' });

export const DECOUVERTE_QUESTIONNAIRE: QuestionnaireSection[] = [
  {
    id: 'sec1',
    title: '1/ Concernant votre situation personnelle',
    groups: [
      {
        label: 'Régime matrimonial',
        items: [
          doc('s1g1a', 'Copie de votre livret de famille à jour de votre mariage/PACS'),
          doc('s1g1b', 'Copie de votre contrat de mariage, le cas échéant'),
        ],
      },
      {
        label: 'Train de vie familial courant',
        items: [
          f(
            's1g2a',
            "Montant mensuel (ou annuel) nécessaire pour faire face à votre train de vie, hors impôt sur le revenu, remboursements de crédits et cotisations sociales"
          ),
        ],
      },
      {
        label: 'Résidence principale',
        items: [
          f('s1g3a', 'Si propriétaire : valeur actuelle estimée'),
          f('s1g3b', "Si propriétaire : date d'acquisition"),
          f('s1g3c', "Si propriétaire : valeur d'acquisition"),
          doc('s1g3d', "Si un prêt est en cours : tableau d'amortissement complet"),
          f('s1g3e', 'Si locataire : montant du loyer'),
        ],
      },
      {
        label: 'Votre patrimoine immobilier (autres biens)',
        kind: 'repeatable',
        repeatNoun: 'Bien',
        repeatFields: [
          'Bien propre ou commun (et quotité détenue par chacun si commun)',
          'Adresse',
          "Date d'acquisition",
          "Valeur d'acquisition",
          'Valeur actuelle estimée',
          'Loyers bruts annuels',
          'Charges locatives annuelles',
          'Destination à terme (cession ou transmission)',
        ],
        items: [
          f('s1g4', 'Autres biens immobiliers (hors Pinel et location meublée)'),
          doc('s1g4i', "Tableaux d'amortissement, le cas échéant"),
        ],
      },
      {
        label: 'Pour chaque dispositif Pinel',
        items: [
          f('s1g5a', 'Adresse précise'),
          f('s1g5b', 'Date de première mise en location'),
          f('s1g5c', "Durée initiale d'engagement de location"),
          f('s1g5d', 'Loyers bruts'),
          f('s1g5e', 'Charges locatives'),
          f('s1g5f', 'Destination à terme (cession ou transmission aux enfants)'),
        ],
      },
      {
        label: 'Votre patrimoine financier',
        kind: 'matrix',
        matrix: {
          columns: ['Placement', 'Titulaire', 'Montant (€)', "Date d'ouverture"],
          rows: ['Livrets (A, LDDS, LEP…)', 'Assurance-vie', 'PER', 'PEA / compte-titres', 'Autres'],
        },
        items: [f('s1g6a', 'Nature et montant de vos actifs financiers')],
      },
    ],
  },
  {
    id: 'sec2',
    title: '2/ Concernant votre activité professionnelle',
    groups: [
      {
        items: [
          doc('s2a', 'Dernier bilan de la SELARL / de votre BNC'),
          f(
            's2b',
            "Confirmation : retenir les éléments chiffrés de 2024 (chiffre d'affaires réalisé) comme rythme de croisière pour la simulation chiffrée"
          ),
          doc('s2c', "Tableau d'amortissement des crédits professionnels en cours (acquisition de la patientèle)"),
        ],
      },
      {
        label: 'SCI/IS détenant les murs professionnels',
        items: [
          doc('s2g1a', "Tableaux d'amortissement des crédits bancaires en cours"),
          doc('s2g1b', "Kbis à jour de l'intégration des SEL au capital"),
        ],
      },
    ],
  },
  {
    id: 'sec3',
    title: '3/ Concernant votre activité de marchand de biens',
    groups: [
      {
        items: [f('s3a', 'Effort de trésorerie personnelle à prévoir sur cette structure')],
      },
    ],
  },
  {
    id: 'sec4',
    title: '4/ Concernant votre activité de conseils et formations',
    groups: [
      {
        items: [
          f('s4a', 'Effort de trésorerie personnelle à prévoir sur cette structure'),
          doc('s4b', 'Communication des trois derniers bilans'),
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
          f('s5g1a', 'Adresse'),
          f('s5g1b', 'Loyers bruts'),
          f('s5g1c', 'Charges locatives'),
          f('s5g1d', "Date d'acquisition"),
          f('s5g1e', "Valeur d'acquisition"),
          f('s5g1f', 'Valeur actuelle estimée'),
          f('s5g1g', 'Destination à terme (cession ou transmission aux enfants)'),
          doc('s5g1h', "Tableaux d'amortissement, le cas échéant"),
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
  // Nombre de fiches à générer pour un groupe 'repeatable', par id du
  // premier item du groupe (ex: {"s1g4": 2} -> 2 fiches "Bien n°1/2").
  // Défaut 1 si absent.
  repeatCounts?: Record<string, number>;
}

interface SelectedSection {
  section: QuestionnaireSection;
  groups: { group: QuestionnaireGroup; fields: QuestionnaireItem[]; documents: QuestionnaireItem[] }[];
}

function sectionsWithSelection(selectedIds: Set<string>): SelectedSection[] {
  return DECOUVERTE_QUESTIONNAIRE.map((section) => ({
    section,
    groups: section.groups
      .map((group) => ({
        group,
        fields: group.items.filter((it) => it.kind === 'field' && selectedIds.has(it.id)),
        documents: group.items.filter((it) => it.kind === 'document' && selectedIds.has(it.id)),
      }))
      .filter((g) => g.fields.length > 0 || g.documents.length > 0),
  })).filter((s) => s.groups.length > 0);
}

function allSelectedDocuments(selectedIds: Set<string>): QuestionnaireItem[] {
  return DECOUVERTE_QUESTIONNAIRE.flatMap((s) => s.groups.flatMap((g) => g.items)).filter(
    (it) => it.kind === 'document' && selectedIds.has(it.id)
  );
}

/**
 * Génère le corps du mail en texte brut (stocké comme repli/affichage
 * interne dans Hub Communication - le mail réellement envoyé au client
 * utilise la version HTML ci-dessous).
 */
export function buildQuestionnaireText(opts: QuestionnaireEmailOptions): string {
  const { selectedIds, clientFirstName, rdvDateLabel, rdvTimeLabel, introMessage, repeatCounts } = opts;
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
      for (const { group, fields } of groups) {
        if (fields.length === 0) continue;
        if (group.label) lines.push(`${group.label} :`);

        if (group.kind === 'matrix' && group.matrix) {
          lines.push(`(${group.matrix.columns.join(' / ')})`);
          for (const row of group.matrix.rows) lines.push(`- ${row} : ______`);
        } else if (group.kind === 'repeatable' && group.repeatFields) {
          const count = repeatCounts?.[group.items[0].id] || 1;
          for (let i = 1; i <= count; i++) {
            lines.push(`${group.repeatNoun || 'Fiche'} n°${i} :`);
            for (const fieldLabel of group.repeatFields) lines.push(`  - ${fieldLabel} : ______`);
          }
        } else {
          for (const item of fields) lines.push(`- ${item.text} : ______`);
        }
        lines.push('');
      }
    }
  }

  const documents = allSelectedDocuments(selectedIds);
  if (documents.length > 0) {
    lines.push('Documents à joindre à votre réponse :');
    lines.push('');
    for (const item of documents) lines.push(`[ ] ${item.text}`);
    lines.push('');
  }

  lines.push(CLOSING_PARAGRAPH);
  return lines.join('\n');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const FONT = 'font-family:Arial,Helvetica,sans-serif;';
const ACCENT = '#2563eb';
const ACCENT_SOFT = '#eff6ff';
const LABEL_BG = '#f3f5f4';
const ANSWER_BG = '#fff6d6';
const BORDER = '#dce2df';

/**
 * Génère le corps du mail en HTML : bandeau d'en-tête, notice "comment
 * répondre", sections en cartes numérotées avec, pour chaque information
 * à renseigner, une case à compléter directement dans le mail (fond
 * jaune pâle) - puis un récapitulatif séparé des documents à joindre, qui
 * n'est plus mélangé au milieu des questions. Mise en page par tableaux
 * et styles en ligne uniquement : le moteur HTML d'Outlook ignore la
 * plupart du CSS moderne (flex, grid, classes...).
 */
function answerRow(label: string): string {
  return `
    <tr>
      <td width="52%" valign="top" style="${FONT}font-size:13px;line-height:1.4;color:#374151;background:${LABEL_BG};border:1px solid ${BORDER};padding:8px 10px;">${escapeHtml(label)}</td>
      <td valign="top" style="${FONT}font-size:13px;background:${ANSWER_BG};border:1px solid ${BORDER};padding:8px 10px;">&nbsp;</td>
    </tr>`;
}

function matrixTableHtml(matrix: { columns: string[]; rows: string[] }): string {
  const [rowHeader, ...dataColumns] = matrix.columns;
  const th = (text: string, width?: string) =>
    `<td ${width ? `width="${width}"` : ''} style="${FONT}font-size:12.5px;font-weight:bold;color:#ffffff;background:${ACCENT};border:1px solid ${ACCENT};padding:8px 10px;">${escapeHtml(text)}</td>`;
  const header = `<tr>${th(rowHeader, '34%')}${dataColumns.map((c) => th(c)).join('')}</tr>`;
  const rows = matrix.rows
    .map(
      (row) =>
        `<tr><td style="${FONT}font-size:13px;color:#374151;background:${LABEL_BG};border:1px solid ${BORDER};padding:8px 10px;">${escapeHtml(row)}</td>${dataColumns
          .map(() => `<td style="${FONT}font-size:13px;background:${ANSWER_BG};border:1px solid ${BORDER};padding:8px 10px;">&nbsp;</td>`)
          .join('')}</tr>`
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 10px 0;">${header}${rows}</table>`;
}

function repeatableFichesHtml(group: QuestionnaireGroup, count: number): string {
  const fields = group.repeatFields || [];
  let html = '';
  for (let i = 1; i <= count; i++) {
    html += `<p style="margin:10px 0 4px 0;font-weight:bold;font-size:13px;color:${ACCENT};">${escapeHtml(group.repeatNoun || 'Fiche')} n°${i}</p>`;
    html += `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 10px 0;">${fields.map(answerRow).join('')}</table>`;
  }
  return html;
}

export function buildQuestionnaireHtml(opts: QuestionnaireEmailOptions): string {
  const { selectedIds, clientFirstName, rdvDateLabel, rdvTimeLabel, introMessage, repeatCounts } = opts;
  const parts: string[] = [];

  parts.push(`<div style="${FONT}font-size:14px;color:#1f2937;max-width:640px;">`);

  // Bandeau d'en-tête
  parts.push(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18px;">
      <tr><td style="background:${ACCENT};border-radius:8px 8px 0 0;padding:18px 20px;">
        <p style="margin:0;${FONT}font-size:18px;font-weight:bold;color:#ffffff;">Préparation de votre dossier</p>
        <p style="margin:4px 0 0 0;${FONT}font-size:13px;color:#dbeafe;">Éléments et documents à nous transmettre</p>
      </td></tr>
    </table>`);

  if (rdvDateLabel && rdvTimeLabel) {
    parts.push(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${ACCENT_SOFT};border:1px solid #bfdbfe;border-radius:8px;margin-bottom:18px;">
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
  const documents = allSelectedDocuments(selectedIds);

  if (sections.length > 0) {
    parts.push('<p>Afin de préparer au mieux votre dossier, pourriez-vous nous transmettre les éléments suivants :</p>');

    // Notice "comment répondre"
    const steps = [
      'Répondez directement à ce message (votre réponse s\'affichera sous celui-ci).',
      'Complétez les cases jaunes ci-dessous avec vos réponses.',
      'Joignez les documents listés dans le récapitulatif en fin de message.',
    ];
    parts.push(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:4px 0 20px 0;">
        <tr>
          <td width="4" style="background:${ACCENT};width:4px;font-size:1px;">&nbsp;</td>
          <td style="background:${LABEL_BG};padding:14px 16px;">
            <p style="margin:0 0 8px 0;font-weight:bold;color:#111827;">Comment nous répondre</p>
            ${steps
              .map(
                (s, i) =>
                  `<p style="margin:3px 0;font-size:13px;color:#374151;"><span style="font-weight:bold;color:${ACCENT};">${i + 1}.</span> ${escapeHtml(s)}</p>`
              )
              .join('')}
          </td>
        </tr>
      </table>`);

    sections.forEach(({ section, groups }, idx) => {
      const number = idx + 1;
      parts.push(`
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid #e5e7eb;border-radius:8px;">
          <tr>
            <td style="width:36px;background:${ACCENT};color:#ffffff;font-weight:bold;text-align:center;vertical-align:top;border-radius:8px 0 0 8px;padding:12px 0;">${number}</td>
            <td style="padding:12px 16px;">
              <p style="margin:0 0 8px 0;font-weight:bold;color:#111827;">${escapeHtml(section.title.replace(/^\d+\/\s*/, ''))}</p>`);

      for (const { group, fields } of groups) {
        if (fields.length === 0) continue;

        if (group.kind === 'matrix' && group.matrix) {
          if (group.label) {
            parts.push(`<p style="margin:10px 0 4px 0;font-weight:bold;font-size:13px;color:#374151;">${escapeHtml(group.label)}</p>`);
          }
          parts.push(matrixTableHtml(group.matrix));
          continue;
        }

        if (group.kind === 'repeatable' && group.repeatFields) {
          const count = repeatCounts?.[group.items[0].id] || 1;
          parts.push(repeatableFichesHtml(group, count));
          continue;
        }

        if (group.label) {
          parts.push(`<p style="margin:10px 0 4px 0;font-weight:bold;font-size:13px;color:#374151;">${escapeHtml(group.label)}</p>`);
        }
        parts.push(
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 10px 0;">${fields.map((item) => answerRow(item.text)).join('')}</table>`
        );
      }

      parts.push('</td></tr></table>');
    });
  }

  if (documents.length > 0) {
    parts.push(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:2px solid ${ACCENT};border-radius:8px;">
        <tr><td style="background:${ACCENT};border-radius:7px 7px 0 0;padding:12px 16px;">
          <p style="margin:0;${FONT}font-size:15px;font-weight:bold;color:#ffffff;">📎 Documents à joindre à votre réponse</p>
        </td></tr>
        <tr><td style="padding:12px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${documents
              .map(
                (item) =>
                  `<tr><td width="22" valign="top" style="${FONT}font-size:15px;color:${ACCENT};padding:5px 0;">&#9744;</td><td style="${FONT}font-size:13px;line-height:1.4;color:#374151;padding:5px 0;border-bottom:1px solid ${BORDER};">${escapeHtml(item.text)}</td></tr>`
              )
              .join('')}
          </table>
        </td></tr>
      </table>`);
  }

  parts.push(`<p style="margin-top:20px;">${CLOSING_PARAGRAPH}</p>`);
  parts.push('</div>');

  return parts.join('\n');
}
