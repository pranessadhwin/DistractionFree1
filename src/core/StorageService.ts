import {
  DistractionSession,
  SessionEvent,
  InterventionEvent,
  Reflection
} from '../types/session';
import {
  Goal,
  DistractingSite,
  PastSelfMessage,
  UserSettings,
  StorageData,
  AnalyticsSummary
} from '../types/models';
import { generateId } from '../utils/uuid';
import { getIsoUtcNow } from '../utils/time';

const DEFAULT_SETTINGS: UserSettings = {
  userName: 'Explorer',
  reopenObservationWindowSeconds: 60,
  bypassIntervalSeconds: 180, // 3 minutes between escalation stages
  allowSingleExtension: true,
  audioFeedbackEnabled: false,
  darkTheme: true,
  onboardingCompleted: true
};

const DEFAULT_SITES: DistractingSite[] = [
  { id: 'site_yt', domain: 'youtube.com', name: 'YouTube', isEnabled: true, category: 'video', createdAt: getIsoUtcNow() },
  { id: 'site_ig', domain: 'instagram.com', name: 'Instagram', isEnabled: true, category: 'social', createdAt: getIsoUtcNow() },
  { id: 'site_tw', domain: 'twitter.com', name: 'Twitter / X', isEnabled: true, category: 'social', createdAt: getIsoUtcNow() },
  { id: 'site_x', domain: 'x.com', name: 'X', isEnabled: true, category: 'social', createdAt: getIsoUtcNow() },
  { id: 'site_rd', domain: 'reddit.com', name: 'Reddit', isEnabled: true, category: 'social', createdAt: getIsoUtcNow() },
  { id: 'site_tk', domain: 'tiktok.com', name: 'TikTok', isEnabled: true, category: 'video', createdAt: getIsoUtcNow() }
];

const DEFAULT_GOALS: Goal[] = [
  {
    id: 'goal_deepwork',
    title: 'Deep Work & Focused Study',
    description: 'Complete high-leverage tasks with clear boundaries',
    isActive: true,
    color: '#6366f1',
    createdAt: getIsoUtcNow()
  },
  {
    id: 'goal_health',
    title: 'Reclaim Evening Clarity',
    description: 'Avoid late-night infinite scrolling and sleep peacefully',
    isActive: true,
    color: '#10b981',
    createdAt: getIsoUtcNow()
  }
];

const DEFAULT_MESSAGES: PastSelfMessage[] = [
  {
    id: 'msg_starter_1',
    message: 'Remember: 5 minutes of mindful rest refreshes you, but 45 minutes of algorithmic feed leaves you drained and rushed. Return to your task now!',
    relatedGoalId: 'goal_deepwork',
    sourceOverrunSeconds: 1800,
    sourceDate: getIsoUtcNow(),
    isActive: true,
    timesShown: 0,
    timesExited: 0,
    createdAt: getIsoUtcNow()
  },
  {
    id: 'msg_starter_2',
    message: 'You opened this site for a quick pause. The task waiting for you is smaller than it seems—take the first 2-minute step.',
    relatedGoalId: 'goal_deepwork',
    sourceOverrunSeconds: 1200,
    sourceDate: getIsoUtcNow(),
    isActive: true,
    timesShown: 0,
    timesExited: 0,
    createdAt: getIsoUtcNow()
  }
];

export class StorageService {
  private static memoryStore: StorageData | null = null;

  private static isChromeStorageAvailable(): boolean {
    return (
      typeof chrome !== 'undefined' &&
      !!chrome.storage &&
      !!chrome.storage.local
    );
  }

