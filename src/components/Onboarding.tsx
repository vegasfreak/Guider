
import React, { useState } from 'react';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const slides = [
    {
      title: "Your Safe Space",
      description: "MindGuide is a reflective companion designed specifically for student life. I'm here to listen, not to judge.",
      icon: "🌱"
    },
    {
      title: "Built-in Tools",
      description: "Log your moods, keep a structured thought journal, or take a 5-minute breathing break when things get heavy.",
      icon: "🛠️"
    },
    {
      title: "Know the Boundaries",
      description: "I am an AI guide, not a therapist. I can help navigate daily stress, but I am not equipped for clinical crisis or diagnosis.",
      icon: "⚖️"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-indigo-600 text-white p-8">
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 max-w-sm mx-auto">
        <div className="text-8xl animate-bounce">{slides[step].icon}</div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{slides[step].title}</h1>
          <p className="text-indigo-100 leading-relaxed">{slides[step].description}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-center space-x-2">
          {slides.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${step === i ? 'w-8 bg-white' : 'w-2 bg-indigo-400'}`} />
          ))}
        </div>
        <div className="flex flex-col space-y-3">
          <button
            onClick={() => step < slides.length - 1 ? setStep(step + 1) : onComplete()}
            className="w-full bg-white text-indigo-600 font-bold py-4 rounded-2xl shadow-xl active:scale-95 transition-all"
          >
            {step === slides.length - 1 ? 'Get Started' : 'Next'}
          </button>
          {step === 0 && (
            <button
              onClick={onComplete}
              className="w-full bg-transparent text-white/70 font-semibold py-2 rounded-2xl hover:text-white transition-all"
            >
              Skip to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
