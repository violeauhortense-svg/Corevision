// Registre des matrices "Rapport IP" (6 variantes selon profession /
// structure déjà en place ou projetée) - utilisé par
// corevision_routes_pb.tsx pour retrouver le fichier modèle sur disque à
// partir de sa clé. Même logique que TEMPLATE_PATH pour le comparatif
// EI/SEL : chemin résolu depuis ce fichier, pas depuis cwd.

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
