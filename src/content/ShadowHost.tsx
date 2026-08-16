import React, { useEffect, useState, useCallback, useRef } from 'react';
import { DistractionSession, UserAction, WorthItRating } from '../types/session';
import { Goal, PastSelfMessage, DistractingSite } from '../types/models';
import { IntentModal } from './components/IntentModal';
import { Level1Modal } from './components/Level1Modal';
import { Level2Modal } from './components/Level2Modal';
import { Level3Modal } from './components/Level3Modal';
import { BackoffModal } from './components/BackoffModal';
import { ReflectionModal } from './components/ReflectionModal';
import { extractDomain, matchesDomain } from '../utils/domain';

const LOG_PREFIX = '[Past-Self Content]';

/**
 * Read directly from chrome.storage.local to check if the current domain is monitored.
 * This avoids depending on the service worker being alive for the initial check.
 */
// Default sites — must match StorageService defaults so the content script
// can seed them independently if the service worker hasn't run yet.
const DEFAULT_SITES: DistractingSite[] = [
  { id: 'site_yt', domain: 'youtube.com', name: 'YouTube', isEnabled: true, category: 'video', createdAt: new Date().toISOString() },
  { id: 'site_ig', domain: 'instagram.com', name: 'Instagram', isEnabled: true, category: 'social', createdAt: new Date().toISOString() },
  { id: 'site_tw', domain: 'twitter.com', name: 'Twitter / X', isEnabled: true, category: 'social', createdAt: new Date().toISOString() },
  { id: 'site_x', domain: 'x.com', name: 'X', isEnabled: true, category: 'social', createdAt: new Date().toISOString() },
  { id: 'site_rd', domain: 'reddit.com', name: 'Reddit', isEnabled: true, category: 'social', createdAt: new Date().toISOString() },
  { id: 'site_tk', domain: 'tiktok.com', name: 'TikTok', isEnabled: true, category: 'video', createdAt: new Date().toISOString() }
];

async function checkIfMonitoredDirectly(currentUrl: string): Promise<{
  isMonitored: boolean;
  domain: string;
  goals: Goal[];
  activeSession: DistractionSession | null;
}> {
  const domain = extractDomain(currentUrl);
  console.log(LOG_PREFIX, 'Checking domain directly from storage:', domain);

  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      console.error(LOG_PREFIX, 'chrome.storage.local is NOT available');
      resolve({ isMonitored: false, domain, goals: [], activeSession: null });
      return;
    }

    chrome.storage.local.get(null, (result) => {
      if (chrome.runtime.lastError) {
        console.error(LOG_PREFIX, 'storage.local.get error:', chrome.runtime.lastError.message);
        resolve({ isMonitored: false, domain, goals: [], activeSession: null });
        return;
      }

      console.log(LOG_PREFIX, 'Storage keys found:', Object.keys(result || {}));

      let sites: DistractingSite[] = result?.sites || [];
      const goals: Goal[] = result?.goals || [];
      const activeSession: DistractionSession | null = result?.activeSession || null;

      // If storage has no sites (never initialized), seed defaults now
      if (sites.length === 0) {
        console.log(LOG_PREFIX, '⚠️ No sites in storage — seeding defaults.');
        sites = DEFAULT_SITES;
        chrome.storage.local.set({ sites: DEFAULT_SITES });
      }

      console.log(LOG_PREFIX, 'Sites in storage:', sites.map(s => `${s.domain} (enabled: ${s.isEnabled})`));

      const matchedSite = sites.find(
        (s) => s.isEnabled && matchesDomain(domain, s.domain)
      );

      if (matchedSite) {
        console.log(LOG_PREFIX, '✅ MATCHED monitored site:', matchedSite.domain);
        // Check if active session is relevant to this domain
        const relevantSession =
          activeSession &&
          activeSession.siteDomain === matchedSite.domain &&
          activeSession.state !== 'ENDED'
            ? activeSession
            : null;

        resolve({
          isMonitored: true,
          domain: matchedSite.domain,
          goals,
          activeSession: relevantSession
        });
      } else {
        console.log(LOG_PREFIX, '❌ Domain NOT monitored:', domain);
        resolve({ isMonitored: false, domain, goals: [], activeSession: null });
      }
    });
  });
}

/**
 * Safely send a message to the background service worker.
 * Returns null if the service worker is not available.
 */
