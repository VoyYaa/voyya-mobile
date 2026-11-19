import React from 'react';
import { DemoSessionNotice } from '@voyyaa/app-runtime';
import { passengerCopy } from '../copy/passenger-copy';

const copy = passengerCopy.demo;

export function DemoTag(): React.JSX.Element {
  return <DemoSessionNotice body={copy.info.body} bullets={copy.info.bullets} />;
}
