import React, { useState } from 'react';
import { DemoInfoSheet, DemoSessionTag, uiCopy } from '@voyyaa/ui-mobile';
import { useDemoSession } from '@voyyaa/app-runtime';
import { passengerCopy } from '../copy/passenger-copy';

const copy = passengerCopy.demo;

export function DemoTag(): React.JSX.Element | null {
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
        testID="demo-session-tag"
      />
      <DemoInfoSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={uiCopy.demo.infoTitle}
        body={copy.info.body}
        bullets={copy.info.bullets}
        okLabel={uiCopy.demo.infoOk}
      />
    </>
  );
}
