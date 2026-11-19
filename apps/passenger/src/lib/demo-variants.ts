import { demoCopy } from '../copy/demo-copy';

export type CallAction = 'call' | 'disabled' | 'hidden';

export function callAction(contactPhone: string | null | undefined, demo: boolean): CallAction {
  if (contactPhone) return 'call';
  return demo ? 'hidden' : 'disabled';
}

export function trackingUnavailableDetail(realText: string, demo: boolean): string {
  return demo ? demoCopy.trackingUnavailableBody : realText;
}

export function tripCompletedBody(realText: string, demo: boolean): string {
  return demo ? demoCopy.completedBody : realText;
}
