import { describe, it, expect, beforeEach } from 'vitest';
import { InterventionEngine } from '../src/core/InterventionEngine';
import { StorageService } from '../src/core/StorageService';
import { DistractionSession } from '../src/types/session';
import { PastSelfMessage } from '../src/types/models';

describe('InterventionEngine Ladder & Selection', () => {
  beforeEach(async () => {
    await StorageService.setData({
      goals: [{ id: 'goal_study', title: 'Study for Exam', isActive: true, createdAt: '' }],
      pastSelfMessages: [
        {
          id: 'msg_1',
          message: 'Generic message',
          isActive: true,
          timesShown: 10,
          timesExited: 2,
          createdAt: ''
        },
        {
          id: 'msg_2',
          message: 'Exam focused message',
          relatedGoalId: 'goal_study',
          isActive: true,
          timesShown: 1,
          timesExited: 1,
          createdAt: ''
        }
      ]
    });
  });

  it('selects COMMITMENT_REMINDER at LIMIT_REACHED (Level 1)', async () => {
    const session: DistractionSession = {
      id: 's1',
      clientId: 'c1',
      siteId: 'site_yt',
      siteDomain: 'youtube.com',
      intentionType: 'SHORT_BREAK',
      startedAt: '',
      plannedDurationSeconds: 300,
      actualActiveSeconds: 300,
      returnTask: 'Read Chapter 4',
      state: 'LIMIT_REACHED',
      bypassCount: 0,
      createdAt: ''
    };

    const decision = await InterventionEngine.decideIntervention(session);
    expect(decision.interventionType).toBe('COMMITMENT_REMINDER');
    expect(decision.returnTask).toBe('Read Chapter 4');
  });

  it('selects BEHAVIOR_EVIDENCE at BYPASSED_ONCE (Level 2)', async () => {
    const session: DistractionSession = {
      id: 's1',
      clientId: 'c1',
      siteId: 'site_yt',
      siteDomain: 'youtube.com',
      intentionType: 'SHORT_BREAK',
      startedAt: '',
      plannedDurationSeconds: 300,
      actualActiveSeconds: 450,
      returnTask: 'Read Chapter 4',
      state: 'BYPASSED_ONCE',
      bypassCount: 1,
      createdAt: ''
    };

    const decision = await InterventionEngine.decideIntervention(session);
    expect(decision.interventionType).toBe('BEHAVIOR_EVIDENCE');
    expect(decision.evidenceStats).toBeDefined();
  });

  it('selects best PAST_SELF_MESSAGE prioritizing matching goal and low fatigue (Level 3)', async () => {
    const session: DistractionSession = {
      id: 's1',
      clientId: 'c1',
      siteId: 'site_yt',
      siteDomain: 'youtube.com',
      intentionType: 'SHORT_BREAK',
      startedAt: '',
      plannedDurationSeconds: 300,
      actualActiveSeconds: 600,
      returnTask: 'Study math',
      relatedGoalId: 'goal_study',
      state: 'BYPASSED_MULTIPLE',
      bypassCount: 2,
      createdAt: ''
    };

    const decision = await InterventionEngine.decideIntervention(session);
    expect(decision.interventionType).toBe('PAST_SELF_MESSAGE');
    expect(decision.pastSelfMessage?.id).toBe('msg_2');
    expect(decision.pastSelfMessage?.message).toBe('Exam focused message');
  });
});
