import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { isDemoLandingReferrer } from './demo-links';

export type DemoEventName =
  | 'demo_viewed'
  | 'demo_tour_started'
  | 'demo_tour_skipped'
  | 'demo_tour_completed'
  | 'demo_calculation_completed'
  | 'demo_order_generated'
  | 'demo_whatsapp_previewed'
  | 'demo_cta_signup_clicked'
  | 'demo_cta_specialist_clicked'
  | 'demo_exit_clicked';

export interface DemoAnalyticsEventPayload {
  sessionId: string;
  anonymousId: string;
  event: DemoEventName;
  page: string;
  step: string;
  timestamp: string;
  deviceType: string;
  source: string;
  referrer: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  metadata?: Record<string, unknown> | null;
}

interface AttributionData {
  source: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
}

@Injectable({ providedIn: 'root' })
export class DemoAnalyticsService {
  private static readonly SESSION_ID_KEY = 'demo-analytics-session-id';
  private static readonly ANONYMOUS_ID_KEY = 'demo-analytics-anonymous-id';
  private static readonly ONCE_PREFIX = 'demo-analytics-once:';
  private static readonly ATTRIBUTION_KEY = 'demo-analytics-attribution';

  private readonly endpoint = `${environment.apiUrl}/api/demo/analytics/event`;

  track(
    event: DemoEventName,
    page: string,
    step: string,
    metadata?: Record<string, unknown> | null,
    options?: { onceKey?: string | null },
  ): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (options?.onceKey && this.wasSent(options.onceKey)) {
      return;
    }

    const payload: DemoAnalyticsEventPayload = {
      sessionId: this.getSessionId(),
      anonymousId: this.getAnonymousId(),
      event,
      page,
      step,
      timestamp: new Date().toISOString(),
      deviceType: this.detectDeviceType(),
      source: this.getAttribution().source,
      referrer: document.referrer ?? '',
      utmSource: this.getAttribution().utmSource,
      utmMedium: this.getAttribution().utmMedium,
      utmCampaign: this.getAttribution().utmCampaign,
      utmContent: this.getAttribution().utmContent,
      utmTerm: this.getAttribution().utmTerm,
      metadata: metadata ?? null,
    };

    if (options?.onceKey) {
      this.markSent(options.onceKey);
    }

    const body = JSON.stringify(payload);

    try {
      void fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
        mode: 'cors',
      });
    } catch {
      // Analytics da demo nunca deve quebrar o fluxo principal.
    }
  }

  private getSessionId(): string {
    const existing = sessionStorage.getItem(DemoAnalyticsService.SESSION_ID_KEY);
    if (existing) {
      return existing;
    }

    const next = this.generateId('sess');
    sessionStorage.setItem(DemoAnalyticsService.SESSION_ID_KEY, next);
    return next;
  }

  private getAnonymousId(): string {
    const existing = localStorage.getItem(DemoAnalyticsService.ANONYMOUS_ID_KEY);
    if (existing) {
      return existing;
    }

    const next = this.generateId('anon');
    localStorage.setItem(DemoAnalyticsService.ANONYMOUS_ID_KEY, next);
    return next;
  }

  private wasSent(key: string): boolean {
    try {
      return sessionStorage.getItem(`${DemoAnalyticsService.ONCE_PREFIX}${key}`) === 'true';
    } catch {
      return false;
    }
  }

  private markSent(key: string): void {
    try {
      sessionStorage.setItem(`${DemoAnalyticsService.ONCE_PREFIX}${key}`, 'true');
    } catch {
      // ignore
    }
  }

  private getAttribution(): AttributionData {
    const current = this.readAttributionFromUrl();
    if (current.source !== 'direct_demo'
      || current.utmSource
      || current.utmMedium
      || current.utmCampaign
      || current.utmContent
      || current.utmTerm) {
      this.persistAttribution(current);
      return current;
    }

    const stored = this.readStoredAttribution();
    return stored ?? current;
  }

  private readAttributionFromUrl(): AttributionData {
    const params = new URLSearchParams(window.location.search);
    const referrer = document.referrer ?? '';

    return {
      source: params.get('source')
        || (isDemoLandingReferrer(referrer) ? 'landing_demo' : 'direct_demo'),
      utmSource: params.get('utm_source'),
      utmMedium: params.get('utm_medium'),
      utmCampaign: params.get('utm_campaign'),
      utmContent: params.get('utm_content'),
      utmTerm: params.get('utm_term'),
    };
  }

  private persistAttribution(data: AttributionData): void {
    try {
      sessionStorage.setItem(DemoAnalyticsService.ATTRIBUTION_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  }

  private readStoredAttribution(): AttributionData | null {
    try {
      const raw = sessionStorage.getItem(DemoAnalyticsService.ATTRIBUTION_KEY);
      return raw ? JSON.parse(raw) as AttributionData : null;
    } catch {
      return null;
    }
  }

  private detectDeviceType(): string {
    const ua = navigator.userAgent.toLowerCase();
    if (/bot|crawler|spider|crawling/.test(ua)) {
      return 'bot';
    }

    const width = window.innerWidth;
    if (/ipad|tablet|playbook|silk/.test(ua) || (width > 768 && width <= 1024)) {
      return 'tablet';
    }

    if (/mobi|android|iphone|ipod/.test(ua) || width <= 768) {
      return 'mobile';
    }

    return 'desktop';
  }

  private generateId(prefix: string): string {
    const token =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID().replace(/-/g, '')
        : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

    return `${prefix}_${token}`;
  }
}
