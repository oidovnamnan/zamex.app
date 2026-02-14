'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Bot, User, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/store';

interface Message { role: 'user' | 'assistant'; content: string; }

export default function ChatbotPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Сайн байна уу${user?.firstName ? `, ${user.firstName}` : ''}! Би zamex.app AI туслах. Юу асуухыг хүсч байна?\n\n📦 Барааны байршил\n🛡️ Даатгал\n↩️ Буцаалт\n💰 Тээврийн зардал` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const convId = useRef(`conv_${Date.now()}`);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const { data } = await api.post('/ai/chat', { message: msg, conversationId: convId.current });
      setMessages(prev => [...prev, { role: 'assistant', content: data.data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Уучлаарай, алдаа гарлаа. Дахин оролдоно уу.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <header className="bg-white border-b border-surface-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()} className="btn-ghost btn-sm -ml-2"><ArrowLeft className="w-4.5 h-4.5" /></button>
          <Sparkles className="w-5 h-5 text-zamex-600" />
          <h1 className="font-semibold text-surface-900">AI Туслах</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-zamex-100 text-zamex-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
              msg.role === 'user' ? 'bg-zamex-600 text-white rounded-br-md' : 'bg-white border border-surface-100 text-surface-800 rounded-bl-md'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zamex-100 text-zamex-600 flex items-center justify-center"><Bot className="w-4 h-4" /></div>
            <div className="bg-white border border-surface-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1"><div className="w-2 h-2 bg-surface-300 rounded-full animate-bounce" /><div className="w-2 h-2 bg-surface-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} /><div className="w-2 h-2 bg-surface-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} /></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-0 bg-white border-t border-surface-100 p-3">
        <div className="max-w-2xl mx-auto flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Мессеж бичих..." className="input flex-1" autoFocus />
          <button onClick={send} disabled={!input.trim() || loading}
            className="btn-primary px-4"><Send className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}
