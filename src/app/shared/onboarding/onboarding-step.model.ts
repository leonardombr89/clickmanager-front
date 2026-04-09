export type OnboardingTooltipPlacement = 'auto' | 'top' | 'right' | 'bottom' | 'left';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target: string | string[];
  preferredPlacement?: OnboardingTooltipPlacement;
  scrollBlock?: ScrollLogicalPosition;
  ctaHint?: string;
}

export interface OnboardingTourConfig {
  id: string;
  storageKey: string;
  steps: OnboardingStep[];
}

export interface OnboardingHighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}
