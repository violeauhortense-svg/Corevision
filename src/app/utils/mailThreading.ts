/**
 * Regroupe les mails du Hub Communication en fils de discussion pour
 * l'affichage : un mail reçu d'un client et la réponse qu'on lui a
 * formulée (même sujet, même correspondant) forment un seul fil au lieu
 * de deux lignes distinctes dans la liste.
 */
import type { HubMail, MailTraitementStatus } from '../types/mail';

const ADMIN_EMAIL = 'violeau.hortense@gmail.com';

// Un sujet de réponse/transfert accumule des préfixes ("RE: RE: Fwd: ...")
// qui empêcheraient un regroupement par égalité stricte - on les retire
// tous avant de comparer.
function normalizeSubject(subject: string): string {
  let s = (subject || '').trim();
  let changed = true;
  while (changed) {
    const next = s.replace(/^(re|tr|fwd|fw|réf|ref)\s*:\s*/i, '');
    changed = next !== s;
    s = next;
  }
  return s.trim().toLowerCase();
}

// Le "correspondant" d'un mail : l'expéditeur si reçu, le premier
// destinataire (hors nous-même) si c'est une réponse qu'on a envoyée.
// Volontairement basé sur from/to plutôt que sur l'ensemble des Cc, pour
// qu'un Cc différent d'un message à l'autre ne casse pas le regroupement.
function otherParty(mail: HubMail): string {
  if (mail.direction === 'received') {
    return (mail.from || '').toLowerCase().trim();
  }
  const to = mail.to || [];
  const firstOther = to.find((e) => e && e.toLowerCase().trim() !== ADMIN_EMAIL.toLowerCase());
  return (firstOther || to[0] || '').toLowerCase().trim();
}

export function threadKeyFor(mail: HubMail): string {
  return `${normalizeSubject(mail.subject)}|${otherParty(mail)}`;
}

const STATUS_URGENCY: MailTraitementStatus[] = ['a_traiter', 'en_cours', 'a_valider_gl', 'valide_gl', 'termine'];

export interface MailThread {
  key: string;
  messages: HubMail[]; // triés du plus ancien au plus récent
  latest: HubMail;
  status: MailTraitementStatus; // le plus "urgent" parmi tous les messages du fil
  count: number;
}

export function groupMailsIntoThreads(mails: HubMail[]): MailThread[] {
  const groups = new Map<string, HubMail[]>();
  for (const mail of mails) {
    const key = threadKeyFor(mail);
    const list = groups.get(key);
    if (list) list.push(mail);
    else groups.set(key, [mail]);
  }

  const threads: MailThread[] = [];
  for (const [key, messages] of groups) {
    const sorted = [...messages].sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
    let status = sorted[0].traitementStatus;
    for (const m of sorted) {
      if (STATUS_URGENCY.indexOf(m.traitementStatus) < STATUS_URGENCY.indexOf(status)) {
        status = m.traitementStatus;
      }
    }
    threads.push({ key, messages: sorted, latest: sorted[sorted.length - 1], status, count: sorted.length });
  }

  threads.sort((a, b) => new Date(b.latest.sentAt).getTime() - new Date(a.latest.sentAt).getTime());
  return threads;
}
