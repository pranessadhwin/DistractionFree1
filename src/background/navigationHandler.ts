import { extractDomain, matchesDomain } from '../utils/domain';
import { StorageService } from '../core/StorageService';
import { SessionEngine } from '../core/SessionEngine';
import { AlarmHandler } from './alarmHandler';

export class NavigationHandler {
  /**
   * Determine if the navigated URL belongs to an enabled monitored domain
   */
  static async checkUrl(url: string): Promise<{
    isMonitored: boolean;
    domain: string;
    siteId?: string;
  }> {
    if (!url || url.startsWith('chrome://') || url.startsWith('edge://') || url.startsWith('chrome-extension://')) {
      return { isMonitored: false, domain: '' };
    }

    const domain = extractDomain(url);
    const data = await StorageService.getData();
    const matchedSite = data.sites.find((s) => s.isEnabled && matchesDomain(domain, s.domain));

    if (matchedSite) {
      return { isMonitored: true, domain: matchedSite.domain, siteId: matchedSite.id };
    }

    return { isMonitored: false, domain };
  }

  /**
   * Handle onBeforeNavigate / tab update
   */
  static async handleNavigation(tabId: number, url: string): Promise<void> {
    const { isMonitored, domain } = await this.checkUrl(url);
    if (!isMonitored) return;

    const session = await SessionEngine.handleSiteOpened(domain);
    AlarmHandler.broadcastSessionUpdate(session);
  }
}
