import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Navigation } from './components/Navigation';
import { ChatInterface } from './components/ChatInterface';
import { MoodTracker } from './components/MoodTracker';
import { Journal } from './components/Journal';
import { Tools } from './components/Tools';
import { Auth } from './components/Auth';
import { Onboarding } from './components/Onboarding';
import { Settings } from './components/Settings';
import { PeerSupport } from './components/PeerSupport';
import { Help } from './components/Help';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { AppView, Message, MoodEntry, MoodType, JournalEntry, UserStats, UserProfile, Milestone } from './types';
import { getMindGuideResponse } from './services/geminiService';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [messages, setMessages] = useState<Message[]>([]);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [stats, setStats] = useState<UserStats>({ streak: 0, totalCheckIns: 0, lastCheckInDate: null });
  
  // Auth & Onboarding State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);

  // Load from Backend & LocalStorage
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authRes = await fetch('/api/auth/me');
        if (authRes.ok) {
          const user = await authRes.json();
          setCurrentUser({
            username: user.username,
            email: user.email,
            joinedAt: user.joined_at
          });
          // User is authenticated - don't load localStorage data
          // Backend data will be loaded in the next useEffect
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.error("Auth check failed", e);
      }
      
      // User not authenticated - load from localStorage as fallback
      const onboarded = localStorage.getItem('mindguide_onboarded');
      const savedMessages = localStorage.getItem('mindguide_messages');
      const savedStats = localStorage.getItem('mindguide_stats');
      const savedNotifications = localStorage.getItem('mindguide_notifications');
      const savedMoodEntries = localStorage.getItem('mindguide_moodEntries');
      const savedJournalEntries = localStorage.getItem('mindguide_journalEntries');
      const savedMilestones = localStorage.getItem('mindguide_milestones');
      
      if (onboarded) setHasOnboarded(onboarded === 'true');
      if (savedMessages) setMessages(JSON.parse(savedMessages));
      if (savedStats) setStats(JSON.parse(savedStats));
      if (savedNotifications) setNotificationsEnabled(savedNotifications === 'true');
      if (savedMoodEntries) setMoodEntries(JSON.parse(savedMoodEntries));
      if (savedJournalEntries) setJournalEntries(JSON.parse(savedJournalEntries));
      if (savedMilestones) setMilestones(JSON.parse(savedMilestones));
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Fetch user data when logged in
  useEffect(() => {
    if (!currentUser) {
      setIsLoadingUserData(false);
      return;
    }

    setIsLoadingUserData(true);

    const fetchData = async () => {
      try {
        // Fetch Moods
        const moodRes = await fetch('/api/moods');
        let moods: any[] = [];
        
        if (moodRes.ok) {
          moods = await moodRes.json();
          
          setMoodEntries(moods.map((m: any) => ({
            id: m.id.toString(),
            timestamp: m.timestamp,
            mood: m.label as MoodType,
            note: m.note
          })));
        }

        // Fetch Journals
        const journalRes = await fetch('/api/journals');
        let journals: any[] = [];
        
        if (journalRes.ok) {
          journals = await journalRes.json();
          
          setJournalEntries(journals.map((j: any) => {
            try {
              const data = JSON.parse(j.content);
              return {
                id: j.id.toString(),
                timestamp: j.timestamp,
                ...data
              };
            } catch (e) {
              return {
                id: j.id.toString(),
                timestamp: j.timestamp,
                title: 'Legacy Entry',
                type: 'reflection',
                thoughts: j.content
              };
            }
          }));
        }

        // Fetch user stats from database
        const statsRes = await fetch('/api/user-stats');
        if (statsRes.ok) {
          const dbStats = await statsRes.json();
          setStats({
            streak: dbStats.streak,
            totalCheckIns: dbStats.totalCheckIns,
            totalReflections: dbStats.totalReflections,
            lastCheckInDate: dbStats.lastCheckInDate
          });
          
          console.log('User data loaded:', { 
            streak: dbStats.streak, 
            totalCheckIns: dbStats.totalCheckIns,
            totalReflections: dbStats.totalReflections,
            lastCheckInDate: dbStats.lastCheckInDate 
          });
        }
      } catch (e) {
        console.error("Failed to fetch user data", e);
      } finally {
        setIsLoadingUserData(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // Sync non-sensitive state to local storage
  useEffect(() => {
    localStorage.setItem('mindguide_onboarded', String(hasOnboarded));
    localStorage.setItem('mindguide_messages', JSON.stringify(messages));
    localStorage.setItem('mindguide_stats', JSON.stringify(stats));
    localStorage.setItem('mindguide_notifications', String(notificationsEnabled));
    localStorage.setItem('mindguide_moodEntries', JSON.stringify(moodEntries));
    localStorage.setItem('mindguide_journalEntries', JSON.stringify(journalEntries));
    localStorage.setItem('mindguide_milestones', JSON.stringify(milestones));
  }, [hasOnboarded, messages, stats, notificationsEnabled, moodEntries, journalEntries, milestones]);

  // Notification reminder
  useEffect(() => {
    if (!notificationsEnabled || !currentUser) return;

    const checkNotification = () => {
      const today = new Date().toDateString();
      if (stats.lastCheckInDate !== today) {
        if (Notification.permission === 'granted') {
          new Notification('MindGuide Reminder', {
            body: 'Don\'t forget to record your mood or journal entry today!',
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission();
        }
      }
    };

    // Check on load
    checkNotification();

    // Check periodically (e.g., every hour)
    const interval = setInterval(checkNotification, 3600000);
    return () => clearInterval(interval);
  }, [notificationsEnabled, currentUser, stats.lastCheckInDate]);

  const handleAuthComplete = (user: UserProfile) => {
    setCurrentUser(user);
    if (!hasOnboarded) {
      setActiveView('onboarding');
    } else {
      setActiveView('dashboard');
    }
  };

  const handleOnboardingComplete = () => {
    setHasOnboarded(true);
    setActiveView('dashboard');
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setCurrentUser(updatedUser);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    setActiveView('auth');
    setMoodEntries([]);
    setJournalEntries([]);
    setMessages([]);
    // Don't clear stats - they're persisted in the database and will be loaded on next login
    // Keep onboarding flag but clear user data from localStorage
    localStorage.removeItem('mindguide_messages');
    localStorage.removeItem('mindguide_moodEntries');
    localStorage.removeItem('mindguide_journalEntries');
    localStorage.removeItem('mindguide_milestones');
  };

  const handleClearData = async () => {
    try {
      const res = await fetch('/api/data/clear', { method: 'POST' });
      if (res.ok) {
        setMoodEntries([]);
        setJournalEntries([]);
        setMessages([]);
        setStats({ streak: 0, totalCheckIns: 0, lastCheckInDate: null });
        localStorage.removeItem('mindguide_messages');
        localStorage.removeItem('mindguide_stats');
        alert("All data cleared.");
      }
    } catch (e) {
      alert("Failed to clear data.");
    }
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsTyping(true);

    const botResponse = await getMindGuideResponse(newMessages);
    const isCrisis = /suicide|kill|end it|hurt myself|die/i.test(content);

    const modelMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      content: botResponse,
      timestamp: Date.now(),
      isCrisis: isCrisis || /emergency|crisis|helpline/i.test(botResponse),
    };

    setMessages(prev => [...prev, modelMessage]);
    setIsTyping(false);
  };

  const handleAddMood = async (mood: MoodType, note?: string) => {
    const entry: MoodEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      mood: mood,
      note: note
    };
    setMoodEntries(prev => [entry, ...prev]);

    try {
      if (currentUser) {
        const res = await fetch('/api/moods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score: 3, label: mood, note })
        });
        if (!res.ok) {
          console.warn("Failed to save mood to database, but it is saved locally.");
        }
      }
    } catch (e) {
      console.warn("Failed to save mood to database, but it is saved locally.", e);
    }
    
    const today = new Date().toDateString();
    if (stats.lastCheckInDate !== today) {
      setStats(prev => ({
        ...prev,
        totalCheckIns: prev.totalCheckIns + 1,
        streak: prev.lastCheckInDate === new Date(Date.now() - 86400000).toDateString() ? prev.streak + 1 : 1,
        lastCheckInDate: today
      }));
    }
  };

  const handleAddJournal = async (data: Omit<JournalEntry, 'id' | 'timestamp'>) => {
    const entry: JournalEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      ...data
    };
    setJournalEntries(prev => [entry, ...prev]);

    try {
      if (currentUser) {
        const res = await fetch('/api/journals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: JSON.stringify(data) }) // Store full object as JSON string for now
        });
        if (!res.ok) {
          console.warn("Failed to save journal to database, but it is saved locally.");
        }
      }
    } catch (e) {
      console.warn("Failed to save journal to database, but it is saved locally.", e);
    }
    
    const today = new Date().toDateString();
    if (stats.lastCheckInDate !== today) {
      setStats(prev => ({
        ...prev,
        totalCheckIns: prev.totalCheckIns + 1,
        streak: prev.lastCheckInDate === new Date(Date.now() - 86400000).toDateString() ? prev.streak + 1 : 1,
        lastCheckInDate: today
      }));
    } else {
      setStats(prev => ({
        ...prev,
        totalCheckIns: prev.totalCheckIns + 1
      }));
    }
  };

  const handleAddMilestone = (title: string) => {
    const newMilestone: Milestone = {
      id: Date.now().toString(),
      title,
      achieved: false,
      createdAt: Date.now()
    };
    setMilestones(prev => [...prev, newMilestone]);
  };

  const handleToggleMilestone = (id: string) => {
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, achieved: !m.achieved } : m));
  };

  // Auth/Onboarding Check
  if (isLoading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );
  if (!hasOnboarded) return <Onboarding onComplete={handleOnboardingComplete} />;
  if (!currentUser) return <Auth onAuthComplete={handleAuthComplete} />;
  
  // Show loading while fetching user data after login
  if (isLoadingUserData) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="space-y-4 text-center">
        <div className="w-12 h-12 mx-auto border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Loading your data...</p>
      </div>
    </div>
  );

  const renderView = () => {
    switch (activeView) {
      case 'chat':
        return <ChatInterface messages={messages} onSendMessage={handleSendMessage} isTyping={isTyping} onBack={() => setActiveView('dashboard')} />;
      case 'peer-support':
        return <PeerSupport onComplete={() => setActiveView('dashboard')} />;
      case 'help':
        return <Help onBack={() => setActiveView('dashboard')} />;
      case 'privacy-policy':
        return <PrivacyPolicy onBack={() => setActiveView('settings')} />;
      case 'mood':
        return <MoodTracker entries={moodEntries} journals={journalEntries} onAddEntry={handleAddMood} onNavigateToView={setActiveView} />;
      case 'journal':
        return <Journal entries={journalEntries} moodEntries={moodEntries} onAddEntry={handleAddJournal} onNavigateToView={setActiveView} />;
      case 'exercises':
        return (
          <Tools 
            milestones={milestones}
            onAddMilestone={handleAddMilestone}
            onToggleMilestone={handleToggleMilestone}
            onComplete={() => {
              setStats(prev => ({
                ...prev,
                totalCheckIns: prev.totalCheckIns + 1
              }));
            }} 
          />
        );
      case 'settings':
        return (
          <Settings 
            user={currentUser} 
            allData={{ moods: moodEntries, journals: journalEntries, messages }}
            onUpdateUser={handleUpdateUser}
            onLogout={handleLogout} 
            onClearData={handleClearData} 
            onBack={() => setActiveView('dashboard')} 
            onNavigateToHelp={() => setActiveView('help')}
            onNavigateToPrivacyPolicy={() => setActiveView('privacy-policy')}
            notificationsEnabled={notificationsEnabled}
            setNotificationsEnabled={setNotificationsEnabled}
          />
        );
      case 'dashboard':
        return (
          <div className="min-h-full bg-slate-50 selection:bg-indigo-100">
            {/* Decorative Background Elements */}
            <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] -z-10 animate-pulse" />
            <div className="fixed -bottom-20 -left-20 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] -z-10" />
            
            <div className="px-6 py-8 space-y-8 pb-32 relative max-w-5xl mx-auto w-full">
              {/* Header with Greeting and Profile */}
              <header className="flex items-center justify-between">
                <div className="space-y-1">
                  <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl font-black text-slate-900 font-display tracking-tight"
                  >
                    Hi, {currentUser.username}
                    <span className="inline-block ml-2 animate-bounce">👋</span>
                  </motion.h1>
                  <p className="text-sm text-slate-500 font-medium">
                    {new Date().getHours() < 12 ? 'Ready for a fresh start?' : 
                     new Date().getHours() < 18 ? 'How is your afternoon going?' : 'Time to wind down for today.'}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => setActiveView('settings')}
                    className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-slate-600 hover:bg-indigo-600 hover:text-white transition-all duration-500 group shadow-xl shadow-slate-200/50"
                  >
                    <svg className="w-6 h-6 transition-transform duration-700 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
              </header>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-indigo-600 p-6 rounded-[32px] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-700" />
                  <div className="relative z-10 space-y-4">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-4xl font-black block">{stats.streak}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Day Streak</span>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-white p-6 rounded-[32px] text-slate-800 border border-slate-100 shadow-xl shadow-slate-200/50 text-left relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-700" />
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Mood Logs</span>
                      <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-baseline space-x-1">
                        <span className="text-4xl font-black text-indigo-600">{stats.totalCheckIns}</span>
                        <span className="text-xs font-medium text-slate-500">check-ins</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-white p-6 rounded-[32px] text-slate-800 border border-slate-100 shadow-xl shadow-slate-200/50 text-left relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-700" />
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Reflections</span>
                      <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17s4.5 10.747 10 10.747c5.5 0 10-4.998 10-10.747 0-6.002-4.5-10.747-10-10.747z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-baseline space-x-1">
                        <span className="text-4xl font-black text-emerald-600">{stats.totalReflections || journalEntries.length}</span>
                        <span className="text-xs font-medium text-slate-500">entries</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Main Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Primary Support</h2>
                  
                  <motion.button 
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveView('chat')}
                    className="w-full bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:border-indigo-200 transition-all duration-500 group relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center space-x-5">
                        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 group-hover:scale-110 transition-transform duration-500">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <h3 className="font-bold text-slate-900 text-xl font-display">Chat with MindGuide</h3>
                          <p className="text-sm text-slate-500 font-medium">24/7 AI emotional support</p>
                        </div>
                      </div>
                      <div className="w-10 h-10 glass rounded-full flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </motion.button>

                  <div className="grid grid-cols-2 gap-4">
                    <motion.button 
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveView('peer-support')}
                      className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-lg shadow-slate-200/30 hover:border-indigo-200 transition-all group"
                    >
                      <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm font-display">Peer Support</h3>
                      <p className="text-[10px] text-slate-500 font-medium">Connect anonymously</p>
                    </motion.button>

                    <motion.button 
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveView('exercises')}
                      className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-lg shadow-slate-200/30 hover:border-indigo-200 transition-all group"
                    >
                      <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm font-display">Wellness Tools</h3>
                      <p className="text-[10px] text-slate-500 font-medium">10+ exercises</p>
                    </motion.button>
                  </div>
                </div>

              {/* Mood Check-in Section */}
              <section className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 font-display">How are you feeling today?</h3>
                  <button 
                    onClick={() => setActiveView('mood')}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    View all
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { emoji: '😊', label: 'Great', color: 'bg-emerald-50 text-emerald-600', type: 'Great' },
                    { emoji: '🙂', label: 'Good', color: 'bg-blue-50 text-blue-600', type: 'Good' },
                    { emoji: '😐', label: 'Okay', color: 'bg-yellow-50 text-yellow-600', type: 'Okay' },
                    { emoji: '😔', label: 'Down', color: 'bg-orange-50 text-orange-600', type: 'Down' },
                    { emoji: '😫', label: 'Stressed', color: 'bg-red-50 text-red-600', type: 'Stressed' },
                  ].map((item) => (
                    <motion.button
                      key={item.label}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAddMood(item.type as MoodType)}
                      className={`${item.color} p-4 rounded-2xl flex flex-col items-center space-y-2 transition-all shadow-sm border border-transparent hover:border-current/10`}
                    >
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="text-[10px] font-bold">{item.label}</span>
                    </motion.button>
                  ))}
                </div>
              </section>

              {/* Recent Activity Feed */}
              {/* Timeline section removed */}

              {/* Crisis Support - Always visible but not intrusive */}
              <div className="bg-gradient-to-br from-red-50 to-red-100/50 p-4 rounded-2xl border border-red-200 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-red-800 text-sm mb-1">Need immediate support?</h4>
                    <p className="text-xs text-red-600 mb-3">Help is available, completely confidential.</p>
                    <div className="flex space-x-2">
                      <a 
                        href="tel:1199"
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold shadow-md hover:bg-red-700 active:scale-95 transition-all"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        RedCross Counseling
                      </a>
                      <a 
                        href="tel:0722178177"
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-white text-red-600 border border-red-200 rounded-xl text-xs font-semibold shadow-sm hover:bg-red-50 active:scale-95 transition-all"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        Suicide Prevention
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
      case 'help':
        return (
          <div className="p-6 space-y-6">
            <div className="max-w-4xl mx-auto w-full space-y-6">
              <header className="flex items-center space-x-4">
              <button 
                onClick={() => setActiveView('dashboard')}
                className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-slate-900 font-display">Emergency Help</h1>
            </header>
            {/* Help content... */}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#FAFBFF] relative overflow-hidden font-sans text-slate-900">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-100/40 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[-5%] w-[50%] h-[50%] bg-blue-100/30 rounded-full blur-[100px]" />
      </div>

      <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
        {renderView()}
      </main>
      {activeView !== 'settings' && activeView !== 'onboarding' && activeView !== 'auth' && activeView !== 'chat' && (
        <Navigation activeView={activeView} setActiveView={setActiveView} />
      )}
    </div>
  );
};

export default App;