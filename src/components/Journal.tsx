
import React, { useState } from 'react';
import { JournalEntry, JournalType, AppView, MoodType, MoodEntry } from '../types';

interface JournalProps {
  entries: JournalEntry[];
  moodEntries: MoodEntry[];
  onAddEntry: (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => void;
  onNavigateToView: (view: AppView) => void;
}

const PROMPTS = [
  "What am I most grateful for today?",
  "What is one small goal I reached today?",
  "Describe a situation where I felt out of my comfort zone.",
  "What is one thing I would change about my reaction today?",
  "What does 'success' look like to me this week?",
  "What made me smile in my last lecture?",
  "How can I be kinder to myself tomorrow?"
];

export const Journal: React.FC<JournalProps> = ({ entries, moodEntries, onAddEntry, onNavigateToView }) => {
  console.log('Journal entries:', entries);
  console.log('Mood entries:', moodEntries);
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<JournalType>('reflection');
  const [formData, setFormData] = useState<Partial<JournalEntry>>({
    title: '',
    type: 'reflection',
    situation: '',
    thoughts: '',
    feelings: '',
    mood: undefined,
    reactions: '',
    leftNotes: '',
    rightReactions: '',
    goalAchieved: false,
    progressNotes: '',
    promptUsed: ''
  });

  const handlePrompt = () => {
    const randomPrompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    setFormData({ ...formData, promptUsed: randomPrompt, title: randomPrompt });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddEntry({
      ...formData as Omit<JournalEntry, 'id' | 'timestamp'>,
      type: activeTab
    });
    setFormData({ title: '', situation: '', thoughts: '', feelings: '', mood: undefined, reactions: '', leftNotes: '', rightReactions: '', goalAchieved: false, progressNotes: '', promptUsed: '' });
    setIsAdding(false);
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full pb-24">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Personal Archive</h1>
          <p className="text-slate-500 text-sm">Growth through reflection.</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-indigo-600 text-white p-4 rounded-3xl shadow-xl shadow-indigo-100 active:scale-95 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      {isAdding ? (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          {/* Header & Prompts */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Mood</label>
              <div className="flex justify-between gap-2">
                {[
                  { emoji: '😊', label: 'Great', color: 'bg-emerald-50 text-emerald-600', type: 'Great' },
                  { emoji: '🙂', label: 'Good', color: 'bg-blue-50 text-blue-600', type: 'Good' },
                  { emoji: '😐', label: 'Okay', color: 'bg-yellow-50 text-yellow-600', type: 'Okay' },
                  { emoji: '😔', label: 'Down', color: 'bg-orange-50 text-orange-600', type: 'Down' },
                  { emoji: '😫', label: 'Stressed', color: 'bg-red-50 text-red-600', type: 'Stressed' },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setFormData({ ...formData, mood: item.type as MoodType })}
                    className={`flex-1 p-3 rounded-2xl flex flex-col items-center space-y-1 transition-all border-2 ${
                      formData.mood === item.type ? 'border-indigo-500 bg-indigo-50/30' : 'border-transparent bg-slate-50'
                    }`}
                  >
                    <span className="text-xl">{item.emoji}</span>
                    <span className="text-[8px] font-black uppercase">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entry Details</label>
                <button 
                  type="button" 
                  onClick={handlePrompt}
                  className="text-xs font-semibold text-indigo-600 flex items-center bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors"
                >
                  💡 Need a prompt?
                </button>
              </div>
              <input
                required
                className="w-full text-xl font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none"
                placeholder="Give your entry a title..."
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
              {formData.promptUsed && (
                <p className="text-xs text-indigo-500 italic bg-indigo-50/50 p-2 rounded-lg">Prompt: {formData.promptUsed}</p>
              )}
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex bg-slate-200 p-1 rounded-2xl">
            {(['reflection', 'double-entry', 'goal'] as JournalType[]).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${
                  activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab === 'double-entry' ? 'Notes' : tab}
              </button>
            ))}
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 min-h-[300px]">
            {activeTab === 'reflection' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="bg-slate-50 p-4 rounded-2xl">
                   <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Emotional Zone</h3>
                   <input
                    className="w-full bg-transparent border-none text-sm placeholder:text-slate-400 focus:ring-0"
                    placeholder="Describe your current emotional state..."
                    value={formData.feelings}
                    onChange={e => setFormData({...formData, feelings: e.target.value})}
                  />
                </div>
                <textarea
                  className="w-full h-40 bg-slate-50 p-4 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="What happened? Write your reflections here..."
                  value={formData.thoughts}
                  onChange={e => setFormData({...formData, thoughts: e.target.value})}
                />
              </div>
            )}

            {activeTab === 'double-entry' && (
              <div className="grid grid-cols-2 gap-4 h-[350px] animate-in fade-in duration-300">
                <div className="flex flex-col space-y-2">
                  <h3 className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider text-center">Observations / Facts</h3>
                  <textarea
                    className="flex-1 bg-slate-50 p-3 rounded-2xl text-xs leading-relaxed focus:ring-1 focus:ring-indigo-300 outline-none resize-none"
                    placeholder="Lectures, readings, core facts..."
                    value={formData.leftNotes}
                    onChange={e => setFormData({...formData, leftNotes: e.target.value})}
                  />
                </div>
                <div className="flex flex-col space-y-2 border-l border-slate-100 pl-4">
                  <h3 className="text-[10px] font-bold text-teal-500 uppercase tracking-wider text-center">Personal Reaction</h3>
                  <textarea
                    className="flex-1 bg-slate-50 p-3 rounded-2xl text-xs leading-relaxed focus:ring-1 focus:ring-teal-300 outline-none resize-none"
                    placeholder="My thoughts, questions, disagreements..."
                    value={formData.rightReactions}
                    onChange={e => setFormData({...formData, rightReactions: e.target.value})}
                  />
                </div>
              </div>
            )}

            {activeTab === 'goal' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center space-x-4 bg-green-50 p-4 rounded-2xl border border-green-100">
                  <input 
                    type="checkbox" 
                    className="w-6 h-6 rounded-lg text-green-600 focus:ring-green-500 border-green-200"
                    checked={formData.goalAchieved}
                    onChange={e => setFormData({...formData, goalAchieved: e.target.checked})}
                  />
                  <div>
                    <h3 className="text-sm font-bold text-green-800">Mission Accomplished?</h3>
                    <p className="text-[10px] text-green-600">Check this if you reached your milestone today!</p>
                  </div>
                </div>
                <textarea
                  className="w-full h-48 bg-slate-50 p-4 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Track your progress, next steps, and build confidence by listing small wins..."
                  value={formData.progressNotes}
                  onChange={e => setFormData({...formData, progressNotes: e.target.value})}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="flex-1 py-4 text-slate-500 font-bold hover:bg-white rounded-3xl transition-all"
            >
              Discard
            </button>
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white font-bold py-4 rounded-3xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
            >
              Save Archive
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Archive History</h3>
          </div>
          {entries.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Your story begins with a single word.</p>
            </div>
          ) : (
            entries.sort((a, b) => b.timestamp - a.timestamp).map(item => (
              <div key={`${item.id}-${item.timestamp}`} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-300">
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                          item.type === 'goal' ? 'bg-green-100 text-green-700' : 
                          item.type === 'double-entry' ? 'bg-indigo-100 text-indigo-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {item.type === 'double-entry' ? 'Note' : item.type}
                        </span>
                        <span className="text-[10px] text-slate-300 font-bold uppercase">{new Date(item.timestamp).toLocaleDateString()}</span>
                      </div>
                      <h2 className="text-lg font-bold text-slate-800 leading-tight">
                        {item.title}
                      </h2>
                    </div>
                  </div>

                  {item.type === 'reflection' && (
                    <div className="space-y-3">
                      {item.feelings && <p className="text-xs bg-indigo-50 text-indigo-700 inline-block px-3 py-1 rounded-full font-medium">Feels like: {item.feelings}</p>}
                      <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">{item.thoughts}</p>
                    </div>
                  )}

                  {item.type === 'double-entry' && (
                    <div className="grid grid-cols-2 gap-3 border-t border-slate-50 pt-4">
                      <div className="space-y-1">
                         <h4 className="text-[9px] font-black text-indigo-400 uppercase">Observations</h4>
                         <p className="text-[11px] text-slate-500 italic line-clamp-3">{item.leftNotes}</p>
                      </div>
                      <div className="space-y-1 border-l border-slate-50 pl-3">
                         <h4 className="text-[9px] font-black text-teal-400 uppercase">Reactions</h4>
                         <p className="text-[11px] text-slate-600 font-medium line-clamp-3">{item.rightReactions}</p>
                      </div>
                    </div>
                  )}

                  {item.type === 'goal' && (
                    <div className="space-y-3">
                      <div className={`flex items-center space-x-3 p-3 rounded-2xl ${item.goalAchieved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${item.goalAchieved ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                          {item.goalAchieved ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : '⏳'}
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest">{item.goalAchieved ? 'Milestone Reached' : 'Work in Progress'}</span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed italic line-clamp-3">"{item.progressNotes}"</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  </div>
  );
};
