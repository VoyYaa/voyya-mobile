import React from 'react';
import { Linking, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { BottomSheet, Button, LinkButton, uiCopy, useTheme } from '@voyyaa/ui-mobile';
import { DATA_CONTROLLER } from '@voyyaa/shared';
import { notificationsCopy } from '../copy/notifications-copy';
import { passengerCopy } from '../copy/passenger-copy';

export interface NotificationsPromptSheetProps {
  visible: boolean;
  loading: boolean;
  onAccept: () => void;
  onDecline: () => void;
  testID?: string;
}

const HAS_REAL_POLICY_URL = /^https?:\/\//.test(DATA_CONTROLLER.privacy_policy_url);
const BODY_MAX_HEIGHT_RATIO = 0.5;
const SHEET_CHROME_RESERVE_DP = 320;

function ignore(): void {
  return undefined;
}

export function NotificationsPromptSheet({
  visible,
  loading,
  onAccept,
  onDecline,
  testID = 'notifications-prompt-sheet',
}: NotificationsPromptSheetProps): React.JSX.Element {
  const theme = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const copy = notificationsCopy.sheet;
  const policy = passengerCopy.locationConsent;
  const bodyMaxHeight = Math.round(
    Math.min(windowHeight * BODY_MAX_HEIGHT_RATIO, windowHeight - SHEET_CHROME_RESERVE_DP),
  );

  return (
    <BottomSheet
      visible={visible}
      onClose={loading ? ignore : onDecline}
      title={copy.title}
      testID={testID}
    >
      <ScrollView
        style={{ flexGrow: 0, maxHeight: bodyMaxHeight }}
        contentContainerStyle={{ gap: theme.spacing.md, paddingBottom: theme.spacing.md }}
        showsVerticalScrollIndicator
        persistentScrollbar
        accessibilityHint={uiCopy.consentScrollHint}
        testID={`${testID}-body`}
      >
        <Text style={{ ...theme.typography.body, color: theme.colors.text }}>{copy.body}</Text>
        <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
          {copy.note}
        </Text>
        <Text
          style={{ ...theme.typography.small, color: theme.colors.textMuted }}
          testID={`${testID}-data-note`}
        >
          {copy.dataNote}
        </Text>
        {HAS_REAL_POLICY_URL && (
          <View style={{ alignItems: 'flex-start' }}>
            <LinkButton
              label={policy.fullPolicy}
              accessibilityHint={policy.fullPolicyHint}
              style={{ minHeight: theme.touch.comfortable }}
              onPress={() => void Linking.openURL(DATA_CONTROLLER.privacy_policy_url)}
              testID={`${testID}-policy`}
            />
          </View>
        )}
      </ScrollView>
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          paddingTop: theme.spacing.md,
          gap: theme.spacing.sm,
        }}
      >
        <Button
          label={copy.accept}
          loadingLabel={copy.accepting}
          accessibilityHint={copy.acceptHint}
          size="lg"
          loading={loading}
          onPress={onAccept}
          testID={`${testID}-accept`}
        />
        <Button
          label={copy.decline}
          variant="ghost"
          disabled={loading}
          onPress={onDecline}
          testID={`${testID}-decline`}
        />
      </View>
    </BottomSheet>
  );
}
