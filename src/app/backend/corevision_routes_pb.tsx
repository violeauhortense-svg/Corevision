// Commandes d'audit CoreVision - créées depuis l'onglet Objectifs d'une
// fiche client ("Commander l'audit"), gérées depuis le panneau admin
// "Commandes CoreVision" (CoreVisionAdminView.tsx / CoreVisionAdminDetailModal.tsx).
//
// `orderId` est un identifiant métier généré côté front
// (`order-${clientId}-${Date.now()}`), distinct de l'id d'enregistrement
// PocketBase - toutes les routes ci-dessous le retrouvent via un filtre.

import { Hono } from 'hono';
import { pb } from './pocketbase_client.tsx';
import { IP_TEMPLATES, IP_TEMPLATE_MIME, findIpTemplate, extractIpTitles, buildFilteredIpReport, type TitleSelection } from './corevision_ip_templates.tsx';

const app = new Hono();

// Modèle comparatif EI/SEL (37 feuilles) - copié tel quel sur chaque
// commande à sa création, aucune donnée client injectée pour l'instant
// (le lien sera ajouté plus tard, sur instruction). Chemin résolu depuis
// ce fichier plutôt que depuis cwd pour ne pas dépendre d'où `deno run`
// est lancé.
const TEMPLATE_PATH = new URL('../../../public/downloads/Modele_Comparatif_EI_SEL.xlsx', import.meta.url);
const TEMPLATE_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

async function findByOrderId(orderId: string) {
  const { items } = await pb.listRecords('corevision_orders', {
    filter: `orderId = "${orderId}"`,
    perPage: 1,
  });
  return items[0] || null;
}

