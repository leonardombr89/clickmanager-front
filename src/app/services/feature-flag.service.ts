import { Injectable } from '@angular/core';

type FeatureMap = Record<string, boolean>;

@Injectable({
  providedIn: 'root'
})
export class FeatureFlagService {
  private readonly storageKey = 'feature_flags_mock';
  private readonly defaults: FeatureMap = {
    funcionarios: true
  };

  isEnabled(featureKey: string): boolean {
    const key = (featureKey || '').trim();
    if (!key) return false;
    const overrides = this.readOverrides();
    if (Object.prototype.hasOwnProperty.call(overrides, key)) {
      return !!overrides[key];
    }
    return !!this.defaults[key];
  }

  setEnabled(featureKey: string, enabled: boolean): void {
    const key = (featureKey || '').trim();
    if (!key) return;
    const overrides = this.readOverrides();
    overrides[key] = enabled;
    localStorage.setItem(this.storageKey, JSON.stringify(overrides));
  }

  private readOverrides(): FeatureMap {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
}

