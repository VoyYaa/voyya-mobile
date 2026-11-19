import React, { useState } from 'react';
import { DemoInfoSheet, DemoSessionTag, uiCopy } from '@voyyaa/ui-mobile';
import { useDemoSession } from './useDemoSession';

export interface DemoSessionNoticeProps {
  body: string;
  bullets: readonly string[];
  testID?: string;
}

export function DemoSessionNotice({
  body,
  bullets,
  testID = 'demo-session-tag',
}: DemoSessionNoticeProps): React.JSX.Element | null {
  const demo = useDemoSession();
  const [open, setOpen] = useState(false);
  if (demo === null) return null;

  return (
    <>
      <DemoSessionTag
        label={uiCopy.demo.tagLabel}
        accessibilityLabel={uiCopy.demo.tagAccessibility}
        accessibilityHint={uiCopy.demo.tagHint}
        onPress={() => setOpen(true)}
        testID={testID}
      />
      <DemoInfoSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={uiCopy.demo.infoTitle}
        body={body}
        bullets={bullets}
        okLabel={uiCopy.demo.infoOk}
      />
    </>
  );
}
