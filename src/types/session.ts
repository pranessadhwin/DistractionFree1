export type IntentionType = 'SHORT_BREAK' | 'SPECIFIC_TASK' | 'AUTOMATIC_OPEN' | 'AVOIDANCE';

export type SessionState =
  | 'IDLE'
  | 'INTENT_REQUIRED'
  | 'BREAK_ACTIVE'
  | 'LIMIT_REACHED'
  | 'BYPASSED_ONCE'
  | 'BYPASSED_MULTIPLE'
  | 'ENDING'
  | 'REFLECTION_AVAILABLE'
  | 'ENDED';

export type EventType =
  | 'SESSION_STARTED'
  | 'INTENT_SELECTED'
  | 'TIMER_EXPIRED'
  | 'INTERVENTION_SHOWN'
  | 'USER_CONTINUED'
  | 'USER_EXITED'
  | 'SITE_REOPENED'
  | 'SITE_SWITCHED'
  | 'REFLECTION_SUBMITTED'
  | 'SESSION_ENDED';

export type InterventionType =
  | 'COMMITMENT_REMINDER'
  | 'BEHAVIOR_EVIDENCE'
  | 'PAST_SELF_MESSAGE'
  | 'GOAL_REMINDER'
  | 'RETURN_ASSISTANCE';

export type UserAction = 'EXIT' | 'CONTINUE' | 'EXTEND' | 'NO_RESPONSE';

export type WorthItRating = 'YES' | 'NEUTRAL' | 'NO';

export interface DistractionSession {
  id: string;
  clientId: string;
  siteId: string;
  siteDomain: string;
  intentionType: IntentionType;
  startedAt: string; // ISO UTC
  endedAt?: string;
  plannedDurationSeconds: number;
  actualActiveSeconds: number;
  returnTask: string;
  relatedGoalId?: string;
  state: SessionState;
  bypassCount: number;
  postSessionJudgment?: WorthItRating;
  createdAt: string;
  lastActiveTimestamp?: number;
  isTimerRunning?: boolean;
}

export interface SessionEvent {
  id: string;
  clientEventId: string;
  sessionId: string;
  eventType: EventType;
  occurredAt: string;
  metadata?: Record<string, any>;
}

export interface InterventionEvent {
  id: string;
  clientEventId: string;
  sessionId: string;
  interventionType: InterventionType;
  pastSelfMessageId?: string;
  pastSelfMessageText?: string;
  shownAt: string;
  userAction?: UserAction;
  respondedAt?: string;
}

export interface Reflection {
  id: string;
  sessionId: string;
  worthIt: WorthItRating;
  feelingText: string;
  savedAsMessage?: boolean;
  createdAt: string;
}
