
import React, { useState, useRef, useEffect } from 'react';
import { BusinessState, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { getAIResponse } from '../services/gemini';

interface Props {
  state: BusinessState;
  lang: Language;
}

const AIAssistant: React.FC<Props> = ({ state, lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!query.trim() || isLoading) return;

    const userMsg = query.trim();
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    const response = await getAIResponse(userMsg, state);
    setMessages(prev => [...prev, { role: 'ai', text: response || '' }]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm">
                <i className="fa-solid fa-robot"></i>
              </div>
              <h3 className="font-bold">MyShop AI</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.length === 0 && (
              <div className="text-center py-10 px-6">
                <p className="text-slate-400 text-sm">
                  {lang === 'en' 
                    ? "Hi! I'm your MyShop assistant. Ask me anything about your products, sales, or financial health."
                    : "স্বাগতম! আমি আপনার MyShop অ্যাসিস্ট্যান্ট। আপনার পণ্য, বিক্রয় বা আর্থিক অবস্থা সম্পর্কে যেকোনো কিছু জিজ্ঞাসা করুন।"}
                </p>
              </div>
            )}
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`
                  max-w-[85%] px-4 py-2 rounded-2xl text-sm
                  ${m.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'}
                `}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-2">
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-.5s]"></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t">
            <div className="flex gap-2">
              <input 
                type="text" 
                className="flex-1 bg-slate-100 px-4 py-2 rounded-full outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder={t.ai_placeholder}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={handleSend}
                disabled={isLoading}
                className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-16 h-16 rounded-full shadow-xl flex items-center justify-center text-white text-2xl transition-all duration-300 transform
          ${isOpen ? 'bg-slate-800 rotate-180' : 'bg-blue-600 hover:scale-110 active:scale-95'}
        `}
      >
        <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-robot'}`}></i>
      </button>
    </div>
  );
};

export default AIAssistant;
