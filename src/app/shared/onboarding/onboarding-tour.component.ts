import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  ViewEncapsulation,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { OnboardingHighlightRect, OnboardingTooltipPlacement } from './onboarding-step.model';
import { OnboardingService } from './onboarding.service';

type TooltipPlacement = Exclude<OnboardingTooltipPlacement, 'auto'>;

@Component({
  selector: 'app-onboarding-tour',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './onboarding-tour.component.html',
  styleUrl: './onboarding-tour.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class OnboardingTourComponent implements AfterViewInit {
  private readonly onboarding = inject(OnboardingService);
  @ViewChild('tooltipCard') private tooltipCard?: ElementRef<HTMLElement>;
  private touchStartX = 0;
  private touchStartY = 0;

  readonly active = this.onboarding.isActive;
  readonly step = this.onboarding.currentStep;
  readonly rect = this.onboarding.highlightRect;
  readonly currentIndex = this.onboarding.currentIndex;
  readonly totalSteps = this.onboarding.totalSteps;
  readonly canGoBack = this.onboarding.canGoBack;
  readonly isLastStep = this.onboarding.isLastStep;
  readonly progressLabel = computed(() => `${this.currentIndex() + 1} de ${this.totalSteps()}`);
  readonly progressPercent = computed(() => {
    const total = this.totalSteps();
    if (!total) {
      return 0;
    }

    return ((this.currentIndex() + 1) / total) * 100;
  });
  readonly placement = signal<TooltipPlacement>('bottom');
  readonly tooltipStyles = signal<Record<string, string>>({});
  readonly viewport = signal({ width: window.innerWidth, height: window.innerHeight });
  readonly isMobile = computed(() => this.viewport().width <= 768);

  readonly overlayTop = computed(() => this.rect()?.top ?? 0);
  readonly overlayBottom = computed(() => {
    const rect = this.rect();
    return rect ? Math.max(this.viewport().height - rect.bottom, 0) : 0;
  });
  readonly overlayLeft = computed(() => this.rect()?.left ?? 0);
  readonly overlayRight = computed(() => {
    const rect = this.rect();
    return rect ? Math.max(this.viewport().width - rect.right, 0) : 0;
  });

  constructor() {
    effect(() => {
      const active = this.active();
      const rect = this.rect();
      const step = this.step();
      if (!active || !rect || !step) {
        this.tooltipStyles.set({});
        return;
      }

      queueMicrotask(() => this.positionTooltip(rect));
    });
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.positionTooltip(this.rect()));
  }

  @HostListener('window:resize')
  @HostListener('window:scroll')
  onViewportChange(): void {
    this.viewport.set({ width: window.innerWidth, height: window.innerHeight });
    this.positionTooltip(this.rect());
  }

  next(): void {
    this.onboarding.next();
  }

  previous(): void {
    this.onboarding.previous();
  }

  skip(): void {
    this.onboarding.skip();
  }

  finish(): void {
    this.onboarding.finish();
  }

  onTouchStart(event: TouchEvent): void {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  }

  onTouchEnd(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    if (!touch || !this.isMobile()) {
      return;
    }

    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;

    if (Math.abs(deltaX) < 56 || Math.abs(deltaX) < Math.abs(deltaY)) {
      return;
    }

    if (deltaX < 0) {
      if (this.isLastStep()) {
        this.finish();
      } else {
        this.next();
      }
      return;
    }

    if (this.canGoBack()) {
      this.previous();
    }
  }

  private positionTooltip(rect: OnboardingHighlightRect | null): void {
    const tooltip = this.tooltipCard?.nativeElement;
    const step = this.step();
    if (!tooltip || !rect || !step) {
      return;
    }

    const viewport = this.viewport();
    const gap = 18;
    const padding = 16;
    const tooltipRect = tooltip.getBoundingClientRect();
    const tooltipWidth = Math.min(tooltipRect.width || 320, viewport.width - (padding * 2));
    const tooltipHeight = tooltipRect.height || 220;
    const preferred = step.preferredPlacement ?? 'auto';

    const spaces = {
      top: rect.top,
      right: viewport.width - rect.right,
      bottom: viewport.height - rect.bottom,
      left: rect.left,
    };

    const placements: TooltipPlacement[] =
      preferred === 'auto'
        ? (['bottom', 'top', 'right', 'left'] as TooltipPlacement[])
        : ([preferred, 'bottom', 'top', 'right', 'left'] as TooltipPlacement[]);

    const chosen =
      placements.find((placement) => {
        if (placement === 'top' || placement === 'bottom') {
          return spaces[placement] >= tooltipHeight + gap + padding;
        }
        return spaces[placement] >= tooltipWidth + gap + padding;
      }) ?? (viewport.width <= 768 ? 'bottom' : 'right');

    let top = rect.bottom + gap;
    let left = rect.left;

    switch (chosen) {
      case 'top':
        top = rect.top - tooltipHeight - gap;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'right':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.right + gap;
        break;
      case 'left':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.left - tooltipWidth - gap;
        break;
      default:
        top = rect.bottom + gap;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
    }

    const maxLeft = viewport.width - tooltipWidth - padding;
    const maxTop = viewport.height - tooltipHeight - padding;

    left = Math.min(Math.max(left, padding), Math.max(maxLeft, padding));
    top = Math.min(Math.max(top, padding), Math.max(maxTop, padding));

    if (viewport.width <= 768) {
      const mobileWidth = viewport.width - (padding * 2);
      left = padding;
      const targetNearBottom = rect.bottom >= viewport.height - 140;
      const topFromBottomSheet = Math.max(
        viewport.height - tooltipHeight - 18 - (window.visualViewport?.offsetTop ?? 0),
        padding,
      );
      const topAboveTarget = Math.max(rect.top - tooltipHeight - 14, padding);

      top = targetNearBottom ? topAboveTarget : topFromBottomSheet;
      this.tooltipStyles.set({
        top: `${top}px`,
        left: `${left}px`,
        width: `${mobileWidth}px`,
      });
      this.placement.set(targetNearBottom ? 'top' : 'bottom');
      return;
    }

    this.placement.set(chosen);
    this.tooltipStyles.set({
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
    });
  }
}
