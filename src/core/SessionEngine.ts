import {
  DistractionSession,
  SessionState,
  IntentionType,
  InterventionType,
  UserAction,
  WorthItRating,
  Reflection
} from '../types/session';
import { PastSelfMessage } from '../types/models';
import { StorageService } from './StorageService';
import { generateId } from '../utils/uuid';
import { getIsoUtcNow } from '../utils/time';
import { extractDomain } from '../utils/domain';

export class SessionEngine {
  /**
   * Called when a monitored domain is accessed.
   * If no active session exists or current session is ENDED, creates a new INTENT_REQUIRED session.
   */
  static async handleSiteOpened(urlOrDomain: string): Promise<DistractionSession> {
    const domain = extractDomain(urlOrDomain);
    const data = await StorageService.getData();
    let session = data.activeSession;

    // If an active break is already running for this domain, keep it
    if (session && session.siteDomain === domain && session.state !== 'ENDED') {
      return session;
    }

    // Check if site is monitored
    const matchedSite = data.sites.find((s) => s.isEnabled && s.domain === domain);
    const siteId = matchedSite ? matchedSite.id : 'site_' + domain;

    session = {
      id: generateId('sess'),
      clientId: generateId('csess'),
      siteId,
      siteDomain: domain,
      intentionType: 'SHORT_BREAK',
      startedAt: getIsoUtcNow(),
      plannedDurationSeconds: 300, // default 5 min
      actualActiveSeconds: 0,
      returnTask: '',
      state: 'INTENT_REQUIRED',
      bypassCount: 0,
      createdAt: getIsoUtcNow(),
      lastActiveTimestamp: Date.now(),
      isTimerRunning: false
    };

    await StorageService.saveActiveSession(session);
    await StorageService.recordEvent(session.id, 'SESSION_STARTED', { domain });

    return session;
  }

  /**
   * User confirms an intentional Short Break
   */
  static async confirmShortBreak(
    plannedDurationSeconds: number,
    returnTask: string,
    relatedGoalId?: string
  ): Promise<DistractionSession> {
    let session = await StorageService.getActiveSession();
    if (!session) {
      throw new Error('No active session to confirm break for');
    }

    session.intentionType = 'SHORT_BREAK';
    session.plannedDurationSeconds = plannedDurationSeconds;
    session.returnTask = returnTask.trim();
    session.relatedGoalId = relatedGoalId;
    session.state = 'BREAK_ACTIVE';
    session.isTimerRunning = true;
    session.startedAt = getIsoUtcNow();
    session.lastActiveTimestamp = Date.now();

    await StorageService.saveActiveSession(session);
    await StorageService.recordEvent(session.id, 'INTENT_SELECTED', {
      intentionType: 'SHORT_BREAK',
      plannedDurationSeconds,
      returnTask,
      relatedGoalId
    });

    return session;
  }

  /**
   * User identifies an Automatic Open and chooses 5m conversion or immediate close
   */
  static async confirmAutomaticOpen(
    convertTo5MinBreak: boolean,
    returnTask: string = 'Close tab and resume focus'
  ): Promise<DistractionSession> {
    let session = await StorageService.getActiveSession();
    if (!session) {
      throw new Error('No active session found');
    }

    session.intentionType = 'AUTOMATIC_OPEN';
    session.returnTask = returnTask;

    if (convertTo5MinBreak) {
      session.plannedDurationSeconds = 300;
      session.state = 'BREAK_ACTIVE';
      session.isTimerRunning = true;
      session.startedAt = getIsoUtcNow();
    } else {
      session.plannedDurationSeconds = 0;
      session.state = 'ENDING';
      session.isTimerRunning = false;
    }

    await StorageService.saveActiveSession(session);
    await StorageService.recordEvent(session.id, 'INTENT_SELECTED', {
      intentionType: 'AUTOMATIC_OPEN',
      converted: convertTo5MinBreak
    });

    return session;
  }

