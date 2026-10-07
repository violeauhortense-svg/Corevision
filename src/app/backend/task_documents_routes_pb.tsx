// Task Documents Routes - PocketBase
// PDF attachments for a pipeline task (client.taches[status][]) - e.g.
// "Pièces comptables reçues" under Arbitrage. Tasks themselves stay
// embedded JSON on the client record; a task id like 'arb1' is shared by
// every client, so these are keyed by clientId + taskId together, not by
// taskId alone. Mirrors recommendation_documents_routes_pb.tsx.

import { Hono } from 'hono';
import { pb } from './pocketbase_client.tsx';

const app = new Hono();

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo

function toDocMeta(rec: any) {
  return {
    id: rec.id,
    clientId: rec.clientId,
    taskId: rec.taskId,
    filename: rec.filename,
    uploadedAt: rec.uploadedAt,
  };
}

// ─── GET /:clientId/:taskId (list) ─────────────────────────────────────
app.get('/:clientId/:taskId', async (c) => {
  try {
    const clientId = c.req.param('clientId');
    const taskId = c.req.param('taskId');
    const result = await pb.listRecords('task_documents', {
      filter: `clientId = "${clientId}" && taskId = "${taskId}"`,
      sort: '-uploadedAt',
    });
    return c.json({ documents: result.items.map(toDocMeta) });
  } catch (err: any) {
    console.error('Error listing task documents:', err.message);
    return c.json({ documents: [], error: err.message }, 500);
  }
});

// ─── POST /:clientId/:taskId (upload a PDF) ────────────────────────────
app.post('/:clientId/:taskId', async (c) => {
  try {
    const clientId = c.req.param('clientId');
    const taskId = c.req.param('taskId');
    const incoming = await c.req.formData();
    const file = incoming.get('file');

    if (!(file instanceof File)) return c.json({ error: 'Fichier manquant' }, 400);
    if (file.type !== 'application/pdf') return c.json({ error: 'Seuls les fichiers PDF sont acceptés' }, 400);
    if (file.size > MAX_FILE_SIZE) return c.json({ error: 'Fichier trop volumineux (10 Mo max)' }, 400);

    const outgoing = new FormData();
    outgoing.set('clientId', clientId);
    outgoing.set('taskId', taskId);
    outgoing.set('filename', file.name);
    outgoing.set('uploadedAt', new Date().toISOString());
    outgoing.set('file', file, file.name);

    const created = await pb.createRecordWithFile('task_documents', outgoing);
    return c.json(toDocMeta(created), 201);
  } catch (err: any) {
    console.error('Error uploading task document:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// ─── GET /documents/:id/download (stream the PDF bytes) ───────────────
app.get('/documents/:id/download', async (c) => {
  try {
    const id = c.req.param('id');
    const record = await pb.getRecord('task_documents', id);
    if (!record.file) return c.json({ error: 'Fichier introuvable' }, 404);

    const fileRes = await pb.fetchFile('task_documents', id, record.file as string);
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
    console.error('Error downloading task document:', err.message);
    return c.json({ error: err.message }, 404);
  }
});

// ─── DELETE /documents/:id ──────────────────────────────────────────────
app.delete('/documents/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await pb.deleteRecord('task_documents', id);
    return c.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting task document:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

export default app;
