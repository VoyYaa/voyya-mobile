import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { BottomSheet, Button, LinkButton, useTheme } from '@voyyaa/ui-mobile';
import type { NavigationTarget } from '../trip/directions-url';
import { useRouteNavigation } from '../hooks/useRouteNavigation';
import { driverCopy } from '../copy/driver-copy';

export type RouteLeg = 'pickup' | 'dropoff';

export interface RouteButtonProps {
  target: NavigationTarget | null;
  leg: RouteLeg;
}

const copy = driverCopy.route;
const APP_ROW_HEIGHT = 64;

export function RouteButton({ target, leg }: RouteButtonProps): React.JSX.Element | null {
  const theme = useTheme();
  const navigation = useRouteNavigation(target);

  if (!navigation.available) return null;

  const label = leg === 'pickup' ? copy.toPickup : copy.toDropoff;
  const targetName = leg === 'pickup' ? copy.pickupTarget : copy.dropoffTarget;
  const appLabel = navigation.appInUse ? copy.apps[navigation.appInUse] : null;

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <Button
        label={label}
        variant="ghost"
        size="lg"
        accessibilityLabel={copy.accessibility(targetName, appLabel)}
        onPress={navigation.open}
        testID="trip-route"
      />
      {(appLabel !== null || navigation.canChangeApp) && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            columnGap: theme.spacing.md,
          }}
        >
          {appLabel !== null && (
            <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
              {copy.opensIn(appLabel)}
            </Text>
          )}
          {navigation.canChangeApp && (
            <LinkButton
              label={copy.changeApp}
              tone="muted"
              onPress={navigation.openChooser}
              testID="trip-route-change"
            />
          )}
        </View>
      )}

      <BottomSheet
        visible={navigation.chooserApps !== null}
        onClose={navigation.dismissChooser}
        title={copy.sheetTitle}
        testID="navigation-app-sheet"
      >
        <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
          {copy.sheetBody}
        </Text>
        <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
          {(navigation.chooserApps ?? []).map((app) => (
            <Pressable
              key={app}
              accessibilityRole="button"
              accessibilityLabel={copy.apps[app]}
              onPress={() => navigation.choose(app)}
              testID={`navigation-app-${app}`}
              style={{
                minHeight: APP_ROW_HEIGHT,
                justifyContent: 'center',
                paddingHorizontal: theme.spacing.lg,
                borderRadius: theme.radius.card,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
              }}
            >
              <Text style={{ ...theme.typography.subtitle, color: theme.colors.text }}>
                {copy.apps[app]}
              </Text>
            </Pressable>
          ))}
        </View>
      </BottomSheet>

      <BottomSheet
        visible={navigation.failedCoordinates !== null}
        onClose={navigation.dismissFailure}
        title={copy.failedTitle}
        testID="route-failed-sheet"
      >
        <Text style={{ ...theme.typography.body, color: theme.colors.text }}>
          {copy.failedBody}
        </Text>
        <Text
          selectable
          style={{
            ...theme.typography.numeric,
            color: theme.colors.text,
            marginTop: theme.spacing.sm,
          }}
          testID="route-failed-coordinates"
        >
          {navigation.failedCoordinates}
        </Text>
        <View style={{ marginTop: theme.spacing.lg }}>
          <Button label={copy.failedDone} onPress={navigation.dismissFailure} />
        </View>
      </BottomSheet>
    </View>
  );
}
