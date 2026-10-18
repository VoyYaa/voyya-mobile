import React, { useEffect } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import { BrandSpinner, Button, Card, MarkGlyph, Skeleton, useTheme } from '@voyyaa/ui-mobile';
import { START_CODE_LENGTH } from '@voyyaa/shared';
import { passengerCopy } from '../copy/passenger-copy';
import {
  spokenDigits,
  spokenPlate,
  startCodeStatusLine,
  type StartCodeCardView,
  type StartCodeStatusLine,
} from '../lib/start-code-view';

export interface StartCodeCardProps {
  view: StartCodeCardView;
  plate: string | null;
  arrived: boolean;
  changed: boolean;
  onRetry: () => void;
}

const copy = passengerCopy.startCode;
const BOX_MAX_WIDTH = 72;
const BOX_MIN_HEIGHT = 84;
const MAX_FONT_MULTIPLIER = 1.2;
const EMPTY_GLYPH_SIZE = 40;
const NOTE_GLYPH_SIZE = 16;

function instruction(plate: string | null, arrived: boolean): string {
  if (plate === null) return arrived ? copy.instructionNoPlateArrived : copy.instructionNoPlate;
  return arrived ? copy.instructionArrived(plate) : copy.instructionBeforeArrival(plate);
}

function StatusLine({ line }: { line: StartCodeStatusLine }): React.JSX.Element {
  const theme = useTheme();
  const glyphColor = theme.colors.onStageMuted;

  return (
    <View
      importantForAccessibility="no-hide-descendants"
      testID="start-code-status"
      style={{
        flexDirection: 'row',
        alignItems: line.plain ? 'center' : 'flex-start',
        gap: theme.spacing.sm,
      }}
    >
      <View style={{ paddingTop: line.plain ? 0 : 2 }}>
        {line.glyph === 'checking' ? (
          <BrandSpinner size={NOTE_GLYPH_SIZE} color={glyphColor} />
        ) : (
          <MarkGlyph glyph={line.glyph} size={NOTE_GLYPH_SIZE} color={glyphColor} animate={false} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={
            line.plain
              ? { ...theme.typography.small, color: theme.colors.onStageMuted }
              : { ...theme.typography.smallStrong, color: theme.colors.onStage }
          }
        >
          {line.title}
        </Text>
        {line.detail !== null && (
          <Text style={{ ...theme.typography.small, color: theme.colors.onStageMuted }}>
            {line.detail}
          </Text>
        )}
      </View>
    </View>
  );
}

export function StartCodeCard({
  view,
  plate,
  arrived,
  changed,
  onRetry,
}: StartCodeCardProps): React.JSX.Element | null {
  const theme = useTheme();
  const code = view.kind === 'code' ? view.code : null;

  useEffect(() => {
    if (changed && code !== null) {
      AccessibilityInfo.announceForAccessibility(copy.changedAnnouncement(spokenDigits(code)));
    }
  }, [changed, code]);

  useEffect(() => {
    if (view.kind === 'blocked') {
      AccessibilityInfo.announceForAccessibility(copy.blockedAnnouncement);
    }
  }, [view.kind]);

  if (view.kind === 'hidden') return null;

  const cardStyle = { borderWidth: 2, borderColor: theme.colors.brand };

  if (view.kind === 'loading') {
    return (
      <Card
        tone="stage"
        style={cardStyle}
        accessibilityLabel={copy.loadingLabel}
        testID="start-code-card"
      >
        <Text style={{ ...theme.typography.eyebrow, color: theme.colors.brand }}>
          {copy.eyebrow}
        </Text>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
          {Array.from({ length: START_CODE_LENGTH }, (_, index) => (
            <View key={index} style={{ flex: 1, maxWidth: BOX_MAX_WIDTH }}>
              <Skeleton height={BOX_MIN_HEIGHT} radius={theme.radius.field} />
            </View>
          ))}
        </View>
      </Card>
    );
  }

  if (view.kind === 'empty' || view.kind === 'blocked') {
    const title =
      view.kind === 'blocked'
        ? copy.blockedTitle
        : view.reason === 'offline'
          ? copy.offlineEmptyTitle
          : copy.errorEmptyTitle;
    const body =
      view.kind === 'blocked'
        ? copy.blockedBody
        : view.reason === 'offline'
          ? copy.offlineEmptyBody
          : copy.errorEmptyBody;
    const glyph = view.kind === 'empty' && view.reason === 'offline' ? 'offline' : 'error';

    return (
      <Card tone="stage" style={cardStyle} testID="start-code-card">
        <View style={{ alignItems: 'center', gap: theme.spacing.sm }}>
          <MarkGlyph
            glyph={glyph}
            size={EMPTY_GLYPH_SIZE}
            color={theme.colors.onStageMuted}
            animate={false}
          />
          <View accessible accessibilityRole="alert" style={{ gap: theme.spacing.xs }}>
            <Text
              style={{
                ...theme.typography.subtitle,
                color: theme.colors.onStage,
                textAlign: 'center',
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                ...theme.typography.body,
                color: theme.colors.onStageMuted,
                textAlign: 'center',
              }}
            >
              {body}
            </Text>
          </View>
          {view.kind === 'empty' && (
            <Button
              label={copy.retry}
              variant="ghostOnStage"
              size="sm"
              onPress={onRetry}
              testID="start-code-retry"
            />
          )}
        </View>
      </Card>
    );
  }

  const digits = view.code.split('');
  const statusLine = startCodeStatusLine(view.note, view.savedAt);
  const spoken = copy.saved.accessibility(
    spokenDigits(view.code),
    instruction(plate === null ? null : spokenPlate(plate), arrived),
    statusLine === null ? null : copy.saved.spokenStatus(statusLine.title, statusLine.detail),
  );

  return (
    <Card tone="stage" style={cardStyle} testID="start-code-card">
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={spoken}
        style={{ gap: theme.spacing.md }}
      >
        <Text
          importantForAccessibility="no-hide-descendants"
          style={{ ...theme.typography.eyebrow, color: theme.colors.brand }}
        >
          {copy.eyebrow}
        </Text>

        {changed && (
          <View
            importantForAccessibility="no-hide-descendants"
            style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}
          >
            <MarkGlyph glyph="success" size={NOTE_GLYPH_SIZE} animate={false} />
            <Text style={{ ...theme.typography.smallStrong, color: theme.colors.brand, flex: 1 }}>
              {copy.changed}
            </Text>
          </View>
        )}

        <View
          importantForAccessibility="no-hide-descendants"
          style={{ flexDirection: 'row', gap: theme.spacing.sm }}
        >
          {digits.map((digit, index) => (
            <View
              key={index}
              testID={`start-code-digit-${index}`}
              style={{
                flex: 1,
                maxWidth: BOX_MAX_WIDTH,
                minHeight: BOX_MIN_HEIGHT,
                backgroundColor: theme.colors.stage,
                borderRadius: theme.radius.field,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                selectable={false}
                numberOfLines={1}
                adjustsFontSizeToFit
                maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}
                style={{ ...theme.typography.timer, color: theme.colors.onStage }}
              >
                {digit}
              </Text>
            </View>
          ))}
        </View>

        {statusLine !== null && <StatusLine line={statusLine} />}

        <Text
          importantForAccessibility="no-hide-descendants"
          selectable={false}
          style={{ ...theme.typography.body, color: theme.colors.onStage }}
        >
          {instruction(plate, arrived)}
        </Text>
        {statusLine === null && (
          <Text
            importantForAccessibility="no-hide-descendants"
            style={{ ...theme.typography.small, color: theme.colors.onStageMuted }}
          >
            {copy.onlyDriverNote}
          </Text>
        )}
      </View>
    </Card>
  );
}
