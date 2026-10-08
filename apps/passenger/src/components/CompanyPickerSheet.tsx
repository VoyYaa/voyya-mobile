import React from 'react';
import { AccessibilityInfo, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { BottomSheet, Button, ProgressRail, useTheme } from '@voyyaa/ui-mobile';
import type { TripCompanyOption } from '@voyyaa/shared';
import {
  ANY_COMPANY,
  companyLacksDrivers,
  companyPreference,
  type CompanyPreference,
} from '../lib/company-selection';
import { passengerCopy } from '../copy/passenger-copy';
import { CompanyOption } from './CompanyOption';
import { InlineNotice } from './InlineNotice';

export interface CompanyPickerSheetProps {
  visible: boolean;
  companies: readonly TripCompanyOption[];
  preference: CompanyPreference;
  refreshing: boolean;
  refreshFailed: boolean;
  onChangePreference: (preference: CompanyPreference) => void;
  onClose: () => void;
}

const copy = passengerCopy.company;
const LIST_MAX_HEIGHT_RATIO = 0.7;

export function CompanyPickerSheet({
  visible,
  companies,
  preference,
  refreshing,
  refreshFailed,
  onChangePreference,
  onClose,
}: CompanyPickerSheetProps): React.JSX.Element {
  const theme = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const lacksDrivers = companyLacksDrivers(preference, companies);
  const selectedName = preference?.kind === 'company' ? preference.companyName : null;

  const choose = (next: CompanyPreference, name: string): void => {
    onChangePreference(next);
    AccessibilityInfo.announceForAccessibility(copy.selected(name));
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={copy.sheetTitle} testID="company-sheet">
      {refreshing && <ProgressRail testID="company-sheet-refreshing" />}
      <Text
        style={{
          ...theme.typography.small,
          color: theme.colors.textMuted,
          marginBottom: theme.spacing.sm,
        }}
      >
        {copy.sameFare}
      </Text>
      <ScrollView style={{ maxHeight: windowHeight * LIST_MAX_HEIGHT_RATIO }}>
        <View accessibilityRole="radiogroup" accessibilityLabel={copy.groupLabel}>
          <CompanyOption
            name={copy.any}
            detail={copy.anyDetailLong}
            selected={preference?.kind === 'any'}
            onPress={() => choose(ANY_COMPANY, copy.any)}
            testID="company-option-any"
          />
          {companies.map((company) => (
            <CompanyOption
              key={company.company_id}
              name={company.display_name}
              detail={null}
              lacksDrivers={!company.has_available_drivers}
              selected={
                preference?.kind === 'company' && preference.companyId === company.company_id
              }
              onPress={() => choose(companyPreference(company), company.display_name)}
              testID={`company-option-${company.company_id}`}
            />
          ))}
        </View>
        {lacksDrivers && selectedName && (
          <View style={{ marginTop: theme.spacing.md }}>
            <InlineNotice
              tone="info"
              glyph="clock"
              title={copy.noDriversTitle(selectedName)}
              body={copy.noDriversBody}
              actionLabel={copy.useAny}
              onAction={() => choose(ANY_COMPANY, copy.any)}
              testID="company-sheet-no-drivers"
            />
          </View>
        )}
        {refreshFailed && (
          <Text
            style={{
              ...theme.typography.small,
              color: theme.colors.textMuted,
              marginTop: theme.spacing.sm,
            }}
          >
            {copy.refreshFailed}
          </Text>
        )}
      </ScrollView>
      <View style={{ marginTop: theme.spacing.lg }}>
        <Button label={copy.done} onPress={onClose} testID="company-sheet-done" />
      </View>
    </BottomSheet>
  );
}
