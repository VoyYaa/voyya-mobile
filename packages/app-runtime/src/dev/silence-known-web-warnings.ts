import { Platform } from 'react-native';

const KNOWN_WEB_WARNING_FRAGMENTS = ['non-boolean attribute', 'collapsable'];

function isKnownWebWarning(args: readonly unknown[]): boolean {
  const text = args.map(String).join(' ');
  return KNOWN_WEB_WARNING_FRAGMENTS.every((fragment) => text.includes(fragment));
}

export function silenceKnownWebWarnings(): void {
  if (Platform.OS !== 'web') return;
  const originalError = console.error.bind(console);
  console.error = (...args: unknown[]): void => {
    if (isKnownWebWarning(args)) return;
    originalError(...args);
  };
}
