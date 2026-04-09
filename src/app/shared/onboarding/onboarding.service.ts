import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import { fromEvent, merge, Subscription } from 'rxjs';
import { auditTime } from 'rxjs/operators';
import { OnboardingHighlightRect, OnboardingStep, OnboardingTourConfig } from './onboarding-step.model';

export interface OnboardingCompletionEvent {
  tourId: string;
  reason: 'finished' | 'skipped';
}

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly document = inject(DOCUMENT);
  private readonly activeTourSignal = signal<OnboardingTourConfig | null>(null);
  private readonly currentIndexSignal = signal(0);
  private readonly currentStepSignal = signal<OnboardingStep | null>(null);
  private readonly highlightRectSignal = signal<OnboardingHighlightRect | null>(null);
  private readonly completionSignal = signal<OnboardingCompletionEvent | null>(null);
  private viewportSubscription: Subscription | null = null;
  private measureTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly activeTour = computed(() => this.activeTourSignal());
  readonly currentStep = computed(() => this.currentStepSignal());
  readonly currentIndex = computed(() => this.currentIndexSignal());
  readonly totalSteps = computed(() => this.activeTourSignal()?.steps.length ?? 0);
  readonly highlightRect = computed(() => this.highlightRectSignal());
  readonly isActive = computed(() => !!this.currentStepSignal());
  readonly canGoBack = computed(() => this.currentIndexSignal() > 0);
  readonly isLastStep = computed(() => this.currentIndexSignal() >= Math.max(this.totalSteps() - 1, 0));
  readonly completion = computed(() => this.completionSignal());

  start(config: OnboardingTourConfig, force = false): boolean {
    if (!force && this.wasSeen(config.storageKey)) {
      return false;
    }

    this.stop();
    this.completionSignal.set(null);
    this.activeTourSignal.set(config);
    this.bindViewportListeners();
    return this.goToStep(0, 1);
  }

  startIfNeeded(config: OnboardingTourConfig): boolean {
    return this.start(config, false);
  }

  restart(config: OnboardingTourConfig): boolean {
    return this.start(config, true);
  }

  next(): void {
    if (!this.activeTourSignal()) {
      return;
    }

    if (!this.goToStep(this.currentIndexSignal() + 1, 1)) {
      this.finish();
    }
  }

  previous(): void {
    if (!this.activeTourSignal()) {
      return;
    }

    this.goToStep(this.currentIndexSignal() - 1, -1);
  }

  skip(): void {
    this.persistSeen();
    const tourId = this.activeTourSignal()?.id;
    if (tourId) {
      this.completionSignal.set({ tourId, reason: 'skipped' });
    }
    this.stop();
  }

  finish(): void {
    this.persistSeen();
    const tourId = this.activeTourSignal()?.id;
    if (tourId) {
      this.completionSignal.set({ tourId, reason: 'finished' });
    }
    this.stop();
  }

  clearCompletion(): void {
    this.completionSignal.set(null);
  }

  stop(): void {
    this.clearScheduledMeasure();
    this.viewportSubscription?.unsubscribe();
    this.viewportSubscription = null;
    this.activeTourSignal.set(null);
    this.currentStepSignal.set(null);
    this.highlightRectSignal.set(null);
    this.currentIndexSignal.set(0);
  }

  remeasure(): void {
    const step = this.currentStepSignal();
    if (!step) {
      return;
    }

    const element = this.findTargetElement(step);
    if (!element) {
      return;
    }

    this.highlightRectSignal.set(this.buildRect(element.getBoundingClientRect()));
  }

  private goToStep(index: number, direction: 1 | -1): boolean {
    const tour = this.activeTourSignal();
    if (!tour?.steps.length) {
      this.stop();
      return false;
    }

    const validIndex = this.findExistingStepIndex(index, direction);
    if (validIndex === null) {
      return false;
    }

    const step = tour.steps[validIndex];
    const element = this.findTargetElement(step);
    if (!element) {
      return false;
    }

    this.currentIndexSignal.set(validIndex);
    this.currentStepSignal.set(step);
    this.scrollToElement(element, step);
    this.measureElement(element);
    return true;
  }

  private findExistingStepIndex(startIndex: number, direction: 1 | -1): number | null {
    const steps = this.activeTourSignal()?.steps ?? [];
    if (!steps.length) {
      return null;
    }

    let cursor = startIndex;
    while (cursor >= 0 && cursor < steps.length) {
      if (this.findTargetElement(steps[cursor])) {
        return cursor;
      }
      cursor += direction;
    }

    return null;
  }

  private findTargetElement(step: OnboardingStep): HTMLElement | null {
    const selectors = Array.isArray(step.target) ? step.target : [step.target];

    for (const selector of selectors) {
      const elements = Array.from(this.document.querySelectorAll(selector));
      for (const element of elements) {
        if (!(element instanceof HTMLElement)) {
          continue;
        }

        const rect = element.getBoundingClientRect();
        if (!rect.width || !rect.height) {
          continue;
        }

        return element;
      }
    }

    return null;
  }

  private scrollToElement(element: HTMLElement, step: OnboardingStep): void {
    element.scrollIntoView({
      behavior: 'smooth',
      block: step.scrollBlock ?? 'center',
      inline: 'nearest',
    });
  }

  private measureElement(element: HTMLElement): void {
    this.clearScheduledMeasure();
    this.highlightRectSignal.set(this.buildRect(element.getBoundingClientRect()));
    this.measureTimeout = setTimeout(() => {
      this.highlightRectSignal.set(this.buildRect(element.getBoundingClientRect()));
      this.measureTimeout = null;
    }, 260);
  }

  private buildRect(rect: DOMRect): OnboardingHighlightRect {
    const padding = 10;
    const top = Math.max(rect.top - padding, 8);
    const left = Math.max(rect.left - padding, 8);
    const right = Math.min(rect.right + padding, window.innerWidth - 8);
    const bottom = Math.min(rect.bottom + padding, window.innerHeight - 8);

    return {
      top,
      left,
      right,
      bottom,
      width: Math.max(right - left, 0),
      height: Math.max(bottom - top, 0),
    };
  }

  private bindViewportListeners(): void {
    this.viewportSubscription = merge(
      fromEvent(window, 'resize'),
      fromEvent(window, 'scroll', { capture: true }),
    )
      .pipe(auditTime(16))
      .subscribe(() => this.remeasure());
  }

  private persistSeen(): void {
    const storageKey = this.activeTourSignal()?.storageKey;
    if (!storageKey) {
      return;
    }

    try {
      localStorage.setItem(storageKey, 'true');
    } catch {
      // Ignore localStorage failures to keep the tour functional.
    }
  }

  private wasSeen(storageKey: string): boolean {
    try {
      return localStorage.getItem(storageKey) === 'true';
    } catch {
      return false;
    }
  }

  private clearScheduledMeasure(): void {
    if (this.measureTimeout) {
      clearTimeout(this.measureTimeout);
      this.measureTimeout = null;
    }
  }
}
