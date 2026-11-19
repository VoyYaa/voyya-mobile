import React from 'react';
import { DemoSessionNotice } from '@voyyaa/app-runtime';
import { driverCopy } from '../copy/driver-copy';

const copy = driverCopy.demo;

export function DemoTag(): React.JSX.Element {
  return <DemoSessionNotice body={copy.info.body} bullets={copy.info.bullets} />;
}
