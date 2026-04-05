
export interface Milestone {
  id: string;
  title: string;
  achieved: boolean;
  createdAt: number;
}

export type MoodType = 'Great' | 'Good' | 'Okay' | 'Down' | 'Stressed';

export interface MoodEntry {
  id: string;
  timestamp: number;
  mood: MoodType;
  note?: string;
}

export type JournalType = 'reflection' | 'double-entry' | 'goal' | 'creative';

export interface JournalEntry {
  id: string;
  timestamp: number;
  title: string;
  type: JournalType;
  mood?: MoodType;
  // Standard/Reflection fields
  situation?: string;
  thoughts?: string;
  feelings?: string;
  reactions?: string;
  // Double-entry fields
  leftNotes?: string; // Facts/Observations
  rightReactions?: string; // Personal Reflections
  // Goal fields
  goalAchieved?: boolean;
  progressNotes?: string;
  // Creative/Multimodal
  multimediaUrl?: string; // Placeholder for audio/image
  multimediaType?: 'audio' | 'image';
  promptUsed?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  isCrisis?: boolean;
}

export interface UserStats {
  streak: number;
  totalCheckIns: number;
  totalReflections?: number;
  lastCheckInDate: string | number | null;
}

export interface UserProfile {
  username: string;
  email: string;
  joinedAt: number;
}

export type AppView = 'chat' | 'mood' | 'journal' | 'exercises' | 'dashboard' | 'settings' | 'onboarding' | 'auth' | 'peer-support' | 'help' | 'privacy-policy';