  /**
   * User selects Specific Task (2-5 min)
   */
  static async confirmSpecificTask(
    plannedDurationSeconds: number,
    purpose: string
  ): Promise<DistractionSession> {
    let session = await StorageService.getActiveSession();
    if (!session) {
      throw new Error('No active session found');
    }

    session.intentionType = 'SPECIFIC_TASK';
    session.plannedDurationSeconds = plannedDurationSeconds;
    session.returnTask = purpose;
    session.state = 'BREAK_ACTIVE';
    session.isTimerRunning = true;
    session.startedAt = getIsoUtcNow();

    await StorageService.saveActiveSession(session);
    await StorageService.recordEvent(session.id, 'INTENT_SELECTED', {
      intentionType: 'SPECIFIC_TASK',
      plannedDurationSeconds,
      purpose
    });

    return session;
  }

  /**
   * User selects Avoidance Task Re-entry
   */
  static async confirmAvoidanceReentry(
    microStep: string
  ): Promise<DistractionSession> {
    let session = await StorageService.getActiveSession();
    if (!session) {
      throw new Error('No active session found');
    }

    session.intentionType = 'AVOIDANCE';
    session.returnTask = microStep;
    session.plannedDurationSeconds = 120; // 2-min micro re-entry
    session.state = 'BREAK_ACTIVE';
    session.isTimerRunning = true;

    await StorageService.saveActiveSession(session);
    await StorageService.recordEvent(session.id, 'INTENT_SELECTED', {
      intentionType: 'AVOIDANCE',
      microStep
    });

    return session;
  }

  /**
   * Called when timer expires (e.g. from chrome.alarms)
   */
  static async handleTimerExpired(): Promise<DistractionSession | null> {
    let session = await StorageService.getActiveSession();
    if (!session) return null;

    if (session.state === 'BREAK_ACTIVE') {
      session.state = 'LIMIT_REACHED';
    } else if (session.state === 'BYPASSED_ONCE') {
      session.state = 'BYPASSED_MULTIPLE';
    }

    await StorageService.saveActiveSession(session);
    await StorageService.recordEvent(session.id, 'TIMER_EXPIRED', {
      newState: session.state,
      bypassCount: session.bypassCount
    });

    return session;
  }

  /**
   * Process user action on an intervention screen
   */
  static async handleInterventionResponse(
    action: UserAction,
    interventionType: InterventionType,
    interventionId?: string,
    pastSelfMessageId?: string
  ): Promise<DistractionSession | null> {
    let session = await StorageService.getActiveSession();
    if (!session) return null;

    if (interventionId) {
      await StorageService.updateInterventionResponse(interventionId, action);
    }

    if (action === 'EXIT') {
      session.state = 'ENDING';
      session.isTimerRunning = false;
      session.endedAt = getIsoUtcNow();

      await StorageService.saveActiveSession(session);
      await StorageService.recordEvent(session.id, 'USER_EXITED', {
        interventionType,
        pastSelfMessageId,
        actualActiveSeconds: session.actualActiveSeconds
      });

      return session;
    }

    if (action === 'CONTINUE') {
      session.bypassCount += 1;

      if (session.state === 'LIMIT_REACHED') {
        session.state = 'BYPASSED_ONCE';
      } else if (session.state === 'BYPASSED_ONCE') {
        session.state = 'BYPASSED_MULTIPLE';
      }
      // If already BYPASSED_MULTIPLE, remains in BYPASSED_MULTIPLE (back-off phase)

      await StorageService.saveActiveSession(session);
      await StorageService.recordEvent(session.id, 'USER_CONTINUED', {
        bypassCount: session.bypassCount,
        interventionType
      });

      return session;
    }

    if (action === 'EXTEND') {
      session.plannedDurationSeconds += 300; // Add 5m
      session.state = 'BREAK_ACTIVE';

      await StorageService.saveActiveSession(session);
      await StorageService.recordEvent(session.id, 'INTENT_SELECTED', {
        action: 'EXTEND',
        newPlannedDuration: session.plannedDurationSeconds
      });

      return session;
    }

    return session;
  }

