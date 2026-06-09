import { useEffect, useRef, useState } from 'react';
import DashboardShell from '../components/DashboardShell';
import { STUDENT_NAV } from '../lib/studentNav';
import api from '../lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Explain the quadratic formula with an example',
  "What is Newton's second law of motion?",
  'How does photosynthesis work?',
  'Difference between mitosis and meiosis',
  'What are covalent and ionic bonds?',
  'Explain recursion in programming',
];

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="w-7 h-7 rounded-full bg-[#eaedff] flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-[14px] text-[#070235]"
          style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
      </div>
      <div className="bg-white border border-[#e4e2e6] rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#6366f1] opacity-60"
              style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[78%] bg-[#070235] text-white px-4 py-3 rounded-2xl rounded-br-sm text-sm leading-relaxed whitespace-pre-wrap shadow-sm">
          {msg.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="w-7 h-7 rounded-full bg-[#eaedff] flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-[14px] text-[#070235]"
          style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
      </div>
      <div className="max-w-[78%] bg-white border border-[#e4e2e6] rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-[#131b2e] leading-relaxed whitespace-pre-wrap shadow-sm">
        {msg.content}
      </div>
    </div>
  );
}

export default function StudentAIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const next: Message[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(next);
    setInput('');
    setError('');
    setLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = '36px';
    }

    try {
      const { data } = await api.post('/ai/chat', { messages: next });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Something went wrong. Please try again.');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <DashboardShell navItems={STUDENT_NAV}>
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30%           { transform: translateY(-5px); }
        }
      `}</style>

      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-5rem)]">

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-[#eaedff] flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px] text-[#070235]"
              style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <div>
            <h1 className="font-semibold text-[#070235] text-lg leading-none">AI Tutor</h1>
            <p className="text-xs text-[#787680] mt-0.5">Powered by Grok · Ask anything about your subjects</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => { setMessages([]); setError(''); }}
              className="ml-auto flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#505f76] border border-[#c8c5d0] rounded-lg hover:bg-[#f2f3ff] transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">refresh</span>
              New chat
            </button>
          )}
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto min-h-0 rounded-xl bg-[#fafbff] border border-[#e4e2e6] p-4">

          {isEmpty && (
            <div className="flex flex-col items-center justify-center h-full text-center pb-4">
              <div className="w-14 h-14 rounded-2xl bg-[#eaedff] flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[28px] text-[#070235]"
                  style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
              </div>
              <h2 className="font-semibold text-[#131b2e] text-base mb-1">How can I help you today?</h2>
              <p className="text-sm text-[#787680] mb-6 max-w-xs">
                Ask me anything about your subjects — I'll explain it step by step.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left px-3.5 py-2.5 bg-white border border-[#e4e2e6] rounded-xl text-xs text-[#374151] hover:border-[#070235] hover:bg-[#f2f3ff] transition-all leading-snug"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}

          {loading && <TypingIndicator />}

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-[#fff0f0] border border-[#ffdad6] rounded-xl text-xs text-[#ba1a1a] mb-4">
              <span className="material-symbols-outlined text-[15px]">error</span>
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 mt-3">
          <div className="flex items-end gap-2 bg-white border border-[#c8c5d0] rounded-xl px-3 py-2 focus-within:border-[#070235] focus-within:ring-2 focus-within:ring-[#070235]/10 transition-all">
            <textarea
              ref={(el) => {
                (inputRef as any).current = el;
                (textareaRef as any).current = el;
              }}
              rows={1}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask your doubt… (Enter to send, Shift+Enter for new line)"
              disabled={loading}
              className="flex-1 resize-none bg-transparent text-sm text-[#131b2e] placeholder-[#94a3b8] focus:outline-none py-1.5 min-h-[36px] max-h-[120px] disabled:opacity-50"
              style={{ height: '36px' }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="shrink-0 w-8 h-8 rounded-lg bg-[#070235] text-white flex items-center justify-center hover:bg-[#1e1b4b] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading
                ? <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                : <span className="material-symbols-outlined text-[16px]">send</span>
              }
            </button>
          </div>
          <p className="text-[10px] text-[#94a3b8] text-center mt-1.5">
            Powered by Grok · AI can make mistakes — always verify with your teacher
          </p>
        </div>

      </div>
    </DashboardShell>
  );
}
