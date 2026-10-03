// Recommendation Documents Routes - PocketBase
// PDF attachments for client.auditRecommendations entries. Recommendations
// themselves stay an embedded JSON array on the clients collection (see
// useClientData.ts) - these routes only manage the files attached to one,
// stored in their own 'recommendation_documents' collection and linked by
// recommendationId since a PocketBase file field can't attach to an item
// inside a JSON blob.

import { Hono } from 'hono';
import { pb } from './pocketbase_client.tsx';

const app = new Hono();

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo

function toDocMeta(rec: any) {
  return {
    id: rec.id,
    recommendationId: rec.recommendationId,
    clientId: rec.clientId,
    filename: rec.filename,
    uploadedAt: rec.uploadedAt,
  };
}

// ─── GET /:recommendationId/documents (list) ──────────────────────────
app.get('/:recommendationId/documents', async (c) => {
  try {
    const recommendationId = c.req.param('recommendationId');
    const result = await pb.listRecords('recommendation_documents', {
      filter: `recommendationId = "${recommendationId}"`,
      sort: '-uploadedAt',
    });
    return c.json({ documents: result.items.map(toDocMeta) });
  } catch (err: any) {
    console.error('Error listing recommendation documents:', err.message);
    return c.json({ documents: [], error: err.message }, 500);
  }
});

// ─── POST /:recommendationId/documents (upload a PDF) ─────────────────
app.post('/:recommendationId/documents', async (c) => {
  try {
    const recommendationId = c.req.param('recommendationId');
    const incoming = await c.req.formData();
    const file = incoming.get('file');
    const clientId = incoming.get('clientId');

    if (!(file instanceof File)) return c.json({ error: 'Fichier manquant' }, 400);
    if (!clientId || typeof clientId !== 'string') return c.json({ error: 'clientId manquant' }, 400);
    if (file.type !== 'application/pdf') return c.json({ error: 'Seuls les fichiers PDF sont acceptés' }, 400);
    if (file.size > MAX_FILE_SIZE) return c.json({ error: 'Fichier trop volumineux (10 Mo max)' }, 400);

    const outgoing = new FormData();
    outgoing.set('recommendationId', recommendationId);
    outgoing.set('clientId', clientId);
    outgoing.set('filename', file.name);
    outgoing.set('uploadedAt', new Date().toISOString());
    outgoing.set('file', file, file.name);

    const created = await pb.createRecordWithFile('recommendation_documents', outgoing);
    return c.json(toDocMeta(created), 201);
  } catch (err: any) {
    console.error('Error uploading recommendation document:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// ─── GET /documents/:id/download (stream the PDF bytes) ───────────────
app.get('/documents/:id/download', async (c) => {
  try {
    const id = c.req.param('id');
    const record = await pb.getRecord('recommendation_documents', id);
    if (!record.file) return c.json({ error: 'Fichier introuvable' }, 404);

    const fileRes = await pb.fetchFile('recommendation_documents', id, record.file as string);
    if (!fileRes.ok) return c.json({ error: 'Fichier introuvable' }, 404);

    const forceDownload = c.req.query('download') === '1';
    const filename = (record.filename as string) || (record.file as string);

    return new Response(fileRes.body, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${forceDownload ? 'attachment' : 'inline'}; filename="${filename.replace(/"/g, '')}"`,
      },
    });
  } catch (err: any) {
    console.error('Error downloading recommendation document:', err.message);
    return c.json({ error: err.message }, 404);
  }
});

// ─── DELETE /documents/:id ──────────────────────────────────────────────
app.delete('/documents/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await pb.deleteRecord('recommendation_documents', id);
    return c.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting recommendation document:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

export default app;
