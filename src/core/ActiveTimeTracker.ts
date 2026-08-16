/**
 * ActiveTimeTracker
 * Measures accumulated monotonic active tab time.
 * Prevents wall-clock inflation during device sleep, minimized windows, or background tabs (Section 13.2).
 */
export class ActiveTimeTracker {
  private static lastTickTimestamp: number = Date.now();
  private static isTabActive: boolean = true;

  static setTabFocused(focused: boolean): void {
    this.isTabActive = focused;
    this.lastTickTimestamp = Date.now();
  }

  /**
   * Reconcile elapsed active seconds since last check.
   * If the gap is larger than 10 seconds (e.g. device slept or worker suspended),
   * only increment by max reasonable interval to avoid counting sleep as active distraction.
   */
  static tickActiveSeconds(previousActiveSeconds: number): number {
    const now = Date.now();
    const deltaMs = now - this.lastTickTimestamp;
    this.lastTickTimestamp = now;

    if (!this.isTabActive) {
      return previousActiveSeconds;
    }

    // If delta is huge (>10s), the computer was likely sleeping or tab was inactive
    if (deltaMs > 10000) {
      return previousActiveSeconds + 1;
    }

    const deltaSec = Math.max(1, Math.round(deltaMs / 1000));
    return previousActiveSeconds + deltaSec;
  }
}
