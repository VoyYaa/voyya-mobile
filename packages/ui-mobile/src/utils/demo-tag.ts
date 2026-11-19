export const DEMO_TAG_HEIGHT = 32;
export const DEMO_TAG_DOT_SIZE = 8;
export const DEMO_TAG_PRESSED_OPACITY = 0.85;
export const DEMO_TAG_MAX_FONT_MULTIPLIER = 1.3;

export interface DemoTagA11y {
  accessibilityRole: 'button';
  accessibilityLabel: string;
  accessibilityHint: string | undefined;
}

export function demoTagA11y(label: string, hint?: string): DemoTagA11y {
  return { accessibilityRole: 'button', accessibilityLabel: label, accessibilityHint: hint };
}

export function demoTagContainerMinHeight(touchMin: number): number {
  return Math.max(touchMin, DEMO_TAG_HEIGHT);
}
