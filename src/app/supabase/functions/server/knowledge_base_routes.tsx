import { Hono } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js@2';
import pdfParse from 'npm:pdf-parse@1.1.1';
import * as kv from './kv_store.tsx';

const knowledgeBaseRoutes = new Hono();

// Configuration
const BUCKET_NAME = 'make-cac859af-knowledge-base';

// Créer le bucket s'il n'existe pas
const ensureBucketExists = async (supabase: any) => {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    throw new Error(`Failed to list buckets: ${listError.message}`);
  }
  
  const bucketExists = buckets?.some((bucket: any) => bucket.name === BUCKET_NAME);
  
  if (!bucketExists) {
    const { data: createData, error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: false,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['application/pdf'],
    });
    
    if (createError) {
      // Ignorer l'erreur 409 (bucket déjà existant)
      if (createError.statusCode === '409' || createError.message?.includes('already exists')) {
        console.log('✅ Bucket existe déjà (conflit ignoré)');
      } else {
        throw new Error(`Failed to create bucket: ${createError.message}`);
      }
    }
  }
};

// Helper: Extraire le texte d'un PDF (avec pdf-parse)
async function extractTextFromPDF(pdfBuffer: ArrayBuffer, documentName: string): Promise<string> {
  try {
    const buffer = Buffer.from(pdfBuffer);
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Helper: Chunker le texte
function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const chunks: string[] = [];
  
  // Si le texte est vide, retourner un tableau vide
  if (words.length === 0) {
    return chunks;
  }
  
  // Conversion approximative tokens -> mots (1 token ≈ 0.75 mots en français)
  // chunkSize en tokens -> nombre de mots
  const wordsPerChunk = Math.max(Math.floor(chunkSize * 0.75), 50); // Minimum 50 mots
  const overlapWords = Math.max(Math.floor(overlap * 0.75), 10); // Minimum 10 mots
  
  // S'assurer que l'overlap est plus petit que la taille du chunk
  const effectiveOverlap = Math.min(overlapWords, Math.floor(wordsPerChunk * 0.5));
  
  let i = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + wordsPerChunk).join(' ');
    
    // Ajouter le chunk uniquement s'il n'est pas vide
    if (chunk.trim().length > 0) {
      chunks.push(chunk);
    }
    
    // Avancer l'index (avec overlap)
    i += (wordsPerChunk - effectiveOverlap);
    
    // Éviter les boucles infinies
    if (i <= 0 || wordsPerChunk <= effectiveOverlap) {
      break;
    }
  }
  
  return chunks;
}

// Helper: Générer des embeddings (appel Mistral AI)
async function generateEmbedding(text: string): Promise<number[]> {
  // TODO: Appeler l'API Mistral pour générer l'embedding
  // const response = await fetch('https://api.mistral.ai/v1/embeddings', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${Deno.env.get('MISTRAL_API_KEY')}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     model: 'mistral-embed',
  //     input: text
  //   })
  // });
  
  // Pour l'instant, retourner un vecteur fake de dimension 1024
  return Array(1024).fill(0).map(() => Math.random());
}

// POST /make-server-cac859af/knowledge-base/ingest
knowledgeBaseRoutes.post('/ingest', async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    await ensureBucketExists(supabase);

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const category = formData.get('category') as string;
    const chunkSize = parseInt(formData.get('chunkSize') as string) || 750;
    const overlap = parseInt(formData.get('overlap') as string) || 150;
    const autoClean = (formData.get('autoClean') as string) === 'true';
    const priority = (formData.get('priority') as string) === 'true';

    if (!file || !name || !category) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const fileBuffer = await file.arrayBuffer();
    
    const cleanName = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const fileName = `${Date.now()}-${cleanName}.pdf`;
    
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, fileBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      return c.json({ 
        error: 'Failed to upload PDF',
        details: uploadError.message || String(uploadError)
      }, 500);
    }

    let extractedText = await extractTextFromPDF(fileBuffer, name);
    
    if (autoClean) {
      extractedText = extractedText
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s\-.,;:!?()\[\]{}]/g, '')
        .trim();
    }

    const chunks = chunkText(extractedText, chunkSize, overlap);

    const docId = `doc-${Date.now()}`;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await generateEmbedding(chunk);

      const chunkData = {
        documentId: docId,
        documentName: name,
        category,
        chunkIndex: i,
        chunkText: chunk,
        embedding: embedding,
        createdAt: new Date().toISOString(),
      };

      await kv.set(`kb_chunk_${docId}_${i}`, chunkData);
    }

    const documentData = {
      id: docId,
      name,
      category,
      status: 'completed',
      chunksCount: chunks.length,
      indexedAt: new Date().toISOString(),
      fileSize: file.size,
      priority,
      filePath: fileName,
    };

    await kv.set(`kb_doc_${docId}`, documentData);

    return c.json({
      success: true,
      documentId: docId,
      chunksCount: chunks.length,
      message: 'Document indexé avec succès',
    });

  } catch (error) {
    return c.json({ 
      error: 'Internal server error during PDF ingestion',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// GET /make-server-cac859af/knowledge-base/documents
knowledgeBaseRoutes.get('/documents', async (c) => {
  try {
    const documents = await kv.getByPrefix('kb_doc_');
    return c.json({ documents });
  } catch (error) {
    return c.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// DELETE /make-server-cac859af/knowledge-base/documents/:id
knowledgeBaseRoutes.delete('/documents/:id', async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const documentId = c.req.param('id');

    await kv.deleteChunks(documentId, user.id);
    await kv.deleteDocument(documentId, user.id);

    return c.json({ success: true, message: 'Document deleted' });

  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /make-server-cac859af/knowledge-base/search
knowledgeBaseRoutes.post('/search', async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { query, category, limit = 5 } = await c.req.json();

    if (!query) {
      return c.json({ error: 'Query is required' }, 400);
    }

    const queryEmbedding = await generateEmbedding(query);
    const chunks = await kv.getChunks(user.id);

    if (category) {
      chunks.filter((chunk: any) => chunk.category === category);
    }

    const cosineSimilarity = (a: number[], b: number[]) => {
      const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
      const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
      const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
      return dotProduct / (magA * magB);
    };

    const rankedChunks = chunks
      .map((chunk: any) => ({
        ...chunk,
        similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
      }))
      .sort((a: any, b: any) => b.similarity - a.similarity)
      .slice(0, limit);

    return c.json({ results: rankedChunks });

  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default knowledgeBaseRoutes;