  static async getData(): Promise<StorageData> {
    if (this.isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        chrome.storage.local.get(null, (result) => {
          if (!result || Object.keys(result).length === 0 || !result.sites) {
            const initialData = this.getInitialData();
            chrome.storage.local.set(initialData, () => resolve(initialData));
          } else {
            resolve(result as StorageData);
          }
        });
      });
    }

    if (!this.memoryStore) {
      this.memoryStore = this.getInitialData();
    }
    return JSON.parse(JSON.stringify(this.memoryStore));
  }

  static async setData(data: Partial<StorageData>): Promise<void> {
    if (this.isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        chrome.storage.local.set(data, () => resolve());
      });
    }

    if (!this.memoryStore) {
      this.memoryStore = this.getInitialData();
    }
    this.memoryStore = { ...this.memoryStore, ...data };
  }

  private static getInitialData(): StorageData {
    return {
      goals: DEFAULT_GOALS,
      sites: DEFAULT_SITES,
      pastSelfMessages: DEFAULT_MESSAGES,
      activeSession: null,
      sessions: [],
      events: [],
      interventions: [],
      reflections: [],
      settings: DEFAULT_SETTINGS,
      outbox: []
    };
  }

  // Active Session
  static async getActiveSession(): Promise<DistractionSession | null> {
    const data = await this.getData();
    return data.activeSession;
  }

  static async saveActiveSession(session: DistractionSession | null): Promise<void> {
    await this.setData({ activeSession: session });
  }

  // Sessions & Events
  static async recordEvent(
    sessionId: string,
    eventType: SessionEvent['eventType'],
    metadata: Record<string, any> = {}
  ): Promise<SessionEvent> {
    const data = await this.getData();
    const event: SessionEvent = {
      id: generateId('evt'),
      clientEventId: generateId('cevt'),
      sessionId,
      eventType,
      occurredAt: getIsoUtcNow(),
      metadata
    };

    data.events.push(event);
    data.outbox.push({
      id: generateId('out'),
      type: 'EVENT',
      data: event,
      queuedAt: getIsoUtcNow()
    });

    await this.setData({
      events: data.events,
      outbox: data.outbox
    });

    return event;
  }

  static async recordIntervention(
    sessionId: string,
    interventionType: InterventionEvent['interventionType'],
    pastSelfMessageId?: string,
    pastSelfMessageText?: string
  ): Promise<InterventionEvent> {
    const data = await this.getData();
    const intervention: InterventionEvent = {
      id: generateId('int'),
      clientEventId: generateId('cint'),
      sessionId,
      interventionType,
      pastSelfMessageId,
      pastSelfMessageText,
      shownAt: getIsoUtcNow()
    };

    data.interventions.push(intervention);
    if (pastSelfMessageId) {
      const msg = data.pastSelfMessages.find((m) => m.id === pastSelfMessageId);
      if (msg) {
        msg.timesShown += 1;
      }
    }

    data.outbox.push({
      id: generateId('out'),
      type: 'INTERVENTION',
      data: intervention,
      queuedAt: getIsoUtcNow()
    });

    await this.setData({
      interventions: data.interventions,
      pastSelfMessages: data.pastSelfMessages,
      outbox: data.outbox
    });

    return intervention;
  }

  static async updateInterventionResponse(
    interventionId: string,
    userAction: InterventionEvent['userAction']
  ): Promise<void> {
    const data = await this.getData();
    const intervention = data.interventions.find((i) => i.id === interventionId);
    if (intervention) {
      intervention.userAction = userAction;
      intervention.respondedAt = getIsoUtcNow();

      if (intervention.pastSelfMessageId && userAction === 'EXIT') {
        const msg = data.pastSelfMessages.find(
          (m) => m.id === intervention.pastSelfMessageId
        );
        if (msg) {
          msg.timesExited += 1;
        }
      }

      await this.setData({
        interventions: data.interventions,
        pastSelfMessages: data.pastSelfMessages
      });
    }
  }

  static async completeSession(session: DistractionSession): Promise<void> {
    const data = await this.getData();
    const existingIndex = data.sessions.findIndex((s) => s.id === session.id);
    if (existingIndex >= 0) {
      data.sessions[existingIndex] = session;
    } else {
      data.sessions.unshift(session);
    }

    data.activeSession = null;
    data.outbox.push({
      id: generateId('out'),
      type: 'SESSION',
      data: session,
      queuedAt: getIsoUtcNow()
    });

    await this.setData({
      sessions: data.sessions,
      activeSession: null,
      outbox: data.outbox
    });
  }

  static async saveReflection(reflection: Reflection): Promise<void> {
    const data = await this.getData();
    data.reflections.unshift(reflection);

    // If session exists, update postSessionJudgment
    const session = data.sessions.find((s) => s.id === reflection.sessionId);
    if (session) {
      session.postSessionJudgment = reflection.worthIt;
    }

    data.outbox.push({
      id: generateId('out'),
      type: 'REFLECTION',
      data: reflection,
      queuedAt: getIsoUtcNow()
    });

    await this.setData({
      reflections: data.reflections,
      sessions: data.sessions,
      outbox: data.outbox
    });
  }

  // Analytics Aggregation (Section 18 & Appendix B)
  static async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const data = await this.getData();
    const completedSessions = data.sessions.filter(
      (s) => s.state === 'ENDED' && s.plannedDurationSeconds > 0
    );

    let totalPlanned = 0;
    let totalActual = 0;
    let totalOverrun = 0;
    let adherenceCount = 0;
    let stoppedAtFirstReminderCount = 0;
    let firstReminderEligibleCount = 0;
    let repeatedBypassCount = 0;
    const intentionCounts: Record<string, number> = {};

    for (const session of completedSessions) {
      totalPlanned += session.plannedDurationSeconds;
      totalActual += session.actualActiveSeconds;
      const overrun = session.actualActiveSeconds - session.plannedDurationSeconds;
      totalOverrun += Math.max(0, overrun);

      // Adherence tolerance within 120s
      if (overrun <= 120) {
        adherenceCount += 1;
      }

      if (session.bypassCount >= 2) {
        repeatedBypassCount += 1;
      }

      intentionCounts[session.intentionType] =
        (intentionCounts[session.intentionType] || 0) + 1;
    }

    // Intervention Effectiveness
    const effectiveness: Record<
      string,
      { shown: number; exited: number; rate: number }
    > = {};

    for (const int of data.interventions) {
      if (!effectiveness[int.interventionType]) {
        effectiveness[int.interventionType] = { shown: 0, exited: 0, rate: 0 };
      }
      effectiveness[int.interventionType].shown += 1;
      if (int.userAction === 'EXIT') {
        effectiveness[int.interventionType].exited += 1;
      }
    }

    for (const type of Object.keys(effectiveness)) {
      const { shown, exited } = effectiveness[type];
      effectiveness[type].rate = shown > 0 ? Number((exited / shown).toFixed(2)) : 0;
      if (type === 'COMMITMENT_REMINDER') {
        firstReminderEligibleCount = shown;
        stoppedAtFirstReminderCount = exited;
      }
    }

    const regretReflections = data.reflections.filter((r) => r.worthIt === 'NO');
    const regretRate =
      data.reflections.length > 0
        ? Number((regretReflections.length / data.reflections.length).toFixed(2))
        : 0;

    return {
      totalPlannedSeconds: totalPlanned,
      totalActualSeconds: totalActual,
      averageOverrunSeconds:
        completedSessions.length > 0
          ? Math.round(totalOverrun / completedSessions.length)
          : 0,
      totalSessions: completedSessions.length,
      intentionAdherenceRate:
        completedSessions.length > 0
          ? Number((adherenceCount / completedSessions.length).toFixed(2))
          : 0,
      stoppedAtFirstReminderRate:
        firstReminderEligibleCount > 0
          ? Number((stoppedAtFirstReminderCount / firstReminderEligibleCount).toFixed(2))
          : 0,
      repeatedBypassRate:
        completedSessions.length > 0
          ? Number((repeatedBypassCount / completedSessions.length).toFixed(2))
          : 0,
      interventionEffectiveness: effectiveness,
      sessionsByIntention: intentionCounts,
      regretRate
    };
  }
}
