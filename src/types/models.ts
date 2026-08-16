import { DistractionSession, SessionEvent, InterventionEvent, Reflection } from './session';

export interface Goal {
  id: string;
  title: string;
  description?: string;
  isActive: boolean;
  color?: string;
  createdAt: string;
}

export interface DistractingSite {
  id: string;
  domain: string;
  name: string;
  isEnabled: boolean;
  category?: 'social' | 'video' | 'news' | 'gaming' | 'other';
  createdAt: string;
}

export interface PastSelfMessage {
  id: string;
  message: string;
  relatedGoalId?: string;
  relatedSiteId?: string;
  sourceSessionId?: string;
  sourceOverrunSeconds?: number;
  sourceDate?: string;
  isActive: boolean;
  timesShown: number;
  timesExited: number;
  createdAt: string;
}

export interface UserSettings {
  userName: string;
  reopenObservationWindowSeconds: number; // e.g. 60s
  bypassIntervalSeconds: number; // e.g. 180s (3m) between ladder stages
  allowSingleExtension: boolean;
  audioFeedbackEnabled: boolean;
  darkTheme: boolean;
  onboardingCompleted: boolean;
}

export interface StorageData {
  goals: Goal[];
  sites: DistractingSite[];
  pastSelfMessages: PastSelfMessage[];
  activeSession: DistractionSession | null;
  sessions: DistractionSession[];
  events: SessionEvent[];
  interventions: InterventionEvent[];
  reflections: Reflection[];
  settings: UserSettings;
  outbox: Array<{
    id: string;
    type: 'SESSION' | 'EVENT' | 'INTERVENTION' | 'REFLECTION';
    data: any;
    queuedAt: string;
  }>;
}

export interface AnalyticsSummary {
  totalPlannedSeconds: number;
  totalActualSeconds: number;
  averageOverrunSeconds: number;
  totalSessions: number;
  intentionAdherenceRate: number;
  stoppedAtFirstReminderRate: number;
  repeatedBypassRate: number;
  interventionEffectiveness: Record<
    string,
    { shown: number; exited: number; rate: number }
  >;
  sessionsByIntention: Record<string, number>;
  regretRate: number;
}
