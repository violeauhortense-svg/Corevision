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

export interface TitleSelection {
  anchor: string;
  included: boolean;
}

interface XmlBlock {
  start: number;
  end: number;
  text: string;
}

// Scinde le corps du document en éléments de premier niveau (paragraphes
// <w:p>, tableaux <w:tbl>, sectPr final) en suivant la profondeur
// d'imbrication des balises - une regex "un seul <w:p>...</w:p>" ne
// suffit pas car un tableau contient lui-même des <w:p> imbriqués, qu'il
// ne faut pas traiter comme des blocs indépendants.
function splitTopLevelBlocks(body: string): XmlBlock[] {
  const tagRe = /<(\/?)([A-Za-z0-9:]+)((?:\s[^<>]*?)?)(\/?)>/g;
  let depth = 0;
  let curStart = -1;
  const blocks: XmlBlock[] = [];
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(body)) !== null) {
    const isClose = m[1] === '/';
    const isSelfClose = m[4] === '/' || m[3].replace(/\s+$/, '').endsWith('/');
    if (isSelfClose && !isClose) continue;
    if (!isClose) {
      if (depth === 0) curStart = m.index;
      depth++;
    } else {
      depth--;
      if (depth === 0) {
        const end = m.index + m[0].length;
        blocks.push({ start: curStart, end, text: body.slice(curStart, end) });
      }
    }
  }
  return blocks;
}

// Construit le rapport filtré : supprime, pour chaque titre décoché, à la
// fois le contenu de sa section (tout ce qui suit son paragraphe de titre
// jusqu'au prochain titre de la table des matières) et l'entrée
// correspondante dans la table des matières elle-même (sinon le sommaire
// garderait un lien mort vers une section qui n'existe plus). Les 6
// modèles n'ont qu'une seule section Word (un seul sectPr, en toute fin
// de corps), donc aucun saut de section à préserver en cours de route.
export async function buildFilteredIpReport(fileBytes: Uint8Array, selections: TitleSelection[]): Promise<Uint8Array> {
  const zip = await JSZip.loadAsync(fileBytes);
  const docFile = zip.file('word/document.xml');
  if (!docFile) throw new Error('word/document.xml introuvable dans le fichier');
  const xml: string = await docFile.async('string');

  const bodyStart = xml.indexOf('<w:body>') + '<w:body>'.length;
  const bodyEnd = xml.indexOf('</w:body>');
  const preBody = xml.slice(0, bodyStart);
  const body = xml.slice(bodyStart, bodyEnd);
  const postBody = xml.slice(bodyEnd);

  const blocks = splitTopLevelBlocks(body);

  const allAnchors = selections.map((s) => s.anchor);
  const excludedAnchors = new Set(selections.filter((s) => !s.included).map((s) => s.anchor));

  const headingBlockIdx = new Map<string, number>();
  for (const anchor of allAnchors) {
    const idx = blocks.findIndex(
      (b) => b.text.includes('<w:bookmarkStart') && b.text.includes(`w:name="${anchor}"`)
    );
    if (idx !== -1) headingBlockIdx.set(anchor, idx);
  }

  const tocBlockIdx = new Map<string, number[]>();
  blocks.forEach((b, i) => {
    if (!/w:pStyle w:val="TM\d+"/.test(b.text)) return;
    const am = b.text.match(/w:anchor="([^"]+)"/);
    if (am && allAnchors.includes(am[1])) {
      const list = tocBlockIdx.get(am[1]) || [];
      list.push(i);
      tocBlockIdx.set(am[1], list);
    }
  });

  const ordered = [...headingBlockIdx.entries()].sort((a, b) => a[1] - b[1]);
  const keep = new Array(blocks.length).fill(true);
  ordered.forEach(([anchor, bidx], idx) => {
    const end = idx + 1 < ordered.length ? ordered[idx + 1][1] : blocks.length;
    const included = !excludedAnchors.has(anchor);
    for (let i = bidx; i < end; i++) keep[i] = included;
  });
  for (const anchor of excludedAnchors) {
    for (const i of tocBlockIdx.get(anchor) || []) keep[i] = false;
  }

  const newBody = blocks.filter((_, i) => keep[i]).map((b) => b.text).join('');
  const newXml = preBody + newBody + postBody;

  zip.file('word/document.xml', newXml);
  return await zip.generateAsync({ type: 'uint8array' });
}
