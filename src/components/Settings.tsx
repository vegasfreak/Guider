
import React, { useState } from 'react';
import { UserProfile, MoodEntry, JournalEntry, Message } from '../types';

interface SettingsProps {
  user: UserProfile | null;
  allData: {
    moods: MoodEntry[];
    journals: JournalEntry[];
    messages: Message[];
  };
  onUpdateUser: (updatedUser: UserProfile) => void;
  onLogout: () => void;
  onClearData: () => void;
  onBack: () => void;
  onNavigateToHelp: () => void;
  onNavigateToPrivacyPolicy: () => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
}

export const Settings: React.FC<SettingsProps> = ({ user, allData, onUpdateUser, onLogout, onClearData, onBack, onNavigateToHelp, onNavigateToPrivacyPolicy, notificationsEnabled, setNotificationsEnabled }) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || '');

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (user && newUsername.trim()) {
      onUpdateUser({ ...user, username: newUsername.trim() });
      setIsEditingProfile(false);
    }
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify({
      profile: user,
      ...allData,
      exportedAt: new Date().toISOString()
    }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `mindguide_data_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="min-h-full bg-slate-50 pb-24">
      <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-slate-800">Settings</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full p-6 space-y-8 animate-in fade-in duration-300">
        {/* Profile Section */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative group">
            <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-xl">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <button 
              onClick={() => setIsEditingProfile(true)}
              className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md border border-slate-100 text-indigo-600 hover:scale-110 transition-transform"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
          
          {isEditingProfile ? (
            <form onSubmit={handleUpdateProfile} className="w-full max-w-xs space-y-3">
              <input
                type="text"
                autoFocus
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-center text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Enter new username"
              />
              <div className="flex space-x-2">
                <button 
                  type="button" 
                  onClick={() => { setIsEditingProfile(false); setNewUsername(user?.username || ''); }}
                  className="flex-1 px-4 py-2 text-xs font-semibold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          ) : (
            <div>
              <h2 className="text-xl font-bold text-slate-800">{user?.username}</h2>
              <p className="text-sm text-slate-400">{user?.email}</p>
              <p className="text-[10px] text-slate-300 mt-1 uppercase tracking-wider">Joined {new Date(user?.joinedAt || 0).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        {/* Preferences Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Preferences</h3>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-50">
              <div className="flex items-center space-x-3">
                <span className="text-indigo-500">🔔</span>
                <span className="text-sm font-medium text-slate-700">Push Notifications</span>
              </div>
              <button 
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative ${notificationsEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center space-x-3">
                <span className="text-indigo-500">🌓</span>
                <span className="text-sm font-medium text-slate-700">App Appearance</span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">System</span>
            </button>
          </div>
        </div>

        {/* Data Management Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Data & Privacy</h3>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <button 
              onClick={handleExportData}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 border-b border-slate-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-indigo-500">📤</span>
                <span className="text-sm font-medium text-slate-700">Export All Data (JSON)</span>
              </div>
              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </button>
            <button 
              onClick={onClearData} 
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-red-50 group transition-colors"
            >
              <div className="flex items-center space-x-3 text-red-600">
                <span className="">🗑️</span>
                <span className="text-sm font-medium">Reset All App Data</span>
              </div>
              <span className="text-[10px] text-red-300 font-bold uppercase tracking-wider">Permanent</span>
            </button>
          </div>
        </div>

        {/* Support Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Support</h3>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <button 
              onClick={onNavigateToHelp}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 border-b border-slate-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-indigo-500">❓</span>
                <span className="text-sm font-medium text-slate-700">Help & Guidelines</span>
              </div>
              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            <button 
              onClick={onNavigateToPrivacyPolicy}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 border-b border-slate-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-indigo-500">📜</span>
                <span className="text-sm font-medium text-slate-700">Privacy Policy</span>
              </div>
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </button>
            <div className="w-full px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-indigo-500">ℹ️</span>
                <span className="text-sm font-medium text-slate-700">App Version</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">1.0.0</span>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full py-4 rounded-2xl border-2 border-slate-200 text-slate-500 font-bold hover:bg-slate-100 hover:border-slate-300 transition-all active:scale-95"
        >
          Sign Out
        </button>

        <div className="text-center pb-8">
          <p className="text-[10px] text-slate-300 uppercase tracking-[0.2em] font-bold">MindGuide • Student Edition</p>
        </div>
      </div>
    </div>
  );
};
