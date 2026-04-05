
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type ToolId = 'breathing' | 'grounding' | 'academic' | 'sleep' | 'gratitude' | 'affirmations' | 'detox' | 'hydration' | 'stretches' | 'worry';

import { Milestone } from '../types';

interface ToolsProps {
  milestones: Milestone[];
  onAddMilestone: (title: string) => void;
  onToggleMilestone: (id: string) => void;
  onComplete?: () => void;
}

export const Tools: React.FC<ToolsProps> = ({ milestones, onAddMilestone, onToggleMilestone, onComplete }) => {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [groundingStep, setGroundingStep] = useState(5);
  const [breathingPhase, setBreathingPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Hold' | 'Ready'>('Ready');
  const [pomodoroMode, setPomodoroMode] = useState<'Focus' | 'Break'>('Focus');
  const [pomodoroTotal, setPomodoroTotal] = useState(25 * 60);
  const [waterCount, setWaterCount] = useState(0);
  const [worryText, setWorryText] = useState('');
  const [isWorryTrashed, setIsWorryTrashed] = useState(false);
  const [newMilestone, setNewMilestone] = useState('');

  // Breathing Logic
  useEffect(() => {
    let interval: any;
    if (activeTool === 'breathing' && isRunning) {
      let count = 0;
      setBreathingPhase('Inhale');
      interval = setInterval(() => {
        count = (count + 1) % 16;
        if (count < 4) setBreathingPhase('Inhale');
        else if (count < 8) setBreathingPhase('Hold');
        else if (count < 12) setBreathingPhase('Exhale');
        else setBreathingPhase('Hold');
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTool, isRunning]);

  // Timer Logic (Pomodoro & Detox)
  useEffect(() => {
    let interval: any;
    if (isRunning && (activeTool === 'academic' || activeTool === 'detox') && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0 && isRunning) {
      setIsRunning(false);
      if (activeTool === 'academic') {
        if (pomodoroMode === 'Focus') {
          setPomodoroMode('Break');
          setTimer(5 * 60);
          setPomodoroTotal(5 * 60);
        } else {
          setPomodoroMode('Focus');
          setTimer(25 * 60);
          setPomodoroTotal(25 * 60);
        }
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timer, activeTool, pomodoroMode]);

  const startBreathing = () => {
    setIsRunning(true);
    setActiveTool('breathing');
  };

  const startPomodoro = () => {
    setTimer(25 * 60);
    setPomodoroTotal(25 * 60);
    setPomodoroMode('Focus');
    setIsRunning(true);
    setActiveTool('academic');
  };

  const startDetox = (mins: number) => {
    setTimer(mins * 60);
    setPomodoroTotal(mins * 60);
    setIsRunning(true);
    setActiveTool('detox');
  };

  const tools = [
    {
      id: 'breathing' as ToolId,
      title: 'Box Breathing',
      desc: 'Calm your nervous system in minutes.',
      icon: '🌬️',
      color: 'bg-teal-50 text-teal-700 border-teal-100',
      action: startBreathing
    },
    {
      id: 'grounding' as ToolId,
      title: '5-4-3-2-1 Grounding',
      desc: 'Stay present when feeling overwhelmed.',
      icon: '🧘',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      action: () => { setActiveTool('grounding'); setGroundingStep(5); }
    },
    {
      id: 'academic' as ToolId,
      title: 'Focus Pomodoro',
      desc: '25m focus, 5m break for study.',
      icon: '📚',
      color: 'bg-orange-50 text-orange-700 border-orange-100',
      action: startPomodoro
    },
    {
      id: 'sleep' as ToolId,
      title: 'Body Scan',
      desc: 'Guided relaxation for better sleep.',
      icon: '🌙',
      color: 'bg-purple-50 text-purple-700 border-purple-100',
      action: () => setActiveTool('sleep')
    },
    {
      id: 'gratitude' as ToolId,
      title: 'Gratitude Jar',
      desc: 'Shift focus to the positive.',
      icon: '✨',
      color: 'bg-amber-50 text-amber-700 border-amber-100',
      action: () => setActiveTool('gratitude')
    },
    {
      id: 'affirmations' as ToolId,
      title: 'Affirmations',
      desc: 'Daily positive self-talk cards.',
      icon: '💎',
      color: 'bg-pink-50 text-pink-700 border-pink-100',
      action: () => setActiveTool('affirmations')
    },
    {
      id: 'detox' as ToolId,
      title: 'Digital Detox',
      desc: 'Step away from the screen.',
      icon: '📵',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      action: () => startDetox(15)
    },
    {
      id: 'hydration' as ToolId,
      title: 'Hydration Check',
      desc: 'Track your daily water intake.',
      icon: '💧',
      color: 'bg-blue-50 text-blue-700 border-blue-100',
      action: () => setActiveTool('hydration')
    },
    {
      id: 'stretches' as ToolId,
      title: 'Desk Stretches',
      desc: 'Quick moves to relieve tension.',
      icon: '🤸',
      color: 'bg-rose-50 text-rose-700 border-rose-100',
      action: () => setActiveTool('stretches')
    },
    {
      id: 'worry' as ToolId,
      title: 'Worry Dump',
      desc: 'Write it down and let it go.',
      icon: '🗑️',
      color: 'bg-slate-100 text-slate-700 border-slate-200',
      action: () => { setActiveTool('worry'); setIsWorryTrashed(false); setWorryText(''); }
    }
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (activeTool === 'affirmations') {
    const affirmations = [
      "I am capable of handling whatever comes my way.",
      "My worth is not defined by my productivity.",
      "I am allowed to take breaks and rest.",
      "I am growing and learning every single day.",
      "I deserve kindness, especially from myself.",
      "My feelings are valid and important.",
      "I have the strength to overcome challenges.",
      "I am enough exactly as I am."
    ];
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-pink-50 space-y-8">
        <motion.button 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={() => setActiveTool(null)}
          className="absolute top-6 left-6 text-pink-700 font-bold uppercase tracking-widest text-xs"
        >
          ← Back
        </motion.button>
        <div className="w-full max-w-sm space-y-6">
          <h2 className="text-2xl font-bold text-pink-900 text-center">Daily Affirmations</h2>
          <div className="grid grid-cols-1 gap-4">
            {affirmations.slice(0, 5).map((text, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-3xl shadow-sm border border-pink-100 text-pink-800 font-medium"
              >
                {text}
              </motion.div>
            ))}
          </div>
          <button
            onClick={() => {
              onComplete?.();
              setActiveTool(null);
            }}
            className="w-full bg-pink-600 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all"
          >
            I feel inspired
          </button>
        </div>
      </div>
    );
  }

  if (activeTool === 'detox') {
    const progress = (timer / pomodoroTotal) * 100;
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-emerald-50 space-y-12">
        <motion.button 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={() => { setActiveTool(null); setIsRunning(false); }}
          className="absolute top-6 left-6 text-emerald-700 font-bold uppercase tracking-widest text-xs"
        >
          ← Back
        </motion.button>
        <div className="text-center space-y-4">
          <div className="text-6xl animate-pulse">📵</div>
          <h2 className="text-3xl font-black text-emerald-900">Digital Detox</h2>
          <p className="text-emerald-700 text-sm max-w-xs">Put your phone down and look away from the screen.</p>
        </div>
        <div className="relative w-64 h-64 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-emerald-100" />
            <motion.circle 
              cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="8" fill="transparent" 
              strokeDasharray={754}
              initial={{ strokeDashoffset: 754 }}
              animate={{ strokeDashoffset: 754 - (754 * progress) / 100 }}
              className="text-emerald-500"
            />
          </svg>
          <div className="text-5xl font-black text-emerald-900 absolute">{formatTime(timer)}</div>
        </div>
        <button 
          onClick={() => { 
            onComplete?.();
            setActiveTool(null); 
            setIsRunning(false); 
          }}
          className="bg-emerald-600 text-white px-12 py-4 rounded-2xl font-bold shadow-lg"
        >
          End Detox
        </button>
      </div>
    );
  }

  if (activeTool === 'hydration') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-blue-50 space-y-8">
        <motion.button 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={() => setActiveTool(null)}
          className="absolute top-6 left-6 text-blue-700 font-bold uppercase tracking-widest text-xs"
        >
          ← Back
        </motion.button>
        <div className="w-full max-w-sm bg-white rounded-[40px] p-8 shadow-xl border border-blue-100 space-y-8 text-center">
          <div className="text-6xl">💧</div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-blue-900">Hydration Tracker</h2>
            <p className="text-slate-500 text-sm">Aim for 8 glasses a day.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {[1,2,3,4,5,6,7,8].map(i => (
              <button 
                key={i}
                onClick={() => setWaterCount(i)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all ${
                  i <= waterCount ? 'bg-blue-500 text-white shadow-md scale-110' : 'bg-blue-50 text-blue-300'
                }`}
              >
                {i <= waterCount ? '🥛' : '💧'}
              </button>
            ))}
          </div>
          <p className="text-blue-600 font-bold">{waterCount} / 8 glasses logged</p>
          <button
            onClick={() => {
              onComplete?.();
              setActiveTool(null);
            }}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all"
          >
            Done for now
          </button>
        </div>
      </div>
    );
  }

  if (activeTool === 'stretches') {
    const stretches = [
      { title: 'Neck Rolls', desc: 'Gently roll your head in a circle.', icon: '🔄' },
      { title: 'Shoulder Shrugs', desc: 'Lift shoulders to ears and drop.', icon: '⬆️' },
      { title: 'Wrist Stretch', desc: 'Extend arm and pull fingers back.', icon: '🖐️' },
      { title: 'Spinal Twist', desc: 'Twist torso while seated.', icon: '↪️' }
    ];
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-rose-50 space-y-8">
        <motion.button 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={() => setActiveTool(null)}
          className="absolute top-6 left-6 text-rose-700 font-bold uppercase tracking-widest text-xs"
        >
          ← Back
        </motion.button>
        <div className="w-full max-w-sm space-y-6">
          <h2 className="text-2xl font-bold text-rose-900 text-center">Quick Desk Stretches</h2>
          <div className="space-y-4">
            {stretches.map((s, i) => (
              <div key={i} className="bg-white p-5 rounded-3xl shadow-sm border border-rose-100 flex items-center space-x-4">
                <span className="text-3xl">{s.icon}</span>
                <div>
                  <h4 className="font-bold text-rose-800 text-sm">{s.title}</h4>
                  <p className="text-xs text-slate-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              onComplete?.();
              setActiveTool(null);
            }}
            className="w-full bg-rose-600 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all"
          >
            I feel refreshed
          </button>
        </div>
      </div>
    );
  }

  if (activeTool === 'worry') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-100 space-y-8">
        <motion.button 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={() => setActiveTool(null)}
          className="absolute top-6 left-6 text-slate-700 font-bold uppercase tracking-widest text-xs"
        >
          ← Back
        </motion.button>
        <div className="w-full max-w-sm bg-white rounded-[40px] p-8 shadow-xl border border-slate-200 space-y-6 text-center overflow-hidden">
          <AnimatePresence mode="wait">
            {!isWorryTrashed ? (
              <motion.div 
                key="input"
                initial={{ opacity: 1 }}
                exit={{ y: 400, opacity: 0, rotate: 10 }}
                transition={{ duration: 0.8, ease: "backIn" }}
                className="space-y-6"
              >
                <div className="text-6xl">📝</div>
                <h2 className="text-2xl font-bold text-slate-900">Worry Dump</h2>
                <p className="text-slate-500 text-sm">Write down what's bothering you, then trash it.</p>
                <textarea 
                  value={worryText}
                  onChange={(e) => setWorryText(e.target.value)}
                  placeholder="I'm worried about..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 min-h-[120px]"
                />
                <button
                  disabled={!worryText}
                  onClick={() => setIsWorryTrashed(true)}
                  className="w-full bg-slate-800 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all disabled:opacity-50"
                >
                  Trash this worry
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="success"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-6 py-8"
              >
                <div className="text-6xl">✨</div>
                <h2 className="text-2xl font-bold text-slate-900">It's gone.</h2>
                <p className="text-slate-500 text-sm">You've acknowledged it. Now let's focus on the present.</p>
                <button
                  onClick={() => {
                    onComplete?.();
                    setActiveTool(null);
                  }}
                  className="w-full bg-slate-800 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all"
                >
                  Back to Tools
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  if (activeTool === 'breathing') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-teal-50 space-y-12 overflow-hidden">
        <motion.button 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={() => { setActiveTool(null); setIsRunning(false); }}
          className="absolute top-6 left-6 text-teal-700 font-bold uppercase tracking-widest text-xs"
        >
          ← Back
        </motion.button>

        <div className="relative flex items-center justify-center w-64 h-64">
          <AnimatePresence mode="wait">
            <motion.div
              key={breathingPhase}
              initial={{ scale: breathingPhase === 'Inhale' ? 0.5 : breathingPhase === 'Exhale' ? 1.2 : 1 }}
              animate={{ 
                scale: breathingPhase === 'Inhale' ? 1.2 : breathingPhase === 'Exhale' ? 0.5 : 1,
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ duration: 4, ease: "easeInOut" }}
              className="absolute inset-0 bg-teal-200/40 rounded-full blur-2xl"
            />
          </AnimatePresence>
          
          <motion.div
            animate={{ 
              scale: breathingPhase === 'Inhale' ? 1.2 : breathingPhase === 'Exhale' ? 0.5 : 1 
            }}
            transition={{ duration: 4, ease: "easeInOut" }}
            className="w-48 h-48 rounded-full bg-white border-4 border-teal-200 flex flex-col items-center justify-center shadow-xl z-10"
          >
            <motion.span 
              key={breathingPhase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-black text-teal-800 uppercase tracking-widest"
            >
              {breathingPhase}
            </motion.span>
          </motion.div>
        </div>

        <div className="text-center space-y-2 max-w-xs">
          <h2 className="text-xl font-bold text-teal-900">Box Breathing</h2>
          <p className="text-sm text-teal-700">Follow the circle. Inhale, hold, exhale, hold. Each for 4 seconds.</p>
        </div>

        <button
          onClick={() => {
            onComplete?.();
            setActiveTool(null); 
            setIsRunning(false);
          }}
          className="bg-teal-600 text-white px-10 py-4 rounded-3xl font-bold shadow-lg active:scale-95 transition-all"
        >
          Finish Session
        </button>
      </div>
    );
  }

  if (activeTool === 'grounding') {
    const steps = [
      { count: 5, label: 'See', desc: 'Look around and name 5 things you can see.', icon: '👁️' },
      { count: 4, label: 'Touch', desc: 'Name 4 things you can feel (e.g., your clothes, the chair).', icon: '🖐️' },
      { count: 3, label: 'Hear', desc: 'Listen for 3 distinct sounds around you.', icon: '👂' },
      { count: 2, label: 'Smell', desc: 'Try to identify 2 different smells.', icon: '👃' },
      { count: 1, label: 'Taste', desc: 'Focus on 1 thing you can taste right now.', icon: '👅' },
    ];
    const current = steps.find(s => s.count === groundingStep)!;

    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-indigo-50 space-y-8">
        <motion.button 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={() => setActiveTool(null)}
          className="absolute top-6 left-6 text-indigo-700 font-bold uppercase tracking-widest text-xs"
        >
          ← Back
        </motion.button>

        <div className="w-full max-w-sm bg-white rounded-[40px] p-8 shadow-xl border border-indigo-100 space-y-8 text-center">
          <motion.div 
            key={groundingStep}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-6"
          >
            <div className="text-6xl">{current.icon}</div>
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-indigo-900">{current.count}</h2>
              <p className="text-xl font-bold text-indigo-600 uppercase tracking-widest">{current.label}</p>
            </div>
            <p className="text-slate-600 leading-relaxed">{current.desc}</p>
          </motion.div>

          <div className="flex justify-center space-x-2">
            {[5,4,3,2,1].map(s => (
              <div key={s} className={`h-1.5 w-8 rounded-full transition-all ${s >= groundingStep ? 'bg-indigo-600' : 'bg-indigo-100'}`} />
            ))}
          </div>

          <button
            onClick={() => {
              if (groundingStep > 1) setGroundingStep(groundingStep - 1);
              else {
                onComplete?.();
                setActiveTool(null);
              }
            }}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all"
          >
            {groundingStep > 1 ? 'Next Step' : 'I feel better'}
          </button>
        </div>
      </div>
    );
  }

  if (activeTool === 'academic') {
    const progress = (timer / pomodoroTotal) * 100;
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-orange-50 space-y-12">
        <motion.button 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={() => { setActiveTool(null); setIsRunning(false); }}
          className="absolute top-6 left-6 text-orange-700 font-bold uppercase tracking-widest text-xs"
        >
          ← Back
        </motion.button>

        <div className="relative w-64 h-64 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-orange-100" />
            <motion.circle 
              cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="8" fill="transparent" 
              strokeDasharray={754}
              initial={{ strokeDashoffset: 754 }}
              animate={{ strokeDashoffset: 754 - (754 * progress) / 100 }}
              className="text-orange-500"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-5xl font-black text-orange-900">{formatTime(timer)}</span>
            <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">{pomodoroMode} Mode</span>
          </div>
        </div>

        <div className="flex space-x-4">
          <button 
            onClick={() => setIsRunning(!isRunning)}
            className="bg-white text-orange-700 px-8 py-4 rounded-2xl font-bold shadow-md border border-orange-100"
          >
            {isRunning ? 'Pause' : 'Resume'}
          </button>
          <button 
            onClick={() => { 
              onComplete?.();
              setActiveTool(null); 
              setIsRunning(false); 
            }}
            className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-bold shadow-md"
          >
            Stop
          </button>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm max-w-xs text-center">
          <p className="text-xs text-slate-600 italic">"You don't have to be perfect. You just have to be present."</p>
        </div>
      </div>
    );
  }

  if (activeTool === 'sleep') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-purple-900 text-white space-y-12">
        <motion.button 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={() => setActiveTool(null)}
          className="absolute top-6 left-6 text-purple-300 font-bold uppercase tracking-widest text-xs"
        >
          ← Back
        </motion.button>

        <div className="space-y-8 text-center max-w-sm">
          <motion.div 
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="text-8xl"
          >
            ✨
          </motion.div>
          <h2 className="text-3xl font-bold">Body Scan</h2>
          <div className="space-y-4 text-purple-200 leading-relaxed">
            <p>Close your eyes and take a deep breath.</p>
            <p>Focus on your toes... relax them.</p>
            <p>Move to your ankles... your calves... your knees.</p>
            <p>Feel the tension melting away from your body.</p>
          </div>
        </div>

        <button
          onClick={() => {
            onComplete?.();
            setActiveTool(null);
          }}
          className="bg-purple-700 text-white px-12 py-4 rounded-full font-bold shadow-xl border border-purple-600"
        >
          I'm Relaxed
        </button>
      </div>
    );
  }

  if (activeTool === 'gratitude') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-amber-50 space-y-8">
        <motion.button 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={() => setActiveTool(null)}
          className="absolute top-6 left-6 text-amber-700 font-bold uppercase tracking-widest text-xs"
        >
          ← Back
        </motion.button>

        <div className="w-full max-w-sm bg-white rounded-[40px] p-8 shadow-xl border border-amber-100 space-y-6 text-center">
          <div className="text-6xl">🏺</div>
          <h2 className="text-2xl font-bold text-amber-900">Gratitude Jar</h2>
          <p className="text-slate-600 text-sm">Write down 3 things you're grateful for today, no matter how small.</p>
          
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <input 
                key={i}
                type="text" 
                placeholder={`Something good #${i}...`}
                className="w-full bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            ))}
          </div>

          <button
            onClick={() => {
              onComplete?.();
              setActiveTool(null);
            }}
            className="w-full bg-amber-600 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all"
          >
            Save to Jar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-slate-50 min-h-full pb-24">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Wellness Tools</h1>
          <p className="text-slate-500 font-medium">Interactive exercises for your mental well-being.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tools.map((tool, index) => (
          <motion.button
            key={tool.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={tool.action}
            className={`flex items-center p-6 rounded-[32px] border-2 text-left transition-all hover:shadow-md active:scale-[0.98] ${tool.color} border-transparent hover:border-current/10`}
          >
            <span className="text-4xl mr-6 bg-white/50 w-16 h-16 flex items-center justify-center rounded-2xl shadow-sm">{tool.icon}</span>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-0.5">{tool.title}</h3>
              <p className="text-xs opacity-70 font-medium">{tool.desc}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm mt-8 space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">💡</div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Daily Wisdom</h3>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {[
            { title: "Focus", text: "One small task for 25 minutes is enough." },
            { title: "Self-Worth", text: "Your value is not defined by your grades." },
            { title: "Movement", text: "A 5-minute walk can reset your brain." }
          ].map((tip, i) => (
            <div key={i} className="flex items-start space-x-4 p-4 bg-slate-50 rounded-2xl">
              <span className="text-indigo-500 font-black text-lg">0{i+1}</span>
              <div>
                <p className="font-bold text-slate-800 text-sm">{tip.title}</p>
                <p className="text-xs text-slate-500">{tip.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm mt-8 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">🏆</div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Milestones</h3>
          </div>
          <div className="flex space-x-2">
            <input 
              type="text" 
              value={newMilestone}
              onChange={(e) => setNewMilestone(e.target.value)}
              placeholder="New milestone..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <button 
              onClick={() => { if (newMilestone) { onAddMilestone(newMilestone); setNewMilestone(''); } }}
              className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-all"
            >
              Add
            </button>
          </div>
          <div className="space-y-3">
            {milestones.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <span className={`text-sm ${m.achieved ? 'line-through text-slate-400' : 'text-slate-800'}`}>{m.title}</span>
                <button 
                  onClick={() => onToggleMilestone(m.id)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${m.achieved ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}
                >
                  {m.achieved && '✓'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};