  /**
   * Active tab left or closed -> starts quick reopen observation window
   */
  static async handleSiteLeft(): Promise<DistractionSession | null> {
    let session = await StorageService.getActiveSession();
    if (!session || session.state === 'ENDED') return null;

    session.state = 'ENDING';
    await StorageService.saveActiveSession(session);
    return session;
  }

  /**
   * Reopen during observation window (Appendix A)
   */
  static async handleQuickReopen(urlOrDomain: string): Promise<DistractionSession | null> {
    const domain = extractDomain(urlOrDomain);
    let session = await StorageService.getActiveSession();
    if (!session) return null;

    if (session.siteDomain === domain && session.state === 'ENDING') {
      // Resume prior state
      session.state = session.bypassCount > 0 ? 'BYPASSED_ONCE' : 'BREAK_ACTIVE';
      await StorageService.saveActiveSession(session);
      await StorageService.recordEvent(session.id, 'SITE_REOPENED', { domain });
      return session;
    }

    return null;
  }

  /**
   * Finalize session after observation window closes (Section 13)
   */
  static async finalizeEndingSession(): Promise<{
    session: DistractionSession;
    isReflectionAvailable: boolean;
  } | null> {
    let session = await StorageService.getActiveSession();
    if (!session || session.state === 'ENDED') return null;

    session.endedAt = session.endedAt || getIsoUtcNow();
    const overrunSeconds = session.actualActiveSeconds - session.plannedDurationSeconds;

    // Check if session is noteworthy (Section 7.6 & 13.1):
    // Overrun > 120s or multiple bypasses
    const isNoteworthy = overrunSeconds > 120 || session.bypassCount >= 1;

    if (isNoteworthy) {
      session.state = 'REFLECTION_AVAILABLE';
    } else {
      session.state = 'ENDED';
    }

    await StorageService.completeSession(session);
    await StorageService.recordEvent(session.id, 'SESSION_ENDED', {
      overrunSeconds,
      actualActiveSeconds: session.actualActiveSeconds,
      bypassCount: session.bypassCount,
      isNoteworthy
    });

    return { session, isReflectionAvailable: isNoteworthy };
  }

  /**
   * Save retrospective reflection and optionally capture future past-self message (Section 7.6)
   */
  static async submitReflection(
    sessionId: string,
    worthIt: WorthItRating,
    feelingText: string,
    saveAsMessage: boolean
  ): Promise<Reflection> {
    const reflection: Reflection = {
      id: generateId('ref'),
      sessionId,
      worthIt,
      feelingText: feelingText.trim(),
      savedAsMessage: saveAsMessage && feelingText.trim().length > 0,
      createdAt: getIsoUtcNow()
    };

    await StorageService.saveReflection(reflection);

    // If user wants to save this as a past-self message for future interventions
    if (reflection.savedAsMessage) {
      const data = await StorageService.getData();
      const session = data.sessions.find((s) => s.id === sessionId);
      const newMsg: PastSelfMessage = {
        id: generateId('msg'),
        message: feelingText.trim(),
        relatedGoalId: session?.relatedGoalId,
        relatedSiteId: session?.siteId,
        sourceSessionId: sessionId,
        sourceOverrunSeconds: session
          ? Math.max(0, session.actualActiveSeconds - session.plannedDurationSeconds)
          : undefined,
        sourceDate: getIsoUtcNow(),
        isActive: true,
        timesShown: 0,
        timesExited: 0,
        createdAt: getIsoUtcNow()
      };

      data.pastSelfMessages.unshift(newMsg);
      await StorageService.setData({ pastSelfMessages: data.pastSelfMessages });
    }

    await StorageService.recordEvent(sessionId, 'REFLECTION_SUBMITTED', {
      worthIt,
      savedAsMessage: reflection.savedAsMessage
    });

    return reflection;
  }
}
