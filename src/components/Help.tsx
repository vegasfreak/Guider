
import React from 'react';

interface HelpProps {
  onBack: () => void;
}

export const Help: React.FC<HelpProps> = ({ onBack }) => {
  const guidelines = [
    {
      title: 'Emotional Pulse',
      icon: '📊',
      desc: 'Track your mood daily. Select an emoji that represents your current state and add a note for context. We use this to show you trends over time.',
    },
    {
      title: 'Chat with MindGuide',
      icon: '💬',
      desc: 'Our AI companion is available 24/7. Talk about your day, vent, or ask for coping strategies. It is a safe, non-judgmental space.',
    },
    {
      title: 'Personal Archive',
      icon: '📝',
      desc: 'Use the journal for deeper reflection. We offer different modes: standard reflection, double-entry notes for lectures, and goal tracking.',
    },
    {
      title: 'Peer Support',
      icon: '🤝',
      desc: 'Connect anonymously with other students. You can choose to be a listener or seek support. All conversations are private and ephemeral.',
    },
    {
      title: 'Mindfulness Tools',
      icon: '🧘',
      desc: 'Access quick exercises like box breathing or grounding techniques when you feel overwhelmed or stressed.',
    },
    {
      title: 'Crisis Support',
      icon: '🆘',
      desc: 'If you are in immediate danger, use the crisis support links at the bottom of the dashboard to reach campus security or professional help lines.',
    },
  ];

  return (
    <div className="p-6 space-y-8 bg-slate-50 min-h-full pb-24">
      <div className="flex items-center space-x-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-200 rounded-full transition-colors"
        >
          <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">App Guidelines</h1>
      </div>

      <div className="space-y-4">
        {guidelines.map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-start space-x-4">
            <div className="text-3xl bg-slate-50 w-12 h-12 flex items-center justify-center rounded-2xl flex-shrink-0">
              {item.icon}
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800">{item.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-100">
        <h3 className="font-bold mb-2">Privacy First</h3>
        <p className="text-sm opacity-90 leading-relaxed">
          Your data is encrypted and private. We do not share your personal reflections or chat history with anyone, including university staff.
        </p>
      </div>

      <button 
        onClick={onBack}
        className="w-full bg-white border border-slate-200 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-50 transition-all"
      >
        Got it, thanks!
      </button>
    </div>
  );
};
