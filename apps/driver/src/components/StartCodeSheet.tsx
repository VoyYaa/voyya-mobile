import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import {
  BottomSheet,
  BrandSpinner,
  Button,
  LinkButton,
  MarkGlyph,
  OtpInput,
  useTheme,
} from '@voyyaa/ui-mobile';
import { START_CODE_LENGTH } from '@voyyaa/shared';
import { useNetworkStatus } from '@voyyaa/app-runtime';
import { useStartCodeSubmission } from '../hooks/useStartCodeSubmission';
import type { StartSheetMessage } from '../trip/start-code-flow';
import { driverCopy } from '../copy/driver-copy';

export type StartCodeSheetVariant = 'start' | 'already_started';

export interface StartCodeSheetProps {
  visible: boolean;
  variant: StartCodeSheetVariant;
  tripRequestId: number | null;
  attemptsRemaining: number | null;
  onClose: () => void;
  onStarted: () => void;
  onBlocked: () => void;
  onChanged: () => void;
}

const copy = driverCopy.startCode;
const FOCUS_DELAY_MS = 320;
const MESSAGE_GLYPH_SIZE = 16;
const MESSAGE_RESERVED_HEIGHT = 40;

function messageText(message: StartSheetMessage): string {
  switch (message.kind) {
    case 'offline':
      return copy.offline;
    case 'rate_limited':
      return copy.rateLimited;
    case 'checking':
      return copy.uncertain;
    case 'not_sent':
      return copy.notSent;
    case 'server':
      return copy.server;
    case 'invalid':
      if (message.attemptsRemaining === null) return copy.invalidUnknown;
      return message.attemptsRemaining === 1
        ? copy.invalidLast
        : copy.invalid(message.attemptsRemaining);
    case 'prior_attempts':
      return copy.priorAttempts(message.attemptsRemaining);
  }
}

function isErrorMessage(message: StartSheetMessage): boolean {
  return message.kind === 'invalid' || message.kind === 'server' || message.kind === 'not_sent';
}

export function StartCodeSheet({
  visible,
  variant,
  tripRequestId,
  attemptsRemaining,
  onClose,
  onStarted,
  onBlocked,
  onChanged,
}: StartCodeSheetProps): React.JSX.Element {
  const theme = useTheme();
  const online = useNetworkStatus() === 'online';
  const [focusReady, setFocusReady] = useState(false);
  const submission = useStartCodeSubmission({
    tripRequestId,
    attemptsRemaining,
    online,
    onStarted,
    onBlocked,
    onChanged,
  });
  const { view, digits, setDigits, submit, reset } = submission;
  const alreadyStarted = variant === 'already_started';

  useEffect(() => {
    if (!visible) {
      reset();
      setFocusReady(false);
      return;
    }
    const timer = setTimeout(() => setFocusReady(true), FOCUS_DELAY_MS);
    return () => clearTimeout(timer);
  }, [visible, reset]);

  useEffect(() => {
    if (view.otpStatus === 'success') {
      AccessibilityInfo.announceForAccessibility(copy.success);
    }
  }, [view.otpStatus]);

  const message = view.message;
  const messageIsError = message !== null && isErrorMessage(message);
  const messageColor = messageIsError ? theme.colors.dangerInk : theme.colors.infoInk;

  return (
    <BottomSheet
      visible={visible}
      onClose={view.dismissible ? onClose : () => undefined}
      title={alreadyStarted ? copy.alreadyStartedTitle : copy.sheetTitle}
      avoidKeyboard
      testID="start-code-sheet"
    >
      <Text style={{ ...theme.typography.body, color: theme.colors.text }}>
        {alreadyStarted ? copy.alreadyStartedBody : copy.sheetBody}
      </Text>

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
        <OtpInput
          length={START_CODE_LENGTH}
          value={digits}
          onChangeValue={setDigits}
          status={view.otpStatus}
          disabled={view.fieldDisabled}
          autoFocus={focusReady}
          autofill={false}
          accessibilityLabel={copy.inputLabel}
          testID="start-code-input"
        />
        <Text
          style={{
            ...theme.typography.small,
            color: theme.colors.textMuted,
            textAlign: 'center',
          }}
        >
          {copy.helper}
        </Text>
      </View>

      <View
        accessibilityRole={messageIsError ? 'alert' : undefined}
        accessibilityLiveRegion={messageIsError ? 'assertive' : 'polite'}
        style={{
          marginTop: theme.spacing.md,
          minHeight: MESSAGE_RESERVED_HEIGHT,
          gap: theme.spacing.xs,
        }}
        testID="start-code-message"
      >
        {view.lastAttemptWarning && (
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'flex-start' }}>
            <MarkGlyph glyph="error" size={MESSAGE_GLYPH_SIZE} animate={false} />
            <Text
              style={{ ...theme.typography.smallStrong, color: theme.colors.warningInk, flex: 1 }}
            >
              {copy.lastAttemptWarning}
            </Text>
          </View>
        )}
        {message && (
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'flex-start' }}>
            {message.kind === 'checking' ? (
              <BrandSpinner size={MESSAGE_GLYPH_SIZE} />
            ) : (
              <MarkGlyph
                glyph={messageIsError ? 'error' : message.kind === 'offline' ? 'offline' : 'clock'}
                size={MESSAGE_GLYPH_SIZE}
                animate={false}
              />
            )}
            <Text style={{ ...theme.typography.small, color: messageColor, flex: 1 }}>
              {messageText(message)}
            </Text>
          </View>
        )}
      </View>

      <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
        <Button
          label={alreadyStarted ? copy.alreadyStartedConfirm : copy.confirm}
          loadingLabel={copy.verifying}
          loading={view.busy}
          disabled={!view.confirmEnabled}
          size="lg"
          accessibilityHint={view.confirmEnabled ? undefined : copy.confirmDisabledHint}
          onPress={submit}
          testID="start-code-confirm"
        />
        <LinkButton
          label={alreadyStarted ? copy.alreadyStartedKeep : copy.back}
          tone="muted"
          disabled={!view.dismissible}
          onPress={onClose}
          testID="start-code-back"
        />
      </View>
    </BottomSheet>
  );
}
