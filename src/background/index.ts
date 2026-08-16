import { StorageService } from '../core/StorageService';
import { SessionEngine } from '../core/SessionEngine';
import { InterventionEngine } from '../core/InterventionEngine';
import { AlarmHandler } from './alarmHandler';
import { NavigationHandler } from './navigationHandler';
import { RuntimeMessage, RuntimeResponse } from '../types/messages';
import { SyncEngine } from '../core/SyncEngine';

// 1. Initialization
chrome.runtime.onInstalled.addListener(async () => {
  await StorageService.getData(); // Seeds defaults
  console.log('[Past-Self] Background Service Worker installed and initialized');
});

// 2. Alarm handling
chrome.alarms.onAlarm.addListener((alarm) => {
  AlarmHandler.handleAlarm(alarm);
});

// 3. Navigation interception
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId === 0) {
    await NavigationHandler.handleNavigation(details.tabId, details.url);
  }
});

// 4. Tab update / URL changes (SPAs, reloads)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.url) {
    await NavigationHandler.handleNavigation(tabId, tab.url);
  }
});

// 5. Active tab monitoring & heartbeat tick
let activeTabHeartbeatInterval: number | null = null;

async function updateTabActiveTime() {
  const session = await StorageService.getActiveSession();
  if (session && session.isTimerRunning && session.state !== 'ENDED') {
    // Check if focused tab is on the monitored domain
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const activeTab = tabs[0];
      if (activeTab && activeTab.url) {
        const { isMonitored, domain } = await NavigationHandler.checkUrl(activeTab.url);
        if (isMonitored && domain === session.siteDomain) {
          session.actualActiveSeconds += 1;
          await StorageService.saveActiveSession(session);
        }
      }
    });
  }
}

// Tick active seconds every second
setInterval(() => {
  updateTabActiveTime();
}, 1000);

// 6. Runtime message dispatcher
chrome.runtime.onMessage.addListener(
  (
    message: RuntimeMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: RuntimeResponse) => void
  ) => {
    (async () => {
      try {
        switch (message.type) {
          case 'CHECK_NAVIGATION_STATUS': {
            const { isMonitored, domain } = await NavigationHandler.checkUrl(message.domain);
            const activeSession = await StorageService.getActiveSession();
            const data = await StorageService.getData();
            const goal = activeSession?.relatedGoalId
              ? data.goals.find((g) => g.id === activeSession.relatedGoalId)
              : undefined;

            const relevantSession =
              activeSession && activeSession.siteDomain === domain && activeSession.state !== 'ENDED'
                ? activeSession
                : null;

            sendResponse({
              success: true,
              data: { isMonitored, activeSession: relevantSession, goal, domain }
            });
            break;
          }

          case 'START_SHORT_BREAK': {
            const session = await SessionEngine.confirmShortBreak(
              message.plannedDurationSeconds,
              message.returnTask,
              message.goalId
            );
            AlarmHandler.scheduleBreakTimer(message.plannedDurationSeconds);
            AlarmHandler.broadcastSessionUpdate(session);
            sendResponse({ success: true, data: session });
            break;
          }

          case 'START_AUTOMATIC_OPEN': {
            const session = await SessionEngine.confirmAutomaticOpen(false);
            AlarmHandler.broadcastSessionUpdate(session);
            sendResponse({ success: true, data: session });
            break;
          }

          case 'START_SPECIFIC_TASK': {
            const session = await SessionEngine.confirmSpecificTask(
              message.plannedDurationSeconds,
              message.returnTask
            );
            AlarmHandler.scheduleBreakTimer(message.plannedDurationSeconds);
            AlarmHandler.broadcastSessionUpdate(session);
            sendResponse({ success: true, data: session });
            break;
          }

          case 'START_AVOIDANCE_REENTRY': {
            const session = await SessionEngine.confirmAvoidanceReentry(message.returnTask);
            AlarmHandler.scheduleBreakTimer(120);
            AlarmHandler.broadcastSessionUpdate(session);
            sendResponse({ success: true, data: session });
            break;
          }

          case 'CLOSE_TAB_REQUEST': {
            if (sender.tab && sender.tab.id) {
              chrome.tabs.remove(sender.tab.id);
            }
            sendResponse({ success: true });
            break;
          }

          case 'INTERVENTION_ACTION': {
            const session = await SessionEngine.handleInterventionResponse(
              message.action,
              message.interventionType,
              undefined,
              message.pastSelfMessageId
            );

            if (message.action === 'CONTINUE') {
              const data = await StorageService.getData();
              AlarmHandler.scheduleBypassTimer(data.settings.bypassIntervalSeconds);
            } else if (message.action === 'EXIT') {
              AlarmHandler.scheduleEndingWindow();
            }

            if (session) {
              AlarmHandler.broadcastSessionUpdate(session);
            }
            sendResponse({ success: true, data: session });
            break;
          }

          case 'GET_ACTIVE_SESSION': {
            const session = await StorageService.getActiveSession();
            let intervention = undefined;
            if (session && (session.state === 'LIMIT_REACHED' || session.state === 'BYPASSED_ONCE' || session.state === 'BYPASSED_MULTIPLE')) {
              const decision = await InterventionEngine.decideIntervention(session);
              intervention = {
                type: decision.interventionType,
                message: decision.pastSelfMessage,
                stats: decision.evidenceStats
              };
            }
            sendResponse({ success: true, data: { session, intervention } });
            break;
          }

          case 'SUBMIT_REFLECTION': {
            const reflection = await SessionEngine.submitReflection(
              message.sessionId,
              message.worthIt,
              message.feelingText,
              message.saveAsMessage
            );
            sendResponse({ success: true, data: reflection });
            break;
          }

          case 'GET_DASHBOARD_DATA': {
            const data = await StorageService.getData();
            const analytics = await StorageService.getAnalyticsSummary();
            sendResponse({ success: true, data: { data, analytics } });
            break;
          }

          case 'UPDATE_GOALS': {
            await StorageService.setData({ goals: message.goals });
            sendResponse({ success: true });
            break;
          }

          case 'UPDATE_SITES': {
            await StorageService.setData({ sites: message.sites });
            sendResponse({ success: true });
            break;
          }

          case 'UPDATE_MESSAGES': {
            await StorageService.setData({ pastSelfMessages: message.messages });
            sendResponse({ success: true });
            break;
          }

          case 'UPDATE_SETTINGS': {
            await StorageService.setData({ settings: message.settings });
            sendResponse({ success: true });
            break;
          }

          case 'EXPORT_DATA': {
            const json = await SyncEngine.exportDataAsJson();
            sendResponse({ success: true, data: json });
            break;
          }

          case 'IMPORT_DATA': {
            const ok = await SyncEngine.importDataFromJson(message.jsonData);
            sendResponse({ success: ok });
            break;
          }

          case 'RESET_DATA': {
            await SyncEngine.resetAllData();
            sendResponse({ success: true });
            break;
          }

          default:
            sendResponse({ success: false, error: 'Unknown message type' });
        }
      } catch (err: any) {
        console.error('Error handling message:', err);
        sendResponse({ success: false, error: err.message || 'Internal error' });
      }
    })();

    return true; // Keep message channel open for asynchronous sendResponse
  }
);
