import React, { useRef, useEffect, useState } from 'react';
import { Message, Role, Language } from '../types';
import { Send, Loader2, Mic, MicOff, Sparkles, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { t } from '../utils/translations';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  lang: Language;
  onSendMessage: (text: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isLoading, lang, onSendMessage }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const T = t[lang];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false; 
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = lang === 'ru' ? 'ru-RU' : 'en-US';

        recognitionRef.current.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(prev => prev ? `${prev} ${transcript}` : transcript);
            setIsListening(false);
        };
        recognitionRef.current.onerror = () => setIsListening(false);
        recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [lang]);

  const toggleListening = () => {
      if (isListening) {
          recognitionRef.current?.stop();
          setIsListening(false);
      } else {
          if (recognitionRef.current) {
              try {
                  recognitionRef.current.lang = lang === 'ru' ? 'ru-RU' : 'en-US';
                  recognitionRef.current.start();
                  setIsListening(true);
              } catch (e) { console.error(e); }
          } else {
              alert(T.chat.audioNotSupported);
          }
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const displayMessages = messages.filter(m => m.role !== Role.SYSTEM);

  return (
    <div className="flex flex-col h-full bg-[#1c1917] relative">
      
      {/* Background Gradient & Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-900 via-[#1c1917] to-[#1c1917] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/noise.png')] pointer-events-none mix-blend-overlay"></div>

      {/* Messages Area */}
      {/* UPDATED: Increased padding-bottom to pb-64 to ensure scrolling never hides content behind input */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-10 z-10 scroll-smooth pb-64">
        {displayMessages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-40">
             <div className="w-20 h-20 rounded-full bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center mb-6 border border-stone-700/50 shadow-2xl">
                <Sparkles size={32} className="text-stone-400" />
             </div>
             <p className="text-2xl font-serif text-stone-300">{T.chat.startTitle}</p>
             <p className="text-base text-stone-600 font-light mt-3">{T.chat.startSubtitle}</p>
          </div>
        )}
        
        {displayMessages.map((msg) => {
          const isUser = msg.role === Role.USER;
          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[90%] md:max-w-[80%] lg:max-w-[70%] group ${
                isUser ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              <div className={`
                relative px-7 py-6 text-[17px] md:text-[18px] leading-8 shadow-lg transition-transform duration-200
                ${isUser 
                  ? 'bg-[#2a2725] text-stone-100 rounded-3xl rounded-tr-none border border-stone-700/60 shadow-black/10' 
                  : 'bg-[#252220] text-stone-200 rounded-3xl rounded-tl-none border border-stone-800/80 shadow-black/20'
                }
              `}>
                <ReactMarkdown 
                   components={{
                      strong: ({node, ...props}) => <span className="font-semibold text-white" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc ml-4 my-3 space-y-2 opacity-90" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal ml-4 my-3 space-y-2 opacity-90" {...props} />,
                      p: ({node, ...props}) => <p className="mb-4 last:mb-0 font-light tracking-wide" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-xl font-serif font-medium mt-5 mb-3 text-indigo-200" {...props} />
                   }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
              <span className={`text-[11px] text-stone-600 mt-2 px-2 font-mono transition-opacity opacity-0 group-hover:opacity-100 ${isUser ? 'text-right' : 'text-left'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex flex-col items-start max-w-[70%] animate-pulse">
             <div className="bg-[#252220] border border-stone-800 rounded-2xl rounded-tl-none px-6 py-4 flex items-center gap-3 shadow-lg">
                <Loader2 size={20} className="animate-spin text-indigo-500" />
                <span className="text-stone-500 text-base font-serif italic tracking-wide">{T.chat.thinking}</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 z-20 bg-gradient-to-t from-[#1c1917] via-[#1c1917]/95 to-transparent pt-12">
        <div className="max-w-4xl mx-auto relative group">
            
            {/* Input Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 via-stone-500/10 to-indigo-500/20 rounded-[32px] blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
            
            <form 
              onSubmit={handleSubmit}
              className="relative flex items-end gap-3 bg-[#171514]/85 backdrop-blur-xl rounded-[30px] p-2.5 shadow-2xl border border-stone-700/50"
            >
              <button
                type="button"
                onClick={toggleListening}
                className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all mb-0.5 ml-0.5 ${
                    isListening 
                    ? 'bg-rose-900/40 text-rose-400 animate-pulse border border-rose-500/30' 
                    : 'text-stone-400 hover:text-stone-100 hover:bg-stone-700/50'
                }`}
                title="Voice Input"
              >
                 {isListening ? <MicOff size={22} /> : <Mic size={22} />}
              </button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={T.chat.placeholder}
                className="w-full bg-transparent text-stone-100 placeholder:text-stone-500/70 p-4 resize-none max-h-[250px] outline-none text-[18px] leading-relaxed font-light scrollbar-hide mb-0.5"
                rows={1}
                disabled={isLoading}
              />
              
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg mb-0.5 mr-0.5 ${
                    !input.trim() || isLoading
                    ? 'bg-stone-800 text-stone-600 cursor-not-allowed'
                    : 'bg-stone-100 hover:bg-white text-stone-900 hover:scale-105 hover:shadow-indigo-500/20'
                }`}
              >
                {isLoading ? <Loader2 size={22} className="animate-spin" /> : <ChevronUp size={28} strokeWidth={2.5} />}
              </button>
            </form>
            
            <div className="text-center mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <p className="text-[11px] text-stone-600 font-serif tracking-widest uppercase">{T.chat.security}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;