function safeSendMessage(message: any): Promise<any> {
  return new Promise((resolve) => {
    try {
      if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
        console.warn(LOG_PREFIX, 'chrome.runtime.sendMessage is not available');
        resolve(null);
        return;
      }
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.warn(LOG_PREFIX, 'sendMessage error:', chrome.runtime.lastError.message);
          resolve(null);
          return;
        }
        resolve(response);
      });
    } catch (err) {
      console.warn(LOG_PREFIX, 'sendMessage exception:', err);
      resolve(null);
    }
  });
}

export const ShadowHostApp: React.FC = () => {
  const [isMonitored, setIsMonitored] = useState<boolean>(false);
  const [session, setSession] = useState<DistractionSession | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeIntervention, setActiveIntervention] = useState<{
    type: string;
    message?: PastSelfMessage;
    stats?: any;
  } | null>(null);
  const [dismissedBackoff, setDismissedBackoff] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);

  const currentDomain = extractDomain(window.location.hostname);

  // Initial load — read storage directly, do NOT depend on service worker
  useEffect(() => {
    console.log(LOG_PREFIX, '🚀 ShadowHostApp mounted. URL:', window.location.href);

    let cancelled = false;

    async function init() {
      // Step 1: Read storage directly
      const result = await checkIfMonitoredDirectly(window.location.href);

      if (cancelled) return;

      console.log(LOG_PREFIX, 'Direct storage check result:', {
        isMonitored: result.isMonitored,
        domain: result.domain,
        goalCount: result.goals.length,
        hasActiveSession: !!result.activeSession
      });

      if (result.isMonitored) {
        setIsMonitored(true);
        setGoals(result.goals);
        if (result.activeSession) {
          setSession(result.activeSession);
        }

        // Step 2: Optionally ask the service worker for intervention details
        const swResponse = await safeSendMessage({ type: 'GET_ACTIVE_SESSION' });
        if (!cancelled && swResponse?.success && swResponse?.data?.session) {
          setSession(swResponse.data.session);
          if (swResponse.data.intervention) {
            setActiveIntervention(swResponse.data.intervention);
          }
        }

        // Also tell the service worker about this navigation
        safeSendMessage({
          type: 'CHECK_NAVIGATION_STATUS',
          domain: window.location.href
        });
      }

      setInitialized(true);
    }

    init();

    // Listen for background state pushes
    const messageListener = (msg: any) => {
      console.log(LOG_PREFIX, 'Received background message:', msg.type);
      if (msg.type === 'ACTIVE_SESSION_UPDATE') {
        setSession(msg.session);
        if (msg.intervention) {
          setActiveIntervention(msg.intervention);
        }
      }
    };

    try {
      chrome.runtime.onMessage.addListener(messageListener);
    } catch (e) {
      console.warn(LOG_PREFIX, 'Could not add message listener:', e);
    }

    return () => {
      cancelled = true;
      try {
        chrome.runtime.onMessage.removeListener(messageListener);
      } catch (e) {
        // Ignore
      }
    };
  }, []);

  // Action Handlers — all use safeSendMessage
  const handleStartShortBreak = (
    durationSec: number,
    returnTask: string,
    goalId?: string
  ) => {
    safeSendMessage({
      type: 'START_SHORT_BREAK',
      domain: currentDomain,
      plannedDurationSeconds: durationSec,
      returnTask,
      goalId
    }).then((res) => {
      if (res?.data) setSession(res.data);
    });
  };

  const handleAutomaticClose = () => {
    safeSendMessage({ type: 'CLOSE_TAB_REQUEST' });
  };

  const handleAutomaticConvert5m = () => {
    safeSendMessage({
      type: 'START_SHORT_BREAK',
      domain: currentDomain,
      plannedDurationSeconds: 300,
      returnTask: 'Conscious 5m pause'
    }).then((res) => {
      if (res?.data) setSession(res.data);
    });
  };

  const handleStartSpecificTask = (durationSec: number, purpose: string) => {
    safeSendMessage({
      type: 'START_SPECIFIC_TASK',
      domain: currentDomain,
      plannedDurationSeconds: durationSec,
      returnTask: purpose
    }).then((res) => {
      if (res?.data) setSession(res.data);
    });
  };

  const handleStartAvoidance = (microStep: string) => {
    safeSendMessage({
      type: 'START_AVOIDANCE_REENTRY',
      domain: currentDomain,
      returnTask: microStep
    }).then((res) => {
      if (res?.data) setSession(res.data);
    });
  };

  const handleInterventionAction = (
    action: UserAction,
    interventionType: any,
    pastSelfMessageId?: string
  ) => {
    safeSendMessage({
      type: 'INTERVENTION_ACTION',
      action,
      interventionType,
      pastSelfMessageId
    }).then((res) => {
      if (res?.data) setSession(res.data);
      if (action === 'EXIT') {
        safeSendMessage({ type: 'CLOSE_TAB_REQUEST' });
      }
    });
  };

  const handleSaveReflection = (
    worthIt: WorthItRating,
    feelingText: string,
    saveAsMessage: boolean
  ) => {
    if (session) {
      safeSendMessage({
        type: 'SUBMIT_REFLECTION',
        sessionId: session.id,
        worthIt,
        feelingText,
        saveAsMessage
      }).then(() => {
        setSession(null);
      });
    }
  };

  const handleSkipReflection = () => {
    setSession(null);
  };

  // Don't render anything until we've checked storage
  if (!initialized) {
    return null;
  }

  // If page is not a monitored domain, render nothing
  if (!isMonitored) {
    console.log(LOG_PREFIX, 'Not a monitored domain — rendering nothing.');
    return null;
  }

  console.log(LOG_PREFIX, '🎯 Rendering overlay. Session state:', session?.state || 'NO_SESSION (showing intent modal)');

  // State: INTENT_REQUIRED -> Show IntentModal
  if (!session || session.state === 'INTENT_REQUIRED') {
    return (
      <IntentModal
        domain={currentDomain}
        goals={goals}
        onStartShortBreak={handleStartShortBreak}
        onAutomaticClose={handleAutomaticClose}
        onAutomaticConvert5m={handleAutomaticConvert5m}
        onStartSpecificTask={handleStartSpecificTask}
        onStartAvoidance={handleStartAvoidance}
      />
    );
  }

  // State: BREAK_ACTIVE -> User is in approved break window. Render nothing to leave them alone.
  if (session.state === 'BREAK_ACTIVE') {
    return null;
  }

  // State: LIMIT_REACHED -> Level 1 Commitment Reminder
  if (session.state === 'LIMIT_REACHED') {
    return (
      <Level1Modal
        plannedDurationSeconds={session.plannedDurationSeconds}
        returnTask={session.returnTask}
        onExit={() => handleInterventionAction('EXIT', 'COMMITMENT_REMINDER')}
        onContinue={() => handleInterventionAction('CONTINUE', 'COMMITMENT_REMINDER')}
      />
    );
  }

  // State: BYPASSED_ONCE -> Level 2 Behavioral Evidence
  if (session.state === 'BYPASSED_ONCE') {
    return (
      <Level2Modal
        plannedDurationSeconds={session.plannedDurationSeconds}
        actualActiveSeconds={session.actualActiveSeconds}
        evidenceStats={activeIntervention?.stats}
        returnTask={session.returnTask}
        onExit={() => handleInterventionAction('EXIT', 'BEHAVIOR_EVIDENCE')}
        onContinue={() => handleInterventionAction('CONTINUE', 'BEHAVIOR_EVIDENCE')}
      />
    );
  }

  // State: BYPASSED_MULTIPLE
  if (session.state === 'BYPASSED_MULTIPLE') {
    if (session.bypassCount === 2 && activeIntervention?.message) {
      return (
        <Level3Modal
          message={activeIntervention.message}
          returnTask={session.returnTask}
          onExit={() =>
            handleInterventionAction('EXIT', 'PAST_SELF_MESSAGE', activeIntervention.message?.id)
          }
          onContinue={() =>
            handleInterventionAction('CONTINUE', 'PAST_SELF_MESSAGE', activeIntervention.message?.id)
          }
        />
      );
    }

    if (!dismissedBackoff) {
      return (
        <BackoffModal
          returnTask={session.returnTask}
          onExit={() => handleInterventionAction('EXIT', 'RETURN_ASSISTANCE')}
          onDismiss={() => setDismissedBackoff(true)}
        />
      );
    }
  }

  // State: REFLECTION_AVAILABLE
  if (session.state === 'REFLECTION_AVAILABLE') {
    return (
      <ReflectionModal
        onSave={handleSaveReflection}
        onSkip={handleSkipReflection}
      />
    );
  }

  return null;
};
