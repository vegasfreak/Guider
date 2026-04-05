
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Message } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isTyping: boolean;
  onBack: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isTyping, onBack }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition && !recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        setSpeechError(null);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          // Silently handle no-speech timeout
          setSpeechError('No speech detected. Try again?');
        } else {
          console.error('Speech recognition error:', event.error);
          setSpeechError(`Error: ${event.error}`);
        }
        setIsListening(false);
        
        // Auto-hide error after 3 seconds
        setTimeout(() => setSpeechError(null), 3000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setSpeechError(null);
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to start recognition:', e);
        setIsListening(false);
      }
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    onSendMessage(input);
    setInput('');
  };

  const studentSuggestions = [
    { label: "Procrastination help", prompt: "I'm really struggling to start my essay and I'm procrastinating." },
    { label: "Exam anxiety", prompt: "I have a big exam tomorrow and I'm feeling overwhelmed." },
    { label: "Roommate issues", prompt: "I'm having some trouble with my roommate and don't know how to talk to them." },
    { label: "Imposter syndrome", prompt: "I feel like I don't belong in my program and everyone else is smarter." },
    { label: "Burnout", prompt: "I'm feeling really burnt out and have no energy for my classes." }
  ];

  return (
    <div className="flex flex-col h-full bg-[#FAFBFF] font-sans relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-[100px]" />
      </div>

      <div className="glass sticky top-0 z-20 px-6 py-5 flex items-center justify-between border-b border-white/20">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBack}
            className="w-10 h-10 bg-white/50 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-white transition-all duration-300 shadow-sm border border-white/20 mr-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 font-display">MindGuide AI</h1>
            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest flex items-center">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
              Online Support
            </p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-64">
        <div className="max-w-4xl mx-auto w-full space-y-6">
          <AnimatePresence initial={false}>
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-6 px-2 space-y-6"
            >
              <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 max-w-sm mx-auto">
                <div className="text-5xl mb-4">👋</div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2 font-display">How can I help today?</h2>
                <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                  I'm here to listen and offer practical strategies for student life. What's on your mind?
                </p>
                <div className="flex flex-col space-y-2">
                  {studentSuggestions.map((item, i) => (
                    <motion.button
                      key={item.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => onSendMessage(item.prompt)}
                      className="text-xs text-left bg-slate-50 text-slate-700 px-5 py-4 rounded-2xl border border-slate-200 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white transition-all duration-300 flex items-center justify-between group shadow-sm"
                    >
                      <span className="font-medium">{item.label}</span>
                      <svg className="w-4 h-4 text-slate-300 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] md:max-w-[70%] rounded-[28px] px-6 py-4 text-sm shadow-sm whitespace-pre-wrap leading-relaxed relative ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-xl shadow-indigo-200/50'
                    : msg.isCrisis 
                      ? 'bg-red-50 text-red-800 border-red-200 border rounded-tl-none font-medium'
                      : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none shadow-xl shadow-slate-200/30'
                }`}
              >
                {msg.content}
                <div className={`absolute bottom-[-18px] text-[9px] font-black uppercase tracking-widest text-slate-300 ${msg.role === 'user' ? 'right-2' : 'left-2'}`}>
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white border border-slate-100 rounded-[20px] rounded-tl-none px-5 py-4 shadow-sm">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>

      <div className="fixed bottom-24 left-4 right-4 z-30">
        <AnimatePresence>
          {speechError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="max-w-xs mx-auto mb-2 bg-red-500 text-white text-[10px] font-bold py-1.5 px-3 rounded-full text-center shadow-lg"
            >
              {speechError}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="max-w-2xl mx-auto glass rounded-[32px] p-2 shadow-2xl border border-white/50">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              placeholder={isListening ? "Listening..." : "Message MindGuide..."}
              className={`w-full bg-white/50 border-none rounded-[24px] pl-6 pr-24 py-4 text-sm focus:outline-none focus:ring-0 transition-all placeholder:text-slate-400 ${isListening ? 'ring-2 ring-indigo-500 animate-pulse' : ''}`}
            />
            <div className="absolute right-1.5 flex items-center space-x-1">
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className={`p-3 rounded-2xl transition-all duration-300 ${
                  input.trim() && !isTyping 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 active:scale-90' 
                    : 'bg-slate-100 text-slate-300'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
