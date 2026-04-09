const LOCAL_LANDING_URL = 'http://127.0.0.1:4173/crm-software.html';

function isLocalDemoHost(hostname: string): boolean {
  return hostname === '127.0.0.1' || hostname === 'localhost';
}

export function getDemoLandingUrl(): string {
  if (typeof window === 'undefined') {
    return '/landingpage';
  }

  return isLocalDemoHost(window.location.hostname)
    ? LOCAL_LANDING_URL
    : `${window.location.origin}/crm-software.html`;
}

export function getDemoLandingContactUrl(): string {
  return `${getDemoLandingUrl()}#contact`;
}

export function isDemoLandingReferrer(referrer: string): boolean {
  if (!referrer) {
    return false;
  }

  return referrer.includes('127.0.0.1:4173')
    || referrer.includes('/crm-software.html')
    || referrer.includes('/landingpage');
}
