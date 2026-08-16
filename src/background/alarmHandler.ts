import { SessionEngine } from '../core/SessionEngine';
import { StorageService } from '../core/StorageService';

export const ALARM_NAMES = {
  BREAK_TIMER: 'past_self_break_timer',
  BYPASS_TIMER: 'past_self_bypass_timer',
  ENDING_WINDOW: 'past_self_ending_window',
  TICK_INTERVAL: 'past_self_active_tick'
};

export class AlarmHandler {
  /**
   * Schedule the initial break limit alarm
   */
  static scheduleBreakTimer(durationSeconds: number): void {
    if (typeof chrome === 'undefined' || !chrome.alarms) return;
    chrome.alarms.clear(ALARM_NAMES.BREAK_TIMER);
    const delayInMinutes = Math.max(0.1, durationSeconds / 60);
    chrome.alarms.create(ALARM_NAMES.BREAK_TIMER, { delayInMinutes });
  }

  /**
   * Schedule the next intervention alarm after a continuation/bypass
   */
  static scheduleBypassTimer(intervalSeconds: number = 180): void {
    if (typeof chrome === 'undefined' || !chrome.alarms) return;
    chrome.alarms.clear(ALARM_NAMES.BYPASS_TIMER);
    const delayInMinutes = Math.max(0.1, intervalSeconds / 60);
    chrome.alarms.create(ALARM_NAMES.BYPASS_TIMER, { delayInMinutes });
  }

  /**
   * Schedule observation window for quick reopen
   */
  static scheduleEndingWindow(windowSeconds: number = 60): void {
    if (typeof chrome === 'undefined' || !chrome.alarms) return;
    chrome.alarms.clear(ALARM_NAMES.ENDING_WINDOW);
    const delayInMinutes = Math.max(0.1, windowSeconds / 60);
    chrome.alarms.create(ALARM_NAMES.ENDING_WINDOW, { delayInMinutes });
  }

  /**
   * Main alarm trigger listener
   */
  static async handleAlarm(alarm: chrome.alarms.Alarm): Promise<void> {
    if (alarm.name === ALARM_NAMES.BREAK_TIMER || alarm.name === ALARM_NAMES.BYPASS_TIMER) {
      const session = await SessionEngine.handleTimerExpired();
      if (session) {
        this.broadcastSessionUpdate(session);
      }
    } else if (alarm.name === ALARM_NAMES.ENDING_WINDOW) {
      const result = await SessionEngine.finalizeEndingSession();
      if (result) {
        this.broadcastSessionUpdate(result.session);
      }
    }
  }

  /**
   * Notify content scripts and open views of state update
   */
  static broadcastSessionUpdate(session: any): void {
    if (typeof chrome === 'undefined' || !chrome.tabs) return;
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'ACTIVE_SESSION_UPDATE',
            session
          }).catch(() => {
            // Ignore errors for tabs without content script injected
          });
        }
      }
    });
  }
}
