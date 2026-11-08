/**
 * ASSISTANT IA D'ORGANISATION - bulle de chat flottante
 *
 * Visible sur toutes les pages (montée une seule fois dans App.tsx, comme
 * BaremeUpdateNotification). Réservé à l'admin : repli immédiat sinon,
 * même garde-fou que partout ailleurs dans le code.
 */

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, FileDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
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

  // Les emojis utilisés dans les réponses (🔴🟡🟢⚠️...) ne s'affichent pas
  // dans les polices standard de jsPDF (glyphes manquants, espace vide
  // disgracieux) - remplacés par un équivalent texte plutôt que supprimés
  // en silence, pour garder le sens (urgence, alerte...) dans le PDF.
  const EMOJI_LABELS: Record<string, string> = {
    '🔴': '[URGENT] ', '🟡': '[IMPORTANT] ', '🟢': '[A PLANIFIER] ',
    '⚠️': '[ATTENTION] ', '⚠': '[ATTENTION] ', '✅': '[OK] ',
    '💶': '[PAIEMENT] ', '✍️': '[SIGNATURE] ', '📧': '[MAIL] ', '📅': '[AGENDA] ',
  };
  function stripEmoji(text: string): string {
    let out = text;
    for (const [emoji, label] of Object.entries(EMOJI_LABELS)) {
      out = out.split(emoji).join(label);
    }
    // Reste (emoji non mappés) : retiré plutôt que laissé en glyphe vide.
    return out.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '');
  }

  // Rend une ligne avec gestion du **gras** inline - découpe en segments
  // normal/gras, mesure chaque mot pour passer à la ligne suivante au bon
  // endroit (jsPDF ne gère pas nativement le mélange de styles sur une
  // même ligne de texte justifié).
  function renderInlineBold(
    doc: jsPDF,
    text: string,
    x: number,
    yStart: number,
    maxWidth: number,
    lineHeight: number,
    pageHeight: number,
    marginX: number
  ): number {
    let y = yStart;
    let cursorX = x;
    const segments = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);

    for (const segment of segments) {
      const isBold = segment.startsWith('**') && segment.endsWith('**');
      const words = (isBold ? segment.slice(2, -2) : segment).split(/(\s+)/).filter((w) => w !== '');
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');

      for (const word of words) {
        const wordWidth = doc.getTextWidth(word);
        if (cursorX + wordWidth > marginX + maxWidth && word.trim() !== '') {
          y += lineHeight;
          cursorX = x;
          if (y > pageHeight - 20) {
            doc.addPage();
            y = 20;
          }
        }
        doc.text(word, cursorX, y);
        cursorX += wordWidth;
      }
    }
    doc.setFont('helvetica', 'normal');
    return y + lineHeight;
  }

  // Génération directement dans le navigateur (jsPDF) - pas besoin de
  // passer par le backend, la réponse est déjà dans la bulle. Interprète
  // le markdown léger que le modèle produit (titres ###, gras **texte**,
  // listes à puces) au lieu de l'afficher tel quel avec ses symboles.
  const downloadAsPdf = (content: string) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const marginX = 15;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - marginX * 2;
    let y = 20;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Assistant d'organisation - EFI-Patrimoine", marginX, y);
    doc.setFont('helvetica', 'normal');
    y += 7;
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(new Date().toLocaleString('fr-FR'), marginX, y);
    doc.setTextColor(0);
    y += 10;

    doc.setFontSize(11);
    const rawLines = stripEmoji(content).split('\n');

    for (const rawLine of rawLines) {
      const line = rawLine.trim();

      if (y > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }

      if (line === '') {
        y += 4;
        continue;
      }

      // Ligne horizontale (---, ***) : séparateur visuel plutôt que du
      // texte brut.
      if (/^[-*_]{3,}$/.test(line)) {
        doc.setDrawColor(200);
        doc.line(marginX, y - 2, marginX + maxWidth, y - 2);
        y += 4;
        continue;
      }

      const headerMatch = line.match(/^#{1,6}\s+(.*)$/);
      if (headerMatch) {
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        const wrapped = doc.splitTextToSize(headerMatch[1], maxWidth);
        for (const w of wrapped) {
          doc.text(w, marginX, y);
          y += 6.5;
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        y += 1.5;
        continue;
      }

      const bulletMatch = line.match(/^[-*]\s+(.*)$/);
      const numberedMatch = line.match(/^(\d+[.)])\s+(.*)$/);
      if (bulletMatch) {
        doc.text('•', marginX, y);
        y = renderInlineBold(doc, bulletMatch[1], marginX + 5, y, maxWidth - 5, 6, pageHeight, marginX + 5);
        continue;
      }
      if (numberedMatch) {
        doc.text(numberedMatch[1], marginX, y);
        y = renderInlineBold(doc, numberedMatch[2], marginX + 8, y, maxWidth - 8, 6, pageHeight, marginX + 8);
        continue;
      }

      y = renderInlineBold(doc, line, marginX, y, maxWidth, 6, pageHeight, marginX);
    }

    doc.save(`assistant-reponse-${Date.now()}.pdf`);
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
          <div key={m.id || idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {m.content}
            </div>
            {m.role === 'assistant' && (
              <button
                onClick={() => downloadAsPdf(m.content)}
                className="mt-1 flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600"
              >
                <FileDown className="w-3.5 h-3.5" />
                Télécharger en PDF
              </button>
            )}
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
