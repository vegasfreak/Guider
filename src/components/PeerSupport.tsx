
import React, { useState, useEffect, useRef } from 'react';

type PeerStep = 'topic' | 'format' | 'intent' | 'matching' | 'chat' | 'finished' | 'no_users';
type PeerTopic = 'Exam Stress' | 'Loneliness' | 'Burnout' | 'Relationships' | 'General';
type PeerFormat = '1-on-1' | 'Small Group';
type PeerIntent = 'Seek Support' | 'Offer Support';

const ANONYMOUS_NAMES = [
  "BlueFox", "QuietRiver", "Orbit42", "SolarWind", "GreenLeaf", "SilverMist", "LunarPath", "WildFire",
  "MountainPeak", "OceanWave", "DesertSand", "ForestRain", "StarGazer", "NightOwl", "EarlyBird", "SwiftWind",
  "GoldenSun", "SilverMoon", "CrystalLake", "DeepForest", "HighCloud", "StoneWall", "IronGate", "VelvetSky"
];

interface PeerSupportProps {
  onComplete: () => void;
}

export const PeerSupport: React.FC<PeerSupportProps> = ({ onComplete }) => {
  const [step, setStep] = useState<PeerStep>('topic');
  const [topic, setTopic] = useState<PeerTopic>('General');
  const [format, setFormat] = useState<PeerFormat>('1-on-1');
  const [intent, setIntent] = useState<PeerIntent>('Seek Support');
  const [identity] = useState(() => ANONYMOUS_NAMES[Math.floor(Math.random() * ANONYMOUS_NAMES.length)]);
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes
  const [messages, setMessages] = useState<{ id: string; sender: string; text: string; time: number }[]>([]);
  const [input, setInput] = useState('');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [peerIdentity, setPeerIdentity] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step === 'matching') setSessionActive(true);
    if (step === 'finished' || step === 'topic' || step === 'no_users') setSessionActive(false);
  }, [step]);

  useEffect(() => {
    if (!sessionActive) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}`);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: 'join',
        topic,
        format,
        intent,
        identity
      }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'match') {
        setRoomId(data.roomId);
        setPeerIdentity(data.peerIdentity);
        setStep('chat');
        setMessages([
          { id: '1', sender: 'System', text: `Welcome! You've been matched with @${data.peerIdentity} to discuss ${topic}.`, time: Date.now() },
          { id: '2', sender: 'System', text: "Remember: Listen first. Share what's on your mind. Stay respectful.", time: Date.now() }
        ]);
      } else if (data.type === 'no_users') {
        setStep('no_users');
      } else if (data.type === 'chat') {
        setMessages(prev => [...prev, {
          id: data.id,
          sender: data.identity,
          text: data.text,
          time: Date.now()
        }]);
      } else if (data.type === 'peer_left') {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'System',
          text: "Your peer has left the session.",
          time: Date.now()
        }]);
      }
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [sessionActive, topic, format, intent, identity]);

  useEffect(() => {
    if (step === 'chat' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setStep('finished');
    }
  }, [step, timeLeft]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startMatching = () => {
    setStep('matching');
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !roomId || !socketRef.current) return;
    
    socketRef.current.send(JSON.stringify({
      type: 'chat',
      roomId,
      text: input,
      identity
    }));
    
    setInput('');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const PROMPTS = [
    "How has your week been feeling overall?",
    "What's one thing you're finding difficult right now?",
    "I'm just looking for a safe place to share some thoughts.",
    "Would you like to share what's on your mind first?"
  ];

  if (step === 'topic') return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-800">Peer Support</h1>
          <p className="text-sm text-slate-500">Connect anonymously with fellow students.</p>
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Choose a Topic</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(['Exam Stress', 'Loneliness', 'Burnout', 'Relationships', 'General'] as PeerTopic[]).map(t => (
              <button
                key={t}
                onClick={() => { setTopic(t); setStep('format'); }}
                className="w-full p-5 bg-white border border-slate-100 rounded-3xl text-left shadow-sm hover:border-indigo-200 transition-all flex items-center justify-between group"
              >
                <span className="font-semibold text-slate-700">{t}</span>
                <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (step === 'format') return (
    <div className="p-6 space-y-8 animate-in slide-in-from-right-4 duration-300">
      <div className="space-y-2">
        <button onClick={() => setStep('topic')} className="text-indigo-600 text-xs font-bold uppercase tracking-widest">← Back</button>
        <h1 className="text-2xl font-bold text-slate-800">Connection Format</h1>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <button onClick={() => { setFormat('1-on-1'); setStep('intent'); }} className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-indigo-200 transition-all text-left">
          <div className="text-3xl mb-3">👤</div>
          <h3 className="font-bold text-slate-800">1-on-1 Session</h3>
          <p className="text-xs text-slate-500">A private, timed 20-minute support window.</p>
        </button>
        <button onClick={() => { setFormat('Small Group'); setStep('intent'); }} className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-indigo-200 transition-all text-left">
          <div className="text-3xl mb-3">👥</div>
          <h3 className="font-bold text-slate-800">Small Group</h3>
          <p className="text-xs text-slate-500">4-6 peers sharing experiences together.</p>
        </button>
      </div>
    </div>
  );

  if (step === 'intent') return (
    <div className="p-6 space-y-8 animate-in slide-in-from-right-4 duration-300">
      <div className="space-y-2">
        <button onClick={() => setStep('format')} className="text-indigo-600 text-xs font-bold uppercase tracking-widest">← Back</button>
        <h1 className="text-2xl font-bold text-slate-800">Your Role Today</h1>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <button onClick={() => { setIntent('Seek Support'); startMatching(); }} className="p-6 bg-indigo-50 border border-indigo-100 rounded-3xl shadow-sm hover:bg-white hover:border-indigo-200 transition-all text-left">
          <h3 className="font-bold text-indigo-900">I need support</h3>
          <p className="text-xs text-indigo-700 opacity-70">Looking for a safe place to share and be heard.</p>
        </button>
        <button onClick={() => { setIntent('Offer Support'); startMatching(); }} className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl shadow-sm hover:bg-white hover:border-emerald-200 transition-all text-left">
          <h3 className="font-bold text-emerald-900">I can offer support</h3>
          <p className="text-xs text-emerald-700 opacity-70">Ready to listen and offer empathy to a peer.</p>
        </button>
      </div>
    </div>
  );

  if (step === 'matching') return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6 bg-slate-50">
      <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-800">Finding a peer...</h2>
        <p className="text-sm text-slate-500 px-8">Matching you anonymously as <span className="font-bold text-indigo-600">@{identity}</span></p>
        <p className="text-[10px] text-slate-400 animate-pulse">This may take up to 30 seconds</p>
      </div>
      <div className="max-w-xs bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mt-8">
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Safe Space Reminder</p>
        <p className="text-xs text-slate-600 italic">"No advice unless requested. Stay focused on feelings and empathy."</p>
      </div>
    </div>
  );

  if (step === 'no_users') return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-8 bg-slate-50">
      <div className="text-6xl">⏳</div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-800">No Peers Available</h2>
        <p className="text-sm text-slate-500 px-6">We couldn't find anyone to match with right now. Please try again in a few minutes.</p>
      </div>
      <button 
        onClick={onComplete} 
        className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all"
      >
        Return to Home
      </button>
    </div>
  );

  if (step === 'chat') return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-500">?</div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">{format === '1-on-1' ? 'Peer Match' : 'Group Circle'}</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{topic}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {format === '1-on-1' && (
            <div className="bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
              <span className="text-[10px] font-mono font-bold text-amber-700">{formatTime(timeLeft)}</span>
            </div>
          )}
          <button onClick={() => setStep('finished')} className="text-[10px] font-black uppercase text-red-500 tracking-wider">Leave</button>
        </div>
      </div>

      <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <div className="max-w-4xl mx-auto w-full space-y-4">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.sender === identity ? 'justify-end' : m.sender === 'System' ? 'justify-center' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                m.sender === identity ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm' :
                m.sender === 'System' ? 'bg-slate-200/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest px-3 rounded-full' :
                'bg-white text-slate-700 border border-slate-200 rounded-tl-none shadow-sm'
              }`}>
                {m.sender !== identity && m.sender !== 'System' && <p className="text-[9px] font-bold text-indigo-400 mb-0.5 uppercase">@{m.sender}</p>}
                {m.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 pb-20 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto w-full space-y-3">
          <div className="flex overflow-x-auto space-x-2 pb-2 no-scrollbar">
            {PROMPTS.map(p => (
              <button 
                key={p} 
                onClick={() => { setInput(p); }}
                className="flex-none text-[10px] font-bold text-slate-500 bg-slate-50 px-3 py-2 rounded-full border border-slate-200 hover:border-indigo-200 whitespace-nowrap"
              >
                {p}
              </button>
            ))}
          </div>
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded-full pl-5 pr-14 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Type your message anonymously..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="absolute right-1.5 p-2 bg-indigo-600 text-white rounded-full shadow-md">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  if (step === 'finished') return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-8 bg-slate-50">
      <div className="text-6xl">🌱</div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-800">Session Completed</h2>
        <p className="text-sm text-slate-500 px-6">Thank you for being part of a safe peer-to-peer space today.</p>
      </div>
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm w-full space-y-4">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rate the interaction</h3>
        <div className="flex justify-center space-x-4">
          <button onClick={onComplete} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-2xl hover:bg-emerald-50 hover:border-emerald-100 transition-colors">🙏</button>
          <button onClick={onComplete} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-2xl hover:bg-slate-100 transition-colors">😐</button>
          <button onClick={onComplete} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-2xl hover:bg-red-50 hover:border-red-100 transition-colors">🚫</button>
        </div>
        <p className="text-[10px] text-slate-300">Rating or reporting ends the session and returns you home.</p>
      </div>
      <button 
        onClick={onComplete} 
        className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all"
      >
        Return to Home
      </button>
    </div>
  );

  return null;
};
