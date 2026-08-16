export function formatSeconds(seconds: number): string {
  if (seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins === 0) {
    return `${secs}s`;
  }
  if (secs === 0) {
    return `${mins}m`;
  }
  return `${mins}m ${secs}s`;
}

export function formatTimeRange(startIso: string, endIso?: string): string {
  const start = new Date(startIso);
  const startStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (!endIso) return `Started at ${startStr}`;
  const end = new Date(endIso);
  const endStr = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${startStr} - ${endStr}`;
}

export function formatRelativeDate(isoDate: string): string {
  const now = Date.now();
  const date = new Date(isoDate).getTime();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}d ago`;
  return new Date(isoDate).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function getIsoUtcNow(): string {
  return new Date().toISOString();
}
