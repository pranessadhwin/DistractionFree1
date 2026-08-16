import {
  DistractionSession,
  InterventionType,
  SessionState
} from '../types/session';
import { PastSelfMessage } from '../types/models';
import { StorageService } from './StorageService';

export interface InterventionDecision {
  interventionType: InterventionType;
  pastSelfMessage?: PastSelfMessage;
  evidenceStats?: {
    plannedMinutes: number;
    elapsedMinutes: number;
    similarSessionsCount: number;
    avgHistoricalOverrunMinutes: number;
  };
  returnTask: string;
  goalTitle?: string;
}

export class InterventionEngine {
  /**
   * Determine which intervention level to show based on the session's current state and bypass count
   */
  static async decideIntervention(
    session: DistractionSession
  ): Promise<InterventionDecision> {
    const data = await StorageService.getData();
    const goal = session.relatedGoalId
      ? data.goals.find((g) => g.id === session.relatedGoalId)
      : undefined;

    // Level 1: Limit Reached (First intervention)
    if (session.state === 'LIMIT_REACHED' || session.bypassCount === 0) {
      return {
        interventionType: 'COMMITMENT_REMINDER',
        returnTask: session.returnTask || 'Return to your priority work',
        goalTitle: goal?.title
      };
    }

    // Level 2: First continuation / Awareness & Evidence
    if (session.state === 'BYPASSED_ONCE' || session.bypassCount === 1) {
      const similarSessions = data.sessions.filter(
        (s) =>
          s.siteDomain === session.siteDomain &&
          s.state === 'ENDED' &&
          s.plannedDurationSeconds > 0
      );

      let avgOverrun = 0;
      if (similarSessions.length > 0) {
        const totalOverrun = similarSessions.reduce(
          (acc, s) => acc + Math.max(0, s.actualActiveSeconds - s.plannedDurationSeconds),
          0
        );
        avgOverrun = Math.round(totalOverrun / similarSessions.length / 60);
      }

      return {
        interventionType: 'BEHAVIOR_EVIDENCE',
        evidenceStats: {
          plannedMinutes: Math.round(session.plannedDurationSeconds / 60),
          elapsedMinutes: Math.max(
            Math.round(session.plannedDurationSeconds / 60),
            Math.round(session.actualActiveSeconds / 60)
          ),
          similarSessionsCount: similarSessions.length,
          avgHistoricalOverrunMinutes: avgOverrun > 0 ? avgOverrun : 15
        },
        returnTask: session.returnTask,
        goalTitle: goal?.title
      };
    }

    // Level 3: Repeated continuation / Past-Self Message
    if (session.state === 'BYPASSED_MULTIPLE' && session.bypassCount === 2) {
      const selectedMessage = this.selectBestPastSelfMessage(
        data.pastSelfMessages,
        session
      );

      if (selectedMessage) {
        return {
          interventionType: 'PAST_SELF_MESSAGE',
          pastSelfMessage: selectedMessage,
          returnTask: session.returnTask,
          goalTitle: goal?.title
        };
      }
    }

    // Level 4 / Strategy Shift & Back-off (bypassCount >= 3)
    return {
      interventionType: 'RETURN_ASSISTANCE',
      returnTask: session.returnTask,
      goalTitle: goal?.title
    };
  }

  /**
   * Transparent heuristic past-self message selection (Section 8.2 & 18.2)
   * Considers goal relevance, site relevance, success rate, and recent exposure fatigue.
   */
  static selectBestPastSelfMessage(
    messages: PastSelfMessage[],
    session: DistractionSession
  ): PastSelfMessage | undefined {
    const activeMessages = messages.filter((m) => m.isActive);
    if (activeMessages.length === 0) return undefined;

    // Score candidate messages
    const scored = activeMessages.map((msg) => {
      let score = 10;

      // Goal match bonus
      if (session.relatedGoalId && msg.relatedGoalId === session.relatedGoalId) {
        score += 8;
      }

      // Site match bonus
      if (session.siteId && msg.relatedSiteId === session.siteId) {
        score += 6;
      }

      // Effectiveness score (exit rate)
      if (msg.timesShown > 0) {
        const exitRate = msg.timesExited / msg.timesShown;
        score += exitRate * 5;
      }

      // Exposure fatigue penalty (Section 5.5)
      score -= Math.min(msg.timesShown * 1.5, 6);

      return { msg, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].msg;
  }
}
