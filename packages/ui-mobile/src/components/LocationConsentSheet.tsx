import React from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../theme';
import { uiCopy } from '../copy';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { LinkButton } from './LinkButton';

export interface LocationConsentRow {
  label: string;
  value: string;
}

export interface LocationConsentLinkRow {
  label: string;
  onPress: () => void;
  accessibilityHint?: string;
}

export interface LocationConsentSheetProps {
  visible: boolean;
  title: string;
  rows: readonly LocationConsentRow[];
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
  primaryLoading?: boolean;
  primaryLoadingLabel?: string;
  errorMessage?: string;
  linkRow?: LocationConsentLinkRow;
  maxBodyHeightRatio?: number;
  testID?: string;
}

const DEFAULT_MAX_BODY_HEIGHT_RATIO = 0.7;
const SHEET_CHROME_RESERVE_DP = 320;

export function LocationConsentSheet({
  visible,
  title,
  rows,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  primaryLoading = false,
  primaryLoadingLabel,
  errorMessage,
  linkRow,
  maxBodyHeightRatio = DEFAULT_MAX_BODY_HEIGHT_RATIO,
  testID,
}: LocationConsentSheetProps): React.JSX.Element {
  const theme = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const bodyMaxHeight = Math.round(
    Math.min(windowHeight * maxBodyHeightRatio, windowHeight - SHEET_CHROME_RESERVE_DP),
  );
  const onClose = primaryLoading ? noop : (onSecondary ?? onPrimary);

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} testID={testID}>
      <ScrollView
        style={{ flexGrow: 0, maxHeight: bodyMaxHeight }}
        contentContainerStyle={{ gap: theme.spacing.md, paddingBottom: theme.spacing.md }}
        showsVerticalScrollIndicator
        persistentScrollbar
        accessibilityHint={uiCopy.consentScrollHint}
        testID={testID ? `${testID}-body` : undefined}
      >
        {rows.map((row) => (
          <View key={row.label} accessible accessibilityLabel={`${row.label}. ${row.value}`}>
            <Text style={{ ...theme.typography.smallStrong, color: theme.colors.text }}>
              {row.label}
            </Text>
            <Text style={{ ...theme.typography.body, color: theme.colors.textMuted, marginTop: 2 }}>
              {row.value}
            </Text>
          </View>
        ))}
        {linkRow && (
          <View style={{ alignItems: 'flex-start' }}>
            <LinkButton
              label={linkRow.label}
              onPress={linkRow.onPress}
              accessibilityHint={linkRow.accessibilityHint}
              testID={testID ? `${testID}-link` : undefined}
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
        {errorMessage ? (
          <Text
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={{ ...theme.typography.small, color: theme.colors.dangerInk }}
            testID={testID ? `${testID}-error` : undefined}
          >
            {errorMessage}
          </Text>
        ) : null}
        <Button
          label={primaryLabel}
          size="lg"
          onPress={onPrimary}
          loading={primaryLoading}
          loadingLabel={primaryLoadingLabel}
          testID={testID ? `${testID}-primary` : undefined}
        />
        {secondaryLabel && onSecondary && (
          <Button
            label={secondaryLabel}
            variant="ghost"
            disabled={primaryLoading}
            onPress={onSecondary}
            testID={testID ? `${testID}-secondary` : undefined}
          />
        )}
      </View>
    </BottomSheet>
  );
}

function noop(): void {
  return undefined;
}