// ─── GET / - liste toutes les commandes (panneau admin) ────────────────
app.get('/', async (c) => {
  try {
    const { items, total } = await pb.listRecords('corevision_orders', {
      sort: '-validatedAt',
      perPage: 200,
    });
    return c.json({ orders: items, count: total });
  } catch (err: any) {
    console.error('Erreur liste commandes CoreVision:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// ─── POST / - crée une commande (bouton "Commander l'audit") ───────────
app.post('/', async (c) => {
  try {
    const body = await c.req.json();

    if (!body.orderId || !body.clientId) {
      return c.json({ error: 'orderId et clientId requis' }, 400);
    }

    const record = await pb.createRecord('corevision_orders', {
      orderId: body.orderId,
      clientId: body.clientId,
      clientName: body.clientName || '',
      cgpName: body.cgpName || '',
      cgpEmail: body.cgpEmail || '',
      objectifs: body.objectifs || [],
      montant: body.montant || 0,
      validatedAt: body.validatedAt || new Date().toISOString(),
      status: body.status || 'pending',
      createdAt: body.createdAt || new Date().toISOString(),
      bilanData: body.bilanData || null,
    });

    // Copie du modèle comparatif pour cette commande - best-effort : si le
    // fichier modèle est introuvable sur ce poste, la commande est quand
    // même créée, juste sans comparatif pré-rempli.
    try {
      const templateBytes = await Deno.readFile(TEMPLATE_PATH);
      const filename = `Comparatif_EI_SEL_${(body.clientName || body.clientId).replace(/[^a-zA-Z0-9_-]+/g, '_')}.xlsx`;
      const formData = new FormData();
      formData.set('comparatifFilename', filename);
      formData.set('comparatifUpdatedAt', new Date().toISOString());
      formData.set('comparatifFile', new Blob([templateBytes], { type: TEMPLATE_MIME }), filename);
      const updated = await pb.updateRecordWithFile('corevision_orders', record.id, formData);
      return c.json({ success: true, order: updated }, 201);
    } catch (templateErr: any) {
      console.error('Comparatif EI/SEL non initialisé pour la commande:', templateErr.message);
      return c.json({ success: true, order: record }, 201);
    }
  } catch (err: any) {
    console.error('Erreur création commande CoreVision:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// ─── PUT /:orderId - met à jour une commande (statut, audit, préconisations...) ─
app.put('/:orderId', async (c) => {
  try {
    const orderId = c.req.param('orderId');
    const updates = await c.req.json();

    const existing = await findByOrderId(orderId);
    if (!existing) {
      return c.json({ error: 'Commande introuvable' }, 404);
    }

    const record = await pb.updateRecord('corevision_orders', existing.id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    return c.json({ success: true, order: record });
  } catch (err: any) {
    console.error('Erreur mise à jour commande CoreVision:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// ─── DELETE /:orderId ────────────────────────────────────────────────
app.delete('/:orderId', async (c) => {
  try {
    const orderId = c.req.param('orderId');

    const existing = await findByOrderId(orderId);
    if (!existing) {
      return c.json({ error: 'Commande introuvable' }, 404);
    }

    await pb.deleteRecord('corevision_orders', existing.id);
    return c.json({ success: true });
  } catch (err: any) {
    console.error('Erreur suppression commande CoreVision:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// ─── GET /:orderId/comparatif/download - récupère le fichier comparatif ─
app.get('/:orderId/comparatif/download', async (c) => {
  try {
    const orderId = c.req.param('orderId');
    const record = await findByOrderId(orderId);
    if (!record) return c.json({ error: 'Commande introuvable' }, 404);
    if (!record.comparatifFile) return c.json({ error: 'Aucun comparatif pour cette commande' }, 404);

    const fileRes = await pb.fetchFile('corevision_orders', record.id, record.comparatifFile as string);
    if (!fileRes.ok) return c.json({ error: 'Fichier introuvable' }, 404);

    const forceDownload = c.req.query('download') === '1';
    const filename = (record.comparatifFilename as string) || (record.comparatifFile as string);

    return new Response(fileRes.body, {
      status: 200,
      headers: {
        'Content-Type': TEMPLATE_MIME,
        'Content-Disposition': `${forceDownload ? 'attachment' : 'inline'}; filename="${filename.replace(/"/g, '')}"`,
      },
    });
  } catch (err: any) {
    console.error('Erreur téléchargement comparatif CoreVision:', err.message);
    return c.json({ error: err.message }, 404);
  }
});

// ─── POST /:orderId/comparatif - réimporte le fichier finalisé (remplace) ─
app.post('/:orderId/comparatif', async (c) => {
  try {
    const orderId = c.req.param('orderId');
    const record = await findByOrderId(orderId);
    if (!record) return c.json({ error: 'Commande introuvable' }, 404);

    const incoming = await c.req.formData();
    const file = incoming.get('file');
    if (!(file instanceof File)) return c.json({ error: 'Fichier manquant' }, 400);
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      return c.json({ error: 'Seuls les fichiers .xlsx sont acceptés' }, 400);
    }

    const outgoing = new FormData();
    outgoing.set('comparatifFilename', file.name);
    outgoing.set('comparatifUpdatedAt', new Date().toISOString());
    outgoing.set('comparatifFile', file, file.name);

    const updated = await pb.updateRecordWithFile('corevision_orders', record.id, outgoing);
    return c.json({ success: true, order: updated });
  } catch (err: any) {
    console.error('Erreur réimport comparatif CoreVision:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

async function findIpDocument(orderId: string, templateKey: string) {
  const { items } = await pb.listRecords('corevision_ip_documents', {
    filter: `orderId = "${orderId}" && templateKey = "${templateKey}"`,
    perPage: 1,
  });
  return items[0] || null;
}

// ─── GET /:orderId/ip-reports - liste des variantes + ce qui existe déjà ──
app.get('/:orderId/ip-reports', async (c) => {
  try {
    const orderId = c.req.param('orderId');
    const { items } = await pb.listRecords('corevision_ip_documents', {
      filter: `orderId = "${orderId}"`,
      perPage: 50,
    });
    const generated: Record<string, { filename: string; updatedAt: string }> = {};
    items.forEach((rec: any) => {
      generated[rec.templateKey] = { filename: rec.filename, updatedAt: rec.updatedAt };
    });
    return c.json({ templates: IP_TEMPLATES.map((t) => ({ key: t.key, label: t.label })), generated });
  } catch (err: any) {
    console.error('Erreur liste rapports IP:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// ─── POST /:orderId/ip-reports/:templateKey/generate - 1ère copie à la demande
app.post('/:orderId/ip-reports/:templateKey/generate', async (c) => {
  try {
    const orderId = c.req.param('orderId');
    const templateKey = c.req.param('templateKey');
    const template = findIpTemplate(templateKey);
    if (!template) return c.json({ error: 'Modèle inconnu' }, 404);

    const existing = await findIpDocument(orderId, templateKey);
    if (existing) return c.json({ filename: existing.filename, updatedAt: existing.updatedAt });

    const templatePath = new URL(`../../../public/downloads/${template.filename}`, import.meta.url);
    const templateBytes = await Deno.readFile(templatePath);

    const formData = new FormData();
    formData.set('orderId', orderId);
    formData.set('templateKey', templateKey);
    formData.set('filename', template.filename);
    formData.set('updatedAt', new Date().toISOString());
    formData.set('file', new Blob([templateBytes], { type: IP_TEMPLATE_MIME }), template.filename);

    const created = await pb.createRecordWithFile('corevision_ip_documents', formData);
    return c.json({ filename: created.filename, updatedAt: created.updatedAt }, 201);
  } catch (err: any) {
    console.error('Erreur génération rapport IP:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// ─── GET /:orderId/ip-reports/:templateKey/download ────────────────────
app.get('/:orderId/ip-reports/:templateKey/download', async (c) => {
  try {
    const orderId = c.req.param('orderId');
    const templateKey = c.req.param('templateKey');
    const record = await findIpDocument(orderId, templateKey);
    if (!record) return c.json({ error: 'Document introuvable' }, 404);

    const fileRes = await pb.fetchFile('corevision_ip_documents', record.id, record.file as string);
    if (!fileRes.ok) return c.json({ error: 'Fichier introuvable' }, 404);

    const forceDownload = c.req.query('download') === '1';
    const filename = (record.filename as string) || (record.file as string);

    return new Response(fileRes.body, {
      status: 200,
      headers: {
        'Content-Type': IP_TEMPLATE_MIME,
        'Content-Disposition': `${forceDownload ? 'attachment' : 'inline'}; filename="${filename.replace(/"/g, '')}"`,
      },
    });
  } catch (err: any) {
    console.error('Erreur téléchargement rapport IP:', err.message);
    return c.json({ error: err.message }, 404);
  }
});

// ─── POST /:orderId/ip-reports/:templateKey - réimporte le fichier finalisé
app.post('/:orderId/ip-reports/:templateKey', async (c) => {
  try {
    const orderId = c.req.param('orderId');
    const templateKey = c.req.param('templateKey');
    const record = await findIpDocument(orderId, templateKey);
    if (!record) return c.json({ error: "Document pas encore généré pour cette commande" }, 404);

    const incoming = await c.req.formData();
    const file = incoming.get('file');
    if (!(file instanceof File)) return c.json({ error: 'Fichier manquant' }, 400);
    if (!file.name.toLowerCase().endsWith('.docx')) {
      return c.json({ error: 'Seuls les fichiers .docx sont acceptés' }, 400);
    }

    const outgoing = new FormData();
    outgoing.set('filename', file.name);
    outgoing.set('updatedAt', new Date().toISOString());
    outgoing.set('file', file, file.name);

    const updated = await pb.updateRecordWithFile('corevision_ip_documents', record.id, outgoing);
    return c.json({ filename: updated.filename, updatedAt: updated.updatedAt });
  } catch (err: any) {
    console.error('Erreur réimport rapport IP:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// Relit le fichier de base d'une commande/variante et fusionne la
// sélection déjà sauvegardée (par anchor) avec les titres fraîchement
// extraits - si le fichier a été réimporté avec une structure différente,
// les titres disparus sont simplement ignorés plutôt que de laisser
// l'ancienne sélection désynchronisée.
async function getMergedIpTitles(record: any): Promise<(TitleSelection & { title: string; level: number })[]> {
  const fileRes = await pb.fetchFile('corevision_ip_documents', record.id, record.file as string);
  if (!fileRes.ok) throw new Error('Fichier introuvable');
  const bytes = new Uint8Array(await fileRes.arrayBuffer());

  const extracted = await extractIpTitles(bytes);
  const saved: Record<string, boolean> = {};
  ((record.titleSelections as any[]) || []).forEach((t: any) => {
    saved[t.anchor] = t.included;
  });

  return extracted.map((t) => ({
    ...t,
    included: saved[t.anchor] !== undefined ? saved[t.anchor] : true,
  }));
}

// ─── GET /:orderId/ip-reports/:templateKey/titles - titres + sélection ──
app.get('/:orderId/ip-reports/:templateKey/titles', async (c) => {
  try {
    const orderId = c.req.param('orderId');
    const templateKey = c.req.param('templateKey');
    const record = await findIpDocument(orderId, templateKey);
    if (!record) return c.json({ error: "Document pas encore généré pour cette commande" }, 404);

    const titles = await getMergedIpTitles(record);
    return c.json({ titles });
  } catch (err: any) {
    console.error('Erreur extraction titres rapport IP:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// ─── POST /:orderId/ip-reports/:templateKey/titles - sauvegarde la sélection ─
app.post('/:orderId/ip-reports/:templateKey/titles', async (c) => {
  try {
    const orderId = c.req.param('orderId');
    const templateKey = c.req.param('templateKey');
    const record = await findIpDocument(orderId, templateKey);
    if (!record) return c.json({ error: "Document pas encore généré pour cette commande" }, 404);

    const body = await c.req.json();
    const titles = Array.isArray(body.titles) ? body.titles : [];

    await pb.updateRecord('corevision_ip_documents', record.id, { titleSelections: titles });
    return c.json({ success: true });
  } catch (err: any) {
    console.error('Erreur sauvegarde titres rapport IP:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// ─── POST /:orderId/ip-reports/:templateKey/generate-report - filtre le docx
app.post('/:orderId/ip-reports/:templateKey/generate-report', async (c) => {
  try {
    const orderId = c.req.param('orderId');
    const templateKey = c.req.param('templateKey');
    const record = await findIpDocument(orderId, templateKey);
    if (!record) return c.json({ error: "Document pas encore généré pour cette commande" }, 404);

    const fileRes = await pb.fetchFile('corevision_ip_documents', record.id, record.file as string);
    if (!fileRes.ok) return c.json({ error: 'Fichier introuvable' }, 404);
    const bytes = new Uint8Array(await fileRes.arrayBuffer());

    const titles = await getMergedIpTitles(record);
    const filteredBytes = await buildFilteredIpReport(bytes, titles);

    const baseFilename = (record.filename as string) || 'Rapport_IP.docx';
    const generatedFilename = baseFilename.replace(/\.docx$/i, '_Rapport_final.docx');

    const formData = new FormData();
    formData.set('generatedFilename', generatedFilename);
    formData.set('generatedAt', new Date().toISOString());
    formData.set('generatedFile', new Blob([filteredBytes], { type: IP_TEMPLATE_MIME }), generatedFilename);

    const updated = await pb.updateRecordWithFile('corevision_ip_documents', record.id, formData);
    return c.json({ filename: updated.generatedFilename, generatedAt: updated.generatedAt });
  } catch (err: any) {
    console.error('Erreur génération du rapport filtré:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// ─── GET /:orderId/ip-reports/:templateKey/generated-report/download ───
app.get('/:orderId/ip-reports/:templateKey/generated-report/download', async (c) => {
  try {
    const orderId = c.req.param('orderId');
    const templateKey = c.req.param('templateKey');
    const record = await findIpDocument(orderId, templateKey);
    if (!record || !record.generatedFile) return c.json({ error: 'Rapport pas encore généré' }, 404);

    const fileRes = await pb.fetchFile('corevision_ip_documents', record.id, record.generatedFile as string);
    if (!fileRes.ok) return c.json({ error: 'Fichier introuvable' }, 404);

    const forceDownload = c.req.query('download') === '1';
    const filename = (record.generatedFilename as string) || (record.generatedFile as string);

    return new Response(fileRes.body, {
      status: 200,
      headers: {
        'Content-Type': IP_TEMPLATE_MIME,
        'Content-Disposition': `${forceDownload ? 'attachment' : 'inline'}; filename="${filename.replace(/"/g, '')}"`,
      },
    });
  } catch (err: any) {
    console.error('Erreur téléchargement du rapport filtré:', err.message);
    return c.json({ error: err.message }, 404);
  }
});

export default app;
