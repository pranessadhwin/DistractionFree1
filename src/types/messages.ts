import {
  DistractionSession,
  SessionState,
  IntentionType,
  InterventionType,
  UserAction,
  WorthItRating,
  SessionEvent,
  InterventionEvent
} from './session';
import { PastSelfMessage, Goal, DistractingSite, StorageData, AnalyticsSummary } from './models';

export type RuntimeMessage =
  | { type: 'CHECK_NAVIGATION_STATUS'; domain: string }
  | { type: 'NAVIGATION_STATUS_RESPONSE'; isMonitored: boolean; activeSession: DistractionSession | null; goal?: Goal }
  | { type: 'START_SHORT_BREAK'; domain: string; plannedDurationSeconds: number; returnTask: string; goalId?: string }
  | { type: 'START_AUTOMATIC_OPEN'; domain: string }
  | { type: 'START_SPECIFIC_TASK'; domain: string; plannedDurationSeconds: number; returnTask: string }
  | { type: 'START_AVOIDANCE_REENTRY'; domain: string; returnTask: string }
  | { type: 'CLOSE_TAB_REQUEST' }
  | { type: 'INTERVENTION_ACTION'; action: UserAction; interventionType: InterventionType; pastSelfMessageId?: string }
  | { type: 'GET_ACTIVE_SESSION' }
  | { type: 'ACTIVE_SESSION_UPDATE'; session: DistractionSession | null; intervention?: { type: InterventionType; message?: PastSelfMessage; stats?: any } }
  | { type: 'SUBMIT_REFLECTION'; sessionId: string; worthIt: WorthItRating; feelingText: string; saveAsMessage: boolean }
  | { type: 'GET_DASHBOARD_DATA' }
  | { type: 'DASHBOARD_DATA_RESPONSE'; data: StorageData; analytics: AnalyticsSummary }
  | { type: 'UPDATE_GOALS'; goals: Goal[] }
  | { type: 'UPDATE_SITES'; sites: DistractingSite[] }
  | { type: 'UPDATE_MESSAGES'; messages: PastSelfMessage[] }
  | { type: 'UPDATE_SETTINGS'; settings: any }
  | { type: 'EXPORT_DATA' }
  | { type: 'IMPORT_DATA'; jsonData: string }
  | { type: 'RESET_DATA' };

export type RuntimeResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};
