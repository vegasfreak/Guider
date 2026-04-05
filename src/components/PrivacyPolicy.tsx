import React from 'react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <div className="min-h-full bg-slate-50 pb-24">
      <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center sticky top-0 z-10">
        <button onClick={onBack} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-slate-800 ml-4">Privacy Policy</h1>
      </div>

      <div className="max-w-3xl mx-auto w-full p-6 space-y-6 text-slate-700">
        <h2 className="text-2xl font-bold text-slate-900">Your Privacy Matters</h2>
        <p>At MindGuide, we are committed to protecting your privacy and ensuring your mental health journey remains confidential.</p>
        
        <h3 className="text-xl font-semibold text-slate-800">Data We Collect</h3>
        <p>We collect information you provide directly, such as mood entries, journal thoughts, and chat messages. This data is stored locally on your device or securely in our database to provide you with personalized insights.</p>
        
        <h3 className="text-xl font-semibold text-slate-800">How We Use Your Data</h3>
        <p>Your data is used solely to improve your experience within MindGuide, provide AI-driven support, and track your progress over time. We do not sell your personal information to third parties.</p>
        
        <h3 className="text-xl font-semibold text-slate-800">Your Control</h3>
        <p>You have full control over your data. You can export your information or delete it permanently from our servers at any time through the Settings menu.</p>
        
        <h3 className="text-xl font-semibold text-slate-800">Security</h3>
        <p>We implement industry-standard security measures to protect your information. However, no method of transmission over the internet is 100% secure.</p>
        
        <p className="text-sm text-slate-500 pt-4">Last updated: March 18, 2026</p>
      </div>
    </div>
  );
};
