/**
 * ASSISTANT IA D'ORGANISATION - bulle de chat flottante
 *
 * Visible sur toutes les pages (montée une seule fois dans App.tsx, comme
 * BaremeUpdateNotification). Réservé à l'admin : repli immédiat sinon,
 * même garde-fou que partout ailleurs dans le code.
 */

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { apiBaseUrl } from '../../utils/api/info';

const ADMIN_EMAIL = 'violeau.hortense@gmail.com';

interface AIMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatWidgetProps {
  session: any;
}

export function AIChatWidget({ session }: AIChatWidgetProps) {
  const isAdmin = session?.email === ADMIN_EMAIL;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !historyLoaded) {
      loadHistory();
    }
  }, [open, historyLoaded]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, sending]);

  if (!isAdmin) return null;

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
  });

  const loadHistory = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/ai-assistant/messages`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.data.map((m: any) => ({ id: m.id, role: m.role, content: m.content })));
      }
    } catch {
      // Historique indisponible - la bulle reste utilisable vide.
    } finally {
      setHistoryLoaded(true);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch(`${apiBaseUrl}/api/ai-assistant/chat`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.data.reply }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${data.error}` }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "⚠️ Impossible de contacter l'assistant pour le moment." },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Ouvrir l'assistant"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 w-96 h-[600px] max-h-[80vh] bg-white rounded-lg shadow-2xl flex flex-col border border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-lg">
        <span className="text-white font-semibold text-sm">Assistant d'organisation</span>
        <button onClick={() => setOpen(false)} className="text-white hover:bg-white/20 rounded p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-gray-400 text-center mt-8">
            Pose-moi une question, par exemple :<br />
            "Qu'est-ce qui est urgent cette semaine ?"
          </p>
        )}
        {messages.map((m, idx) => (
          <div key={m.id || idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-500 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Réflexion en cours...
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-200 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écris ta question..."
          disabled={sending}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
        />
        <button
          onClick={sendMessage}
          disabled={sending || !input.trim()}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
