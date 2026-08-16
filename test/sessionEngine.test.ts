import { describe, it, expect, beforeEach } from 'vitest';
import { SessionEngine } from '../src/core/SessionEngine';
import { StorageService } from '../src/core/StorageService';

describe('SessionEngine State Machine', () => {
  beforeEach(async () => {
    // Reset data
    await StorageService.setData({
      activeSession: null,
      sessions: [],
      events: [],
      interventions: [],
      reflections: [],
      pastSelfMessages: []
    });
  });

  it('transitions from IDLE to INTENT_REQUIRED when a monitored site opens', async () => {
    const session = await SessionEngine.handleSiteOpened('https://www.youtube.com/watch?v=123');
    expect(session.state).toBe('INTENT_REQUIRED');
    expect(session.siteDomain).toBe('youtube.com');
    expect(session.bypassCount).toBe(0);
  });

  it('transitions from INTENT_REQUIRED to BREAK_ACTIVE on short break confirmation', async () => {
    await SessionEngine.handleSiteOpened('instagram.com');
    const session = await SessionEngine.confirmShortBreak(
      300,
      'Review algorithm notes',
      'goal_123'
    );

    expect(session.state).toBe('BREAK_ACTIVE');
    expect(session.plannedDurationSeconds).toBe(300);
    expect(session.returnTask).toBe('Review algorithm notes');
    expect(session.isTimerRunning).toBe(true);
  });

  it('transitions from BREAK_ACTIVE to LIMIT_REACHED on timer expiry', async () => {
    await SessionEngine.handleSiteOpened('youtube.com');
    await SessionEngine.confirmShortBreak(300, 'Finish homework');

    const session = await SessionEngine.handleTimerExpired();
    expect(session).not.toBeNull();
    expect(session?.state).toBe('LIMIT_REACHED');
  });

  it('handles ladder bypasses correctly: LIMIT_REACHED -> BYPASSED_ONCE -> BYPASSED_MULTIPLE', async () => {
    await SessionEngine.handleSiteOpened('reddit.com');
    await SessionEngine.confirmShortBreak(300, 'Back to coding');
    await SessionEngine.handleTimerExpired();

    // 1st Continue
    const bypass1 = await SessionEngine.handleInterventionResponse(
      'CONTINUE',
      'COMMITMENT_REMINDER'
    );
    expect(bypass1?.state).toBe('BYPASSED_ONCE');
    expect(bypass1?.bypassCount).toBe(1);

    // 2nd Continue
    const bypass2 = await SessionEngine.handleInterventionResponse(
      'CONTINUE',
      'BEHAVIOR_EVIDENCE'
    );
    expect(bypass2?.state).toBe('BYPASSED_MULTIPLE');
    expect(bypass2?.bypassCount).toBe(2);

    // 3rd Continue (Back-off phase)
    const bypass3 = await SessionEngine.handleInterventionResponse(
      'CONTINUE',
      'PAST_SELF_MESSAGE'
    );
    expect(bypass3?.state).toBe('BYPASSED_MULTIPLE');
    expect(bypass3?.bypassCount).toBe(3);
  });

  it('finalizes session and marks REFLECTION_AVAILABLE if overrun was noteworthy', async () => {
    await SessionEngine.handleSiteOpened('youtube.com');
    await SessionEngine.confirmShortBreak(300, 'Task A');
    
    // Simulate 10 minutes active time (overrun = 300s > 120s threshold)
    const session = await StorageService.getActiveSession();
    if (session) {
      session.actualActiveSeconds = 600;
      await StorageService.saveActiveSession(session);
    }

    const result = await SessionEngine.finalizeEndingSession();
    expect(result).not.toBeNull();
    expect(result?.isReflectionAvailable).toBe(true);
    expect(result?.session.state).toBe('REFLECTION_AVAILABLE');
  });

  it('records reflection and creates a past-self message if requested', async () => {
    await SessionEngine.handleSiteOpened('youtube.com');
    await SessionEngine.confirmShortBreak(300, 'Task A');
    const finalResult = await SessionEngine.finalizeEndingSession();
    const sessionId = finalResult!.session.id;

    const reflection = await SessionEngine.submitReflection(
      sessionId,
      'NO',
      'Remember that 10 mins became 45 mins. Stop early next time!',
      true
    );

    expect(reflection.worthIt).toBe('NO');
    expect(reflection.savedAsMessage).toBe(true);

    const data = await StorageService.getData();
    expect(data.pastSelfMessages.length).toBeGreaterThan(0);
    expect(data.pastSelfMessages[0].message).toContain('Remember that 10 mins became 45 mins');
  });
});
