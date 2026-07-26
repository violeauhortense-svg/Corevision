// Client Ollama local - remplace Mistral AI API
// Interface identique pour compatibilité totale avec les routes existantes

const OLLAMA_URL = Deno.env.get("OLLAMA_URL") ?? "http://localhost:11434";
const OLLAMA_MODEL = Deno.env.get("OLLAMA_MODEL") ?? "mistral:7b-instruct";

console.log(`🤖 GPT Client initialisé → Ollama local (${OLLAMA_URL}, modèle: ${OLLAMA_MODEL})`);

export interface GPTMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GPTResponse {
  choices: { message: { content: string } }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function appelGPT4o(
  messages: GPTMessage[],
  temperature: number = 0.7,
  max_tokens: number = 4000,
  response_format?: { type: "json_object" }
): Promise<string> {
  const payload: Record<string, unknown> = {
    model: OLLAMA_MODEL,
    messages,
    stream: false,
    options: {
      temperature,
      num_predict: max_tokens,
    },
  };

  if (response_format?.type === "json_object") {
    payload.format = "json";
  }

  try {
    console.log(`🤖 Appel Ollama local - Modèle: ${OLLAMA_MODEL}, temp: ${temperature}`);

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(180_000), // 3 min pour les analyses longues
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur Ollama: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content: string = data.message?.content ?? "";

    console.log(`✅ Ollama OK - ${content.length} caractères générés`);
    return content;
  } catch (error) {
    console.error("❌ Erreur Ollama:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function appelGPT4oJSON<T>(
  messages: GPTMessage[],
  temperature: number = 0.7,
  max_tokens: number = 4000
): Promise<T> {
  const responseText = await appelGPT4o(messages, temperature, max_tokens, {
    type: "json_object",
  });

  try {
    return JSON.parse(responseText) as T;
  } catch {
    // Ollama peut ajouter du texte avant/après le JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as T;
      } catch { /* fall through */ }
    }
    console.error("❌ Réponse non-JSON d'Ollama:", responseText.slice(0, 500));
    throw new Error("Impossible de parser la réponse JSON d'Ollama");
  }
}
