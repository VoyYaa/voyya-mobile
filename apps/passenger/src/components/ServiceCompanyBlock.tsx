import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Text, View, findNodeHandle } from 'react-native';
import { Chip, LinkButton, Skeleton, uiCopy, useDelayedLoading, useTheme } from '@voyyaa/ui-mobile';
import type { TripServiceOption } from '@voyyaa/shared';
import {
  ANY_COMPANY,
  companyLacksDrivers,
  sortCompanies,
  type CompanyPreference,
  type ServiceOptionsStatus,
} from '../lib/company-selection';
import { passengerCopy } from '../copy/passenger-copy';
import { CompanyPickerRow, type CompanyRowValue } from './CompanyPickerRow';
import { CompanyPickerSheet } from './CompanyPickerSheet';
import { InlineNotice } from './InlineNotice';

export interface ServiceCompanyBlockProps {
  status: ServiceOptionsStatus;
  option: TripServiceOption | null;
  preference: CompanyPreference;
  unavailableCompanyName: string | null;
  openSheetOnMount: boolean;
  refreshing: boolean;
  refreshFailed: boolean;
  disabled: boolean;
  onChangePreference: (preference: CompanyPreference) => void;
  onSheetOpen: () => void;
  onRetry: () => void;
  onBackHome: () => void;
}

const copy = passengerCopy.company;
const SKELETON_HEIGHT = 72;

function rowValueOf(preference: CompanyPreference, option: TripServiceOption): CompanyRowValue {
  if (preference === null) return { kind: 'unset' };
  if (preference.kind === 'any') return { kind: 'any' };
  return {
    kind: 'company',
    name: preference.companyName,
    lacksDrivers: companyLacksDrivers(preference, option.companies),
  };
}

function CompanyBody(props: ServiceCompanyBlockProps): React.JSX.Element | null {
  const theme = useTheme();
  const showSkeleton = useDelayedLoading(props.status === 'loading');
  const [sheetOpen, setSheetOpen] = useState(false);
  const rowRef = useRef<View>(null);
  const openedOnMount = useRef(false);
  const { option, preference, onSheetOpen, openSheetOnMount } = props;

  const openSheet = (): void => {
    onSheetOpen();
    setSheetOpen(true);
  };

  useEffect(() => {
    if (!openSheetOnMount || openedOnMount.current || option === null) return;
    openedOnMount.current = true;
    setSheetOpen(true);
  }, [openSheetOnMount, option]);

  const closeSheet = (): void => {
    setSheetOpen(false);
    const handle = rowRef.current ? findNodeHandle(rowRef.current) : null;
    if (handle) AccessibilityInfo.setAccessibilityFocus(handle);
  };

  if (props.status === 'loading') {
    if (!showSkeleton) return null;
    return (
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={copy.loading}
        testID="company-loading"
      >
        <Skeleton height={SKELETON_HEIGHT} radius={theme.radius.card} />
      </View>
    );
  }

  if (props.status === 'error' || props.status === 'offline') {
    const offline = props.status === 'offline';
    return (
      <InlineNotice
        tone="info"
        glyph={offline ? 'offline' : 'error'}
        title={offline ? copy.offline : copy.loadErrorTitle}
        body={offline ? undefined : copy.loadErrorBody}
        actionLabel={offline ? undefined : uiCopy.retry}
        onAction={offline ? undefined : props.onRetry}
        testID={offline ? 'company-offline' : 'company-error'}
      />
    );
  }

  if (option === null) {
    return (
      <View style={{ gap: theme.spacing.sm }}>
        <InlineNotice
          tone="info"
          glyph="pin"
          title={copy.noneTitle}
          body={copy.noneBody}
          testID="company-none"
        />
        <LinkButton label={copy.backHome} onPress={props.onBackHome} testID="company-back-home" />
      </View>
    );
  }

  if (!option.selection_required) {
    return (
      <Text style={{ ...theme.typography.body, color: theme.colors.text }} testID="company-single">
        {copy.single(option.companies[0]?.display_name ?? '')}
      </Text>
    );
  }

  return (
    <View style={{ gap: theme.spacing.sm }}>
      {preference === null && props.unavailableCompanyName && (
        <InlineNotice
          tone="info"
          glyph="clock"
          title={copy.unavailableTitle(props.unavailableCompanyName)}
          body={copy.unavailableBody}
          actionLabel={copy.chooseAction}
          onAction={openSheet}
          testID="company-unavailable"
        />
      )}
      <CompanyPickerRow
        value={rowValueOf(preference, option)}
        disabled={props.disabled}
        rowRef={rowRef}
        onOpen={openSheet}
        onUseAny={() => props.onChangePreference(ANY_COMPANY)}
      />
      <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
        {copy.sameFare}
      </Text>
      <CompanyPickerSheet
        visible={sheetOpen}
        companies={sortCompanies(option.companies)}
        preference={preference}
        refreshing={props.refreshing}
        refreshFailed={props.refreshFailed}
        onChangePreference={props.onChangePreference}
        onClose={closeSheet}
      />
    </View>
  );
}

export function ServiceCompanyBlock(props: ServiceCompanyBlockProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View style={{ paddingHorizontal: theme.spacing.xs, gap: theme.spacing.sm }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: theme.touch.min,
        }}
      >
        <Text style={{ ...theme.typography.subtitle, color: theme.colors.text }}>
          {copy.serviceLabel}
        </Text>
        <Chip
          label={copy.serviceChip}
          tone="neutral"
          accessibilityLabel={copy.serviceChipAccessibility}
          testID="service-chip"
        />
      </View>
      <CompanyBody {...props} />
    </View>
  );
}
