// Identification automatique du client associé à un mail entrant.
// Utilisé à la réception (communications_routes_pb.tsx) et pour le
// rattrapage des mails déjà reçus et non classés (hub_mails_routes_pb.tsx,
// POST /mails/auto-match).
//
// Deux signaux, par ordre de fiabilité :
//   1. L'adresse email de l'expéditeur correspond exactement à l'email
//      d'une fiche client (signal fort, quasi jamais de faux positif).
//   2. À défaut, le nom complet (prénom + nom) d'un client apparaît dans
//      le sujet ou le corps du mail (signal plus faible - on exige les
//      deux mots pour limiter les faux positifs sur des prénoms/noms
//      communs).
// Si rien ne correspond, on ne devine pas : le mail reste non classé pour
// une association manuelle.

import { pb } from './pocketbase_client.tsx';

// Même identité admin que Sidebar.tsx/App.tsx/auth_routes_pb_fixed.tsx.
// Une fiche "client" existe pour Hortense elle-même dans la base ; comme
// sa signature apparaît dans quasiment chaque mail qu'elle envoie ou
// transfère, le repli "nom dans le corps" la faisait se matcher
// systématiquement elle-même sur son propre courrier - toujours faux,
// donc sa fiche est exclue du pool de correspondance.
const ADMIN_EMAIL = 'violeau.hortense@gmail.com';

export interface ClientMatch {
  id: string;
  name: string;
  email: string;
}

function extractEmail(raw: string): string {
  // Gère un éventuel format "Nom Prénom <email@domaine.fr>" en plus d'une
  // adresse brute - le bridge envoie normalement une adresse déjà propre,
  // mais mieux vaut ne pas en dépendre.
  const match = raw.match(/<([^>]+)>/);
  return (match ? match[1] : raw).trim().toLowerCase();
}

// Plage Unicode "Combining Diacritical Marks" (U+0300 - U+036F) - accents
// isolés une fois la chaîne passée en forme décomposée NFD ("é" -> "e"
// + ce combining mark). Construite via fromCharCode plutôt qu'un
// littéral pour éviter tout risque qu'un éditeur/outil ne réinjecte les
// accents composés au lieu du code source ASCII.
const ACCENT_MARKS_RE = new RegExp(
  '[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']',
  'g'
);

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(ACCENT_MARKS_RE, ''); // enlève les accents pour comparer "é" et "e"
}

function toMatch(c: any): ClientMatch {
  return {
    id: c.id,
    name: `${c.prenom || ''} ${c.nom || ''}`.trim() || c.name || 'Client',
    email: c.email || '',
  };
}

export async function findMatchingClient(
  fromRaw: string,
  subject: string,
  bodyText: string
): Promise<ClientMatch | null> {
  const { items: allItems } = await pb.listRecords('clients', { perPage: 500 });
  const items = (allItems as any[]).filter((c) => (c.email || '').trim().toLowerCase() !== ADMIN_EMAIL);
  const fromEmail = extractEmail(fromRaw || '');

  if (fromEmail) {
    const byEmail = items.find((c) => (c.email || '').trim().toLowerCase() === fromEmail);
    if (byEmail) return toMatch(byEmail);
  }

  const haystack = normalize(`${subject || ''} ${bodyText || ''}`);
  if (haystack.trim()) {
    for (const c of items) {
      const prenom = (c.prenom || '').trim();
      const nom = (c.nom || '').trim();
      if (prenom.length < 2 || nom.length < 2) continue;
      const direct = normalize(`${prenom} ${nom}`);
      const reversed = normalize(`${nom} ${prenom}`);
      if (haystack.includes(direct) || haystack.includes(reversed)) {
        return toMatch(c);
      }
    }
  }

  return null;
}
