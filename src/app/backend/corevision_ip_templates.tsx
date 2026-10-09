// Registre des matrices "Rapport IP" (6 variantes selon profession /
// structure déjà en place ou projetée) - utilisé par
// corevision_routes_pb.tsx pour retrouver le fichier modèle sur disque à
// partir de sa clé. Même logique que TEMPLATE_PATH pour le comparatif
// EI/SEL : chemin résolu depuis ce fichier, pas depuis cwd.

import JSZip from 'npm:jszip@3.10.1';

export const IP_TEMPLATE_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export interface IpTemplateDef {
  key: string;
  label: string;
  filename: string;
}

export const IP_TEMPLATES: IpTemplateDef[] = [
  { key: 'ip_dentiste_deja_selsgf', label: 'Chirurgien-dentiste déjà en SEL/SGF', filename: 'Matrice_Rapport_IP_Dentiste_DejaSELSGF.docx' },
  { key: 'ip_dentiste_selsgf', label: 'Chirurgien-dentiste - projet SEL/SGF', filename: 'Matrice_Rapport_IP_Dentiste_SELSGF.docx' },
  { key: 'ip_medecin_deja_selsgf', label: 'Médecin déjà en SEL/SGF', filename: 'Matrice_Rapport_IP_Medecin_DejaSELSGF.docx' },
  { key: 'ip_medecin_selsgf', label: 'Médecin - projet SEL/SGF', filename: 'Matrice_Rapport_IP_Medecin_SELSGF.docx' },
  { key: 'ip_medecin_deja_selshp', label: 'Médecin déjà en SEL/SHP', filename: 'Matrice_Rapport_IP_Medecin_DejaSELSHP.docx' },
  { key: 'ip_medecin_selshp', label: 'Médecin - projet SEL/SHP', filename: 'Matrice_Rapport_IP_Medecin_SELSHP.docx' },
];

export function findIpTemplate(key: string): IpTemplateDef | undefined {
  return IP_TEMPLATES.find((t) => t.key === key);
}

export interface IpTitleEntry {
  anchor: string;
  title: string;
  level: number;
}

// Plutôt que de deviner "ce qui compte comme un titre" parmi la
// cinquantaine de styles imbriqués du document (TitreI à TitreVI,
// Sous-partie...), on lit la table des matières que le document porte
// déjà (styles TM1/TM2/...) : c'est l'auteur du modèle qui a choisi ces
// niveaux comme la structure "navigable" du document. Chaque entrée TM
// pointe (w:anchor) vers un signet (w:bookmarkStart) posé dans le
// paragraphe de titre correspondant - on relit le texte propre depuis ce
// paragraphe plutôt que depuis l'entrée de table des matières elle-même,
// qui mélange numérotation manuelle et code de champ PAGEREF.
export async function extractIpTitles(fileBytes: Uint8Array): Promise<IpTitleEntry[]> {
  const zip = await JSZip.loadAsync(fileBytes);
  const docFile = zip.file('word/document.xml');
  if (!docFile) return [];
  const xml: string = await docFile.async('string');

  const paragraphs = xml.match(/<w:p\b[\s\S]*?<\/w:p>/g) || [];

  const targets: { anchor: string; level: number }[] = [];
  const seenAnchors = new Set<string>();
  for (const p of paragraphs) {
    const styleMatch = p.match(/w:pStyle w:val="TM(\d+)"/);
    if (!styleMatch) continue;
    const anchorMatch = p.match(/w:anchor="([^"]+)"/);
    if (!anchorMatch || seenAnchors.has(anchorMatch[1])) continue;
    seenAnchors.add(anchorMatch[1]);
    targets.push({ anchor: anchorMatch[1], level: parseInt(styleMatch[1], 10) });
  }

  const entries: IpTitleEntry[] = [];
  for (const { anchor, level } of targets) {
    const bodyPara = paragraphs.find(
      (p) => p.includes('<w:bookmarkStart') && p.includes(`w:name="${anchor}"`)
    );
    if (!bodyPara) continue;
    const texts = [...bodyPara.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]);
    const title = texts.join('').replace(/\s+/g, ' ').trim();
    if (!title) continue;
    entries.push({ anchor, title, level });
  }

  return entries;
}
