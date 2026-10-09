import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import {
  BrandSpinner,
  Card,
  Map,
  MarkGlyph,
  TaxiMark,
  useTheme,
  type MapMarker,
} from '@voyyaa/ui-mobile';
import type { DriverTracking, Location } from '@voyyaa/shared';
import { passengerCopy } from '../copy/passenger-copy';
import { useElapsedSince, useResumingAfterBackground } from '../hooks/useElapsedSince';
import {
  agoText,
  formatClockTime,
  trackingAnnouncement,
  trackingModel,
  type AgoText,
  type TrackingKind,
  type TrackingModel,
} from '../lib/driver-tracking-presentation';
import { MapUnavailableStrip } from './MapUnavailableStrip';

export interface DriverTrackingCardProps {
  tracking: DriverTracking | null;
  dataUpdatedAt: number;
  isError: boolean;
  offline: boolean;
  arrived: boolean;
  origin: Location | null;
}

const copy = passengerCopy.tracking;
const MAP_HEIGHT = 180;
const GLYPH_SIZE = 20;
const NO_RESPONSE_AFTER_SEC = 12;
const ORIGIN_MARKER_ID = 'pickup';
const DRIVER_MARKER_ID = 'driver';

function agoLabel(ago: AgoText): string {
  switch (ago.kind) {
    case 'moments':
      return copy.ago.moments;
    case 'seconds':
      return copy.ago.seconds(ago.value);
    case 'minutes':
      return copy.ago.minutes(ago.value);
    case 'hours':
      return copy.ago.hours(ago.value);
  }
}

interface TrackingText {
  title: string;
  detail: string | null;
}

function lastKnown(model: TrackingModel, withClock: boolean): string | null {
  if (model.ageSec === null) return null;
  const ago = agoLabel(agoText(model.ageSec));
  if (!withClock) return copy.lastKnown(ago);
  return copy.lastKnownAt(ago, formatClockTime(new Date(Date.now() - model.ageSec * 1000)));
}

export function trackingText(model: TrackingModel, arrived: boolean): TrackingText {
  const updated = model.ageSec === null ? null : copy.updated(agoLabel(agoText(model.ageSec)));
  switch (model.kind) {
    case 'locating':
      return { title: copy.searching, detail: null };
    case 'live':
      return { title: copy.onTheWay, detail: updated };
    case 'arrived':
      return { title: copy.waiting, detail: updated };
    case 'stale':
      return { title: copy.frozenTitle, detail: lastKnown(model, true) };
    case 'unavailable':
      return { title: copy.unavailableTitle, detail: copy.unavailableBody };
    case 'offline':
      return { title: copy.offlineTitle, detail: lastKnown(model, false) };
    case 'refresh_failed':
      return { title: copy.refreshFailedTitle, detail: lastKnown(model, false) };
    case 'resuming':
      return { title: arrived ? copy.waiting : copy.onTheWay, detail: copy.updating };
  }
}

function announcementText(kind: ReturnType<typeof trackingAnnouncement>): string | null {
  switch (kind) {
    case 'frozen':
      return copy.frozenTitle;
    case 'back':
      return copy.backOnline;
    case 'unavailable':
      return copy.unavailableTitle;
    case 'arrived':
      return copy.waiting;
    case null:
      return null;
  }
}

function Glyph({ kind }: { kind: TrackingKind }): React.JSX.Element {
  const theme = useTheme();
  if (kind === 'locating') return <BrandSpinner size={16} />;
  if (kind === 'unavailable') return <MarkGlyph glyph="pin" size={GLYPH_SIZE} animate={false} />;
  if (kind === 'stale' || kind === 'offline' || kind === 'refresh_failed') {
    return <MarkGlyph glyph="clock" size={GLYPH_SIZE} animate={false} />;
  }
  return <TaxiMark color={theme.colors.text} cutout={theme.colors.surface} size={GLYPH_SIZE} />;
}

export function DriverTrackingCard({
  tracking,
  dataUpdatedAt,
  isError,
  offline,
  arrived,
  origin,
}: DriverTrackingCardProps): React.JSX.Element | null {
  const theme = useTheme();
  const elapsedSec = useElapsedSince(dataUpdatedAt);
  const resuming = useResumingAfterBackground(dataUpdatedAt);
  const refreshFailed = isError || elapsedSec > NO_RESPONSE_AFTER_SEC;
  const model = trackingModel({ tracking, elapsedSec, offline, refreshFailed, resuming, arrived });
  const previousKind = useRef<TrackingKind | null>(null);
  const kind = model?.kind ?? null;

  useEffect(() => {
    if (kind === null) {
      previousKind.current = null;
      return;
    }
    const text = announcementText(trackingAnnouncement(previousKind.current, kind));
    if (text !== null) AccessibilityInfo.announceForAccessibility(text);
    previousKind.current = kind;
  }, [kind]);

  if (model === null) return null;

  const text = trackingText(model, arrived);
  const markers: MapMarker[] = [];
  if (origin) {
    markers.push({
      id: ORIGIN_MARKER_ID,
      kind: 'origin',
      coord: { lat: origin.lat, lng: origin.lng },
      label: copy.originLabel,
    });
  }
  if (model.marker) {
    const ago = model.ageSec === null ? null : agoLabel(agoText(model.ageSec));
    markers.push({
      id: DRIVER_MARKER_ID,
      kind: 'car',
      coord: { lat: model.marker.lat, lng: model.marker.lng },
      freshness: model.marker.freshness,
      label:
        model.marker.freshness === 'stale' && ago !== null
          ? copy.markerLabelStale(ago)
          : copy.markerLabel,
    });
  }
  const center = markers.at(-1)?.coord ?? null;
  const accessibilityLabel = text.detail ? `${text.title}. ${text.detail}` : text.title;

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }} testID="driver-tracking-card">
      {center !== null && (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          testID="driver-tracking-map"
        >
          <Map
            center={center}
            zoomLevel={15}
            markers={markers}
            interactive={false}
            fitToMarkers
            height={MAP_HEIGHT}
            style={{ borderRadius: 0 }}
            fallback={<MapUnavailableStrip />}
          />
        </View>
      )}
      <View
        accessible
        accessibilityLabel={accessibilityLabel}
        testID="driver-tracking-text"
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: theme.spacing.md,
          padding: theme.spacing.lg,
        }}
      >
        <View style={{ paddingTop: theme.spacing.xxs }}>
          <Glyph kind={model.kind} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              ...theme.typography.bodyStrong,
              color: model.kind === 'stale' ? theme.colors.warningInk : theme.colors.text,
            }}
          >
            {text.title}
          </Text>
          {text.detail !== null && (
            <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
              {text.detail}
            </Text>
          )}
        </View>
      </View>
    </Card>
  );
}
