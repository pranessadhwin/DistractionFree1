import { StorageService } from './StorageService';
import { StorageData } from '../types/models';

export class SyncEngine {
  /**
   * Export all local data as structured JSON (Section 19.3)
   */
  static async exportDataAsJson(): Promise<string> {
    const data = await StorageService.getData();
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import data from structured JSON with validation
   */
  static async importDataFromJson(jsonStr: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonStr) as Partial<StorageData>;
      if (!parsed.sites || !parsed.goals) {
        throw new Error('Invalid backup schema: missing sites or goals');
      }

      await StorageService.setData({
        goals: parsed.goals || [],
        sites: parsed.sites || [],
        pastSelfMessages: parsed.pastSelfMessages || [],
        sessions: parsed.sessions || [],
        events: parsed.events || [],
        interventions: parsed.interventions || [],
        reflections: parsed.reflections || [],
        settings: parsed.settings || undefined,
        outbox: parsed.outbox || []
      });

      return true;
    } catch (err) {
      console.error('Import failed:', err);
      return false;
    }
  }

  /**
   * Reset data to initial clean state
   */
  static async resetAllData(): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await new Promise<void>((resolve) => chrome.storage.local.clear(() => resolve()));
    }
    await StorageService.getData(); // triggers re-initialization
  }

  /**
   * Outbox sync status
   */
  static async getOutboxCount(): Promise<number> {
    const data = await StorageService.getData();
    return data.outbox.length;
  }
}
