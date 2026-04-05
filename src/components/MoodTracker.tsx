import React, { useState, useMemo } from 'react';
import { MoodType, MoodEntry, AppView, JournalEntry } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MoodTrackerProps {
  entries: MoodEntry[];
  journals: JournalEntry[];
  onAddEntry: (mood: MoodType, note?: string) => void;
  onNavigateToView: (view: AppView) => void;
}

const moods: { type: MoodType; emoji: string; color: string; bgColor: string }[] = [
  { type: 'Great', emoji: '😊', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  { type: 'Good', emoji: '🙂', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { type: 'Okay', emoji: '😐', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { type: 'Down', emoji: '😔', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { type: 'Stressed', emoji: '😫', color: 'text-red-600', bgColor: 'bg-red-100' },
];

const STRATEGIES: Record<MoodType, { title: string; desc: string; icon: string; actionView?: AppView }[]> = {
  'Great': [
    { title: 'Gratitude Reflection', desc: 'Write down what made today great.', icon: '📝', actionView: 'journal' },
    { title: 'Share the Energy', desc: 'Reach out to a friend or classmate.', icon: '🤝' }
  ],
  'Good': [
    { title: 'Productivity Sprint', desc: 'Use this momentum for a 25m focus block.', icon: '📚', actionView: 'exercises' },
    { title: 'Healthy Habit', desc: 'Drink a glass of water or stretch.', icon: '💧' }
  ],
  'Okay': [
    { title: 'Mindful Walk', desc: 'A 5-minute walk can clear your head.', icon: '🚶' },
    { title: 'Check Your Goals', desc: 'Review your success archive.', icon: '🎯', actionView: 'journal' }
  ],
  'Down': [
    { title: 'Box Breathing', desc: 'Calm your heart rate in 5 minutes.', icon: '🌬️', actionView: 'exercises' },
    { title: 'Grounding (5-4-3-2-1)', desc: 'Focus on your immediate surroundings.', icon: '🧘', actionView: 'exercises' }
  ],
  'Stressed': [
    { title: 'Acute Grounding', desc: 'Hold an ice cube or splash cold water.', icon: '🧊' },
    { title: 'Contact Support', desc: 'Call campus safety or the lifeline.', icon: '☎️' }
  ]
};

export const MoodTracker: React.FC<MoodTrackerProps> = ({ entries, journals, onAddEntry, onNavigateToView }) => {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [note, setNote] = useState('');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  const moodToValue = (m: MoodType): number => {
    switch(m) {
      case 'Great': return 5;
      case 'Good': return 4;
      case 'Okay': return 3;
      case 'Down': return 2;
      case 'Stressed': return 1;
      default: return 3;
    }
  };

  const valueToMood = (value: number): MoodType => {
    switch(value) {
      case 5: return 'Great';
      case 4: return 'Good';
      case 3: return 'Okay';
      case 2: return 'Down';
      case 1: return 'Stressed';
      default: return 'Okay';
    }
  };

  // Process all history with mood data for graphing
  const allHistory = useMemo(() => {
    const moodEntries = entries.map(e => ({ 
      ...e, 
      entryType: 'mood' as const,
      value: moodToValue(e.mood)
    }));
    
    const journalEntries = journals.map(j => ({ 
      ...j, 
      entryType: 'journal' as const 
    }));

    return [...moodEntries, ...journalEntries]
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [entries, journals]);

  // Generate chart data based on selected time range
  const chartData = useMemo(() => {
    const now = Date.now();
    let filteredEntries = [...entries];
    
    switch(timeRange) {
      case 'week':
        filteredEntries = entries.filter(e => e.timestamp > now - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        filteredEntries = entries.filter(e => e.timestamp > now - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        // Keep all entries
        break;
    }

    // Sort by date ascending for the chart
    return filteredEntries
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(e => ({
        date: new Date(e.timestamp).toLocaleDateString(),
        fullDate: new Date(e.timestamp).toLocaleDateString([], { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        value: moodToValue(e.mood),
        mood: e.mood,
        note: e.note
      }));
  }, [entries, timeRange]);

  // Calculate mood statistics
  const moodStats = useMemo(() => {
    if (entries.length === 0) return null;

    const average = entries.reduce((sum, e) => sum + moodToValue(e.mood), 0) / entries.length;
    const mostFrequent = entries
      .map(e => e.mood)
      .sort((a, b) => 
        entries.filter(e => e.mood === a).length - 
        entries.filter(e => e.mood === b).length
      )
      .pop();

    const trend = entries.length >= 2 
      ? entries[0].timestamp > entries[entries.length - 1].timestamp
        ? entries.slice(0, Math.min(5, entries.length))
        : entries.slice(-5)
      : entries;

    const trendDirection = trend.length >= 2
      ? moodToValue(trend[trend.length - 1].mood) - moodToValue(trend[0].mood)
      : 0;

    return {
      average: average.toFixed(1),
      mostFrequent,
      totalCheckIns: entries.length,
      trendDirection: trendDirection > 0 ? 'improving' : trendDirection < 0 ? 'declining' : 'stable'
    };
  }, [entries]);

  const handleSave = () => {
    if (selectedMood) {
      onAddEntry(selectedMood, note);
      setSelectedMood(null);
      setNote('');
    }
  };

  return (
    <div className="p-6 space-y-8 bg-slate-50 min-h-full pb-24">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Emotional Pulse</h1>
          <p className="text-slate-500 text-sm font-medium">How are you feeling right now?</p>
        </div>

        {/* Mood Selection Card */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <div className="grid grid-cols-5 gap-2">
            {moods.map((m) => (
              <button
                key={m.type}
                onClick={() => setSelectedMood(m.type)}
                className={`flex flex-col items-center p-2 rounded-2xl transition-all duration-200 ${
                  selectedMood === m.type ? `bg-slate-50 ring-2 ring-indigo-500 scale-105` : 'hover:bg-slate-50'
                }`}
              >
                <span className="text-4xl mb-2">
                  {m.type === 'Great' ? '😊' : 
                   m.type === 'Good' ? '🙂' : 
                   m.type === 'Okay' ? '😐' : 
                   m.type === 'Down' ? '😔' : '😫'}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-wider ${
                  m.type === 'Great' ? 'text-emerald-500' :
                  m.type === 'Good' ? 'text-blue-500' :
                  m.type === 'Okay' ? 'text-yellow-500' :
                  m.type === 'Down' ? 'text-orange-500' : 'text-red-500'
                }`}>
                  {m.type}
                </span>
              </button>
            ))}
          </div>

          {selectedMood && (
            <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <textarea
                  placeholder="What's contributing to this feeling?"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] transition-all"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <button
                  onClick={handleSave}
                  className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Save Check-in
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Weekly Trends Section */}
        {entries.length > 0 && (
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
            <h2 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] mb-8">Weekly Trends</h2>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#cbd5e1', fontWeight: 600}}
                    tickFormatter={(val) => {
                      const date = new Date(val);
                      return date.toLocaleDateString([], { weekday: 'short' });
                    }}
                    height={40}
                  />
                  <YAxis 
                    hide={true}
                    domain={[0.5, 5.5]} 
                  />
                  <Tooltip 
                    contentStyle={{
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      padding: '12px'
                    }}
                    formatter={(value: number) => [valueToMood(value), 'Mood']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#4f46e5" 
                    strokeWidth={4} 
                    dot={{fill: '#4f46e5', r: 4, strokeWidth: 2, stroke: '#fff'}} 
                    activeDot={{r: 6, fill: '#4f46e5', stroke: 'white', strokeWidth: 2}}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        {/* Check-in History */}
        <div className="space-y-6">
          <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] px-1">
            Check-in History
          </h3>

          {entries.length === 0 ? (
            <div className="bg-white p-8 rounded-[40px] border border-dashed border-slate-200 text-center">
              <p className="text-xs text-slate-400">No logs yet. Start by checking in above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.sort((a, b) => b.timestamp - a.timestamp).map((item, idx) => (
                <div 
                  key={`${item.id}-${item.timestamp}-${idx}`} 
                  className="bg-white p-6 rounded-[40px] shadow-sm border border-slate-100 flex items-center space-x-6 animate-in fade-in duration-300"
                >
                  <div className="text-4xl">
                    {moods.find(m => m.type === item.mood)?.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className={`font-bold text-base ${
                        item.mood === 'Great' ? 'text-emerald-500' :
                        item.mood === 'Good' ? 'text-blue-500' :
                        item.mood === 'Okay' ? 'text-yellow-500' :
                        item.mood === 'Down' ? 'text-orange-500' : 'text-red-500'
                      }`}>
                        {item.mood}
                      </span>
                      <span className="text-[11px] font-bold text-slate-300">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </span>
                    </div>
                    
                    {item.note && (
                      <p className="text-sm text-slate-600 italic leading-relaxed">
                        "{item.note}"
                      </p>
                    )}
                    
                    <p className="text-[10px] text-slate-300 font-bold mt-2">
                      {new Date(item.timestamp).toLocaleDateString([], { 
                        day: '2-digit',
                        month: '2-digit', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
