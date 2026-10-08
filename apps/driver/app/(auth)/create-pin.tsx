import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AccentText,
  BrandMark,
  Button,
  LinkButton,
  Reveal,
  Stage,
  StatePanel,
  TextField,
  formatMMSS,
  useTheme,
} from '@voyyaa/ui-mobile';
import { DRIVER_PIN_LENGTH } from '@voyyaa/shared';
import { useLogout, useNetworkStatus } from '@voyyaa/app-runtime';
import { AuthNoticeCard } from '../../src/components/AuthNoticeCard';
import { InlineNotice } from '../../src/components/InlineNotice';
import { PinLogoutSheet } from '../../src/components/PinLogoutSheet';
import { PinRuleRow } from '../../src/components/PinRuleRow';
import { pinRuleStatus } from '../../src/auth/pin-rules';
import { useConsumedBackPress } from '../../src/hooks/useConsumedBackPress';
import { useCreatePinForm } from '../../src/hooks/useCreatePinForm';
import { driverCopy } from '../../src/copy/driver-copy';

const BRAND_MARK_SIZE = 56;
const CURRENT_PIN_MAX_LENGTH = 6;

function ignoreBackPress(): void {}

export default function CreatePinScreen(): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const offline = useNetworkStatus() === 'offline';
  const logout = useLogout();
  const form = useCreatePinForm();
  const [logoutVisible, setLogoutVisible] = useState(false);

  useConsumedBackPress(true, ignoreBackPress);

  const copy = driverCopy.createPin;
  const saving = form.outcome === 'saving';
  const locked = saving || form.block.isBlocked;
  const rules = pinRuleStatus(form.next);

  const renderBody = (): React.JSX.Element => {
    if (form.outcome === 'success') {
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${copy.successTitle}. ${copy.successBody}`}
          onPress={form.finishSuccess}
          testID="create-pin-success"
          style={{ minHeight: theme.touch.min }}
        >
          <StatePanel
            glyph="success"
            title={copy.successTitle}
            body={copy.successBody}
            accessibilityRole="alert"
          />
        </Pressable>
      );
    }

    if (form.outcome === 'expired') {
      return (
        <StatePanel
          glyph="clock"
          title={copy.expiredTitle}
          body={copy.expiredBody}
          accessibilityRole="alert"
          primaryAction={{ label: copy.expiredAction, onPress: () => logout.mutate() }}
          testID="create-pin-expired"
        />
      );
    }

    return (
      <>
        {form.showCurrent && (
          <TextField
            label={copy.currentLabel}
            value={form.current}
            onChangeText={form.setCurrent}
            keyboardType="number-pad"
            maxLength={CURRENT_PIN_MAX_LENGTH}
            secureTextEntry
            revealable
            autoComplete="off"
            disabled={locked}
            error={form.currentError}
            accessibilityHint={copy.currentHint}
            testID="current-pin-input"
          />
        )}
        <TextField
          label={copy.nextLabel}
          value={form.next}
          onChangeText={form.setNext}
          helper={copy.nextHelper}
          keyboardType="number-pad"
          maxLength={DRIVER_PIN_LENGTH}
          secureTextEntry
          revealable
          autoComplete="off"
          autoFocus
          disabled={locked}
          error={form.nextError}
          accessibilityHint={copy.nextHint}
          testID="new-pin-input"
        />
        <TextField
          label={copy.confirmLabel}
          value={form.confirmation}
          onChangeText={form.setConfirmation}
          keyboardType="number-pad"
          maxLength={DRIVER_PIN_LENGTH}
          secureTextEntry
          revealable
          autoComplete="off"
          returnKeyType="done"
          onSubmitEditing={form.submit}
          disabled={locked}
          error={form.confirmationError}
          accessibilityHint={copy.confirmHint}
          testID="confirm-pin-input"
        />

        <View style={{ gap: theme.spacing.xs }} testID="pin-rules">
          <PinRuleRow label={copy.ruleLength} met={rules.lengthMet} />
          <PinRuleRow label={copy.rulePattern} met={rules.patternMet} />
        </View>

        {form.block.isBlocked && (
          <AuthNoticeCard
            glyph="clock"
            title={copy.blockedTitle}
            body={
              form.block.timeKnown
                ? copy.blockedKnown(formatMMSS(form.block.remainingSec))
                : copy.blockedUnknown
            }
            testID="create-pin-blocked"
          />
        )}

        {form.outcome === 'server' && (
          <InlineNotice tone="danger" message={copy.serverError} testID="create-pin-error" />
        )}

        {form.outcome === 'offline' && (
          <InlineNotice
            tone="info"
            message={copy.offlineFailed}
            testID="create-pin-offline-failed"
          />
        )}

        {offline && form.outcome !== 'offline' && (
          <InlineNotice tone="info" message={copy.offlineBanner} testID="create-pin-offline" />
        )}

        {!form.block.isBlocked && (
          <Button
            label={form.outcome === 'server' ? copy.retry : copy.submit}
            onPress={form.submit}
            size="lg"
            disabled={!form.ready || offline}
            loading={saving}
            loadingLabel={copy.saving}
            accessibilityHint={
              offline ? copy.offlineHint : form.ready ? undefined : copy.submitHint
            }
            testID="save-pin-button"
          />
        )}

        <View style={{ alignItems: 'center' }}>
          <LinkButton
            label={copy.logout}
            tone="muted"
            disabled={saving}
            onPress={() => setLogoutVisible(true)}
            style={{ alignSelf: 'center' }}
            testID="create-pin-logout"
          />
        </View>
      </>
    );
  };

  return (
    <Stage safeTop topInset={insets.top} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + theme.spacing.lg }}
        >
          <View
            style={{
              paddingHorizontal: theme.spacing.gutter,
              paddingTop: theme.spacing.xl,
              gap: theme.spacing.md,
            }}
          >
            <Reveal index={0}>
              <BrandMark role="driver" size={BRAND_MARK_SIZE} wordmark />
            </Reveal>
            <Reveal index={1}>
              <AccentText
                accent={copy.titleAccent}
                color={theme.colors.onStage}
                testID="create-pin-title"
              >
                {copy.title}
              </AccentText>
            </Reveal>
            <Text style={{ ...theme.typography.body, color: theme.colors.onStageMuted }}>
              {copy.body}
            </Text>
          </View>

          <Reveal index={2} style={{ marginTop: theme.spacing.xl }}>
            <View
              style={{
                backgroundColor: theme.colors.bg,
                borderRadius: theme.radius.sheet,
                marginHorizontal: theme.spacing.sm,
                padding: theme.spacing.lg,
                gap: theme.spacing.lg,
              }}
            >
              {renderBody()}
            </View>
          </Reveal>
        </ScrollView>
      </KeyboardAvoidingView>

      <PinLogoutSheet
        visible={logoutVisible}
        loggingOut={logout.isPending}
        onConfirm={() => logout.mutate()}
        onClose={() => setLogoutVisible(false)}
      />
    </Stage>
  );
}
