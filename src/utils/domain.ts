export function extractDomain(urlOrHostname: string): string {
  try {
    let hostname = urlOrHostname;
    if (urlOrHostname.startsWith('http://') || urlOrHostname.startsWith('https://')) {
      const parsed = new URL(urlOrHostname);
      hostname = parsed.hostname;
    }
    hostname = hostname.toLowerCase();
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }
    if (hostname.startsWith('m.')) {
      hostname = hostname.slice(2);
    }
    return hostname;
  } catch {
    return urlOrHostname.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  }
}

export function matchesDomain(url: string, monitoredDomain: string): boolean {
  const currentDomain = extractDomain(url);
  const targetDomain = extractDomain(monitoredDomain);
  return currentDomain === targetDomain || currentDomain.endsWith(`.${targetDomain}`);
}
