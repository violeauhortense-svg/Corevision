// Assistant IA d'organisation - bulle de chat flottante.
// LLM local via Ollama (confidentialité des données clients + pas de coût
// d'API) : aucune donnée ne sort jamais de cette machine. Boucle d'appel
// d'outils manuelle contre les 4 outils de ai_assistant_tools.tsx.

import { Hono } from 'hono';
import { pb } from './pocketbase_client.tsx';
import { AI_ASSISTANT_TOOLS, executeAiTool } from './ai_assistant_tools.tsx';

const app = new Hono();

const OLLAMA_URL = Deno.env.get('OLLAMA_URL') || 'http://localhost:11434';
const OLLAMA_MODEL = Deno.env.get('OLLAMA_MODEL') || 'gemma4:latest';
const MAX_TOOL_ITERATIONS = 5;
const HISTORY_WINDOW = 20;

// Même identité admin que partout ailleurs dans le backend
// (auth_routes_pb_fixed.tsx, dashboard_routes_pb.tsx...).
const ADMIN_EMAIL = 'violeau.hortense@gmail.com';
const PB_URL = Deno.env.get('POCKETBASE_URL') || 'http://localhost:8090';

async function requireAdmin(c: any): Promise<string | null> {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return 'Seule l\'administratrice peut effectuer cette action.';

  try {
    const res = await fetch(`${PB_URL}/api/collections/users/auth-refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token },
    });
    const data = await res.json();
    if (res.status === 401) {
      return 'Votre session a expiré, veuillez vous reconnecter.';
    }
    if (!res.ok || data?.record?.email !== ADMIN_EMAIL) {
      return 'Seule l\'administratrice peut effectuer cette action.';
    }
    return null;
  } catch {
    return 'Impossible de vérifier les droits administrateur.';
  }
}

async function getMemoryNotes(): Promise<string> {
  try {
    const { items } = await pb.listRecords('ai_assistant_preferences', { perPage: 1 });
    return items[0]?.notes || '';
  } catch {
    return '';
  }
}

function buildSystemPrompt(notes: string): string {
  return [
    "Tu es l'assistant personnel d'organisation d'Hortense dans son CRM (EFI-Patrimoine).",
    "Réponds toujours en français, de façon claire et concise.",
    "Quand on te demande ce qui est urgent/à faire, utilise TOUJOURS les outils disponibles pour aller chercher les vraies données avant de répondre - n'invente jamais une tâche, un client ou une échéance.",
    "Classe tes réponses du plus urgent au moins urgent quand c'est pertinent.",
    "Quand une tâche ou recommandation a une information manquante (signalée dans les données), indique-le explicitement avec une suggestion concrète (ex: \"il te manque une échéance pour cette tâche\").",
    notes ? `Notes personnelles sur la façon de travailler d'Hortense (à prendre en compte) : ${notes}` : '',
  ].filter(Boolean).join('\n');
}

// ─── POST /chat ───────────────────────────────────────────────────────
app.post('/chat', async (c) => {
  const adminError = await requireAdmin(c);
  if (adminError) return c.json({ success: false, data: null, error: adminError }, 403);

  try {
    const { message } = await c.req.json();
    if (!message || typeof message !== 'string') {
      return c.json({ success: false, data: null, error: 'Message requis' }, 400);
    }

    const now = new Date().toISOString();
    await pb.createRecord('ai_messages', { role: 'user', content: message, createdAt: now });

    const { items: historyItems } = await pb.listRecords('ai_messages', {
      sort: '-createdAt',
      perPage: HISTORY_WINDOW,
    });
    const history = historyItems
      .slice()
      .reverse()
      .map((m: any) => ({ role: m.role, content: m.content }));

    const notes = await getMemoryNotes();
    const messages: any[] = [{ role: 'system', content: buildSystemPrompt(notes) }, ...history];

    let reply = '';
    let toolsUsed = false;
    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      // Une fois des outils déjà exécutés, le tour suivant force une
      // synthèse finale : pas de `tools` (le modèle ne peut plus
      // redemander un appel d'outil) + une relance explicite. Un modèle
      // local 7-8B, observé en test, peut sinon ignorer silencieusement
      // des résultats pourtant corrects et reposer une question générique
      // au lieu de les utiliser - ce garde-fou le force à conclure.
      const forceSynthesis = toolsUsed;
      if (forceSynthesis) {
        messages.push({
          role: 'user',
          content: "Utilise les résultats ci-dessus pour répondre maintenant à ma question, de façon claire et classée par urgence si pertinent. Ne pose aucune question, ne redemande rien.",
        });
      }

      const res = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages,
          ...(forceSynthesis ? {} : { tools: AI_ASSISTANT_TOOLS }),
          stream: false,
          // gemma4 déverse un raisonnement interne très long dans
          // `thinking` et laisse parfois `content` complètement vide
          // (observé en test, surtout au tour de synthèse finale) - le
          // désactiver corrige ça ET divise le temps de réponse par ~8.
          think: false,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Ollama a répondu ${res.status} : ${errText}`);
      }

      const data = await res.json();
      const assistantMessage = data.message;
      const toolCalls = assistantMessage?.tool_calls;
      console.log(`[ai-assistant] itération ${i} (forceSynthesis=${forceSynthesis}) - done_reason=${data.done_reason} eval_count=${data.eval_count} - tool_calls: ${toolCalls?.map((t: any) => t.function.name).join(', ') || 'aucun'} - content: ${JSON.stringify(assistantMessage?.content)?.slice(0, 300)}`);

      if (!toolCalls || toolCalls.length === 0) {
        reply = assistantMessage?.content || '';
        break;
      }

      messages.push(assistantMessage);
      for (const call of toolCalls) {
        const result = await executeAiTool(call.function.name, call.function.arguments);
        console.log(`[ai-assistant] outil ${call.function.name} -> ${JSON.stringify(result)?.slice(0, 300)}`);
        // tool_call_id est ce qui relie ce résultat à l'appel précis du
        // modèle ci-dessus - sans lui, Ollama ne sait pas que ce message
        // répond à sa propre demande et peut l'ignorer complètement au
        // tour suivant.
        messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
      }
      toolsUsed = true;

      // Dernière itération sans réponse finale - éviter de renvoyer vide.
      if (i === MAX_TOOL_ITERATIONS - 1) {
        reply = "Je n'ai pas réussi à terminer cette demande (trop d'étapes) - essaie de reformuler plus simplement.";
      }
    }

    // Filet de sécurité : un modèle local peut parfois renvoyer un contenu
    // vide sans appel d'outil (fin de conversation dégénérée) - ne jamais
    // laisser ça faire échouer l'enregistrement (content requis et non
    // vide dans ai_messages) ni renvoyer une réponse silencieuse à l'écran.
    if (!reply || !reply.trim()) {
      reply = "Désolé, je n'ai pas réussi à formuler une réponse claire - peux-tu reformuler ta question ?";
    }

    await pb.createRecord('ai_messages', {
      role: 'assistant',
      content: reply,
      createdAt: new Date().toISOString(),
    });

    return c.json({ success: true, data: { reply }, error: null });
  } catch (err: any) {
    console.error('Error in AI assistant chat:', err.message);
    return c.json({
      success: false,
      data: null,
      error: `L'assistant est momentanément indisponible (${err.message}). Vérifie qu'Ollama tourne bien.`,
    }, 500);
  }
});

// ─── GET /messages ──────────────────────────────────────────────────
app.get('/messages', async (c) => {
  const adminError = await requireAdmin(c);
  if (adminError) return c.json({ success: false, data: null, error: adminError }, 403);

  try {
    const { items } = await pb.listRecords('ai_messages', { sort: 'createdAt', perPage: 100 });
    return c.json({ success: true, data: items, error: null });
  } catch (err: any) {
    console.error('Error fetching AI messages:', err.message);
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

export default app;
