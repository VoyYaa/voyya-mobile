import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BrandSpinner,
  Button,
  Card,
  LinkButton,
  Map,
  PointRoute,
  PriceTag,
  ScreenHeader,
  uiCopy,
  useTheme,
} from '@voyyaa/ui-mobile';
import type { PaymentMethod } from '@voyyaa/shared';
import { domainErrorCode, isNetworkError, useNetworkStatus } from '@voyyaa/app-runtime';
import {
  ActiveTripConflictSheet,
  type ActiveTripConflictFailure,
} from '../src/components/ActiveTripConflictSheet';
import { InlineNotice } from '../src/components/InlineNotice';
import { LocationReferenceField } from '../src/components/LocationReferenceField';
import { useActiveTripCache } from '../src/hooks/useActiveTrip';
import { useQuoteFare } from '../src/hooks/useQuoteFare';
import { useCreateTripRequest } from '../src/hooks/useCreateTripRequest';
import { useTripDraftStore } from '../src/state/useTripDraftStore';
import { composeAddress } from '../src/lib/address';
import { activeTripRoute } from '../src/lib/active-trip-route';
import { passengerCopy } from '../src/copy/passenger-copy';

import { TRIP_ENDED_NOTICE } from '../src/constants/notices';

const PAYMENT_METHOD: PaymentMethod = 'cash';
const MAP_HEIGHT = 120;
const copy = passengerCopy.confirm;

export default function ConfirmScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const networkStatus = useNetworkStatus();

  const origin = useTripDraftStore((s) => s.origin);
  const destination = useTripDraftStore((s) => s.destination);
  const municipalityId = useTripDraftStore((s) => s.municipalityId);
  const serviceType = useTripDraftStore((s) => s.serviceType);
  const quote = useTripDraftStore((s) => s.quote);
  const setQuote = useTripDraftStore((s) => s.setQuote);
  const resetDraft = useTripDraftStore((s) => s.reset);
  const activeTripCache = useActiveTripCache();

  const [pickupReference, setPickupReference] = useState('');
  const [dropoffReference, setDropoffReference] = useState('');
  const [referencesExpanded, setReferencesExpanded] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [conflictLoading, setConflictLoading] = useState(false);
  const [conflictFailure, setConflictFailure] = useState<ActiveTripConflictFailure>(null);
  const quoteFare = useQuoteFare();
  const createTripRequest = useCreateTripRequest();

  useEffect(() => {
    if (!origin || !destination || !quote) {
      router.replace('/');
    }
  }, []);

  if (!origin || !destination || !quote) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} />;
  }

  const requestTrip = (): void => {
    createTripRequest.mutate(
      {
        origin: { ...origin, address: composeAddress(origin.address, pickupReference) },
        destination: {
          ...destination,
          address: composeAddress(destination.address, dropoffReference),
        },
        municipality_id: municipalityId,
        service_type: serviceType,
        payment_method: PAYMENT_METHOD,
        quote_token: quote.quote_token,
      },
      {
        onSuccess: (tripRequest) => {
          void activeTripCache.refresh().catch(() => undefined);
          router.replace({
            pathname: '/searching',
            params: { id: String(tripRequest.trip_request_id) },
          });
        },
        onError: (error) => {
          if (domainErrorCode(error) === 'ACTIVE_TRIP_REQUEST_EXISTS') {
            setConflictFailure(null);
            setConflictOpen(true);
            return;
          }
          if (domainErrorCode(error) === 'QUOTE_EXPIRED') {
            quoteFare.mutate(
              { origin, destination, municipality_id: municipalityId, service_type: serviceType },
              { onSuccess: setQuote },
            );
          }
        },
      },
    );
  };

  const openActiveTrip = (): void => {
    setConflictLoading(true);
    setConflictFailure(null);
    activeTripCache
      .refresh()
      .then((trip) => {
        setConflictOpen(false);
        const route = trip ? activeTripRoute(trip) : null;
        if (!trip || !route) {
          resetDraft();
          router.replace({ pathname: '/', params: { notice: TRIP_ENDED_NOTICE } });
          return;
        }
        activeTripCache.seed(trip);
        router.replace(route);
      })
      .catch((error: unknown) => setConflictFailure(isNetworkError(error) ? 'offline' : 'error'))
      .finally(() => setConflictLoading(false));
  };

  const closeConflict = (): void => {
    setConflictOpen(false);
    createTripRequest.reset();
  };

  const errorCode = domainErrorCode(createTripRequest.error);
  const showGenericError =
    createTripRequest.isError &&
    errorCode !== 'QUOTE_EXPIRED' &&
    errorCode !== 'ACTIVE_TRIP_REQUEST_EXISTS';
  const currentFare = quoteFare.data ?? quote;
  const offline = networkStatus === 'offline';
  const requestDisabled =
    offline || createTripRequest.isPending || quoteFare.isPending || conflictOpen;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <ScreenHeader title={copy.header} onBack={() => router.back()} />
      <ScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}
      >
        {errorCode === 'QUOTE_EXPIRED' && (
          <InlineNotice tone="info" glyph="clock" title={copy.requote} testID="confirm-requote" />
        )}
        {showGenericError && (
          <InlineNotice
            tone="danger"
            glyph="error"
            title={copy.createErrorTitle}
            body={copy.createErrorBody}
            actionLabel={uiCopy.retry}
            onAction={requestTrip}
            testID="confirm-create-error"
          />
        )}
        {offline && (
          <InlineNotice
            tone="info"
            glyph="offline"
            title={copy.offlineRequest}
            testID="confirm-offline"
          />
        )}
        <Card testID="confirm-ticket" style={{ gap: theme.spacing.md }}>
          <PointRoute
            origin={{ label: copy.origin, value: origin.address }}
            destination={{ label: copy.destination, value: destination.address }}
          />
          <Map
            center={{
              lat: (origin.lat + destination.lat) / 2,
              lng: (origin.lng + destination.lng) / 2,
            }}
            markers={[
              {
                id: 'origin',
                kind: 'origin',
                coord: origin,
                label: origin.address,
              },
              {
                id: 'destination',
                kind: 'destination',
                coord: destination,
                label: destination.address,
              },
            ]}
            route={{ points: [origin, destination] }}
            interactive={false}
            height={MAP_HEIGHT}
          />
        </Card>

        <View style={{ paddingHorizontal: theme.spacing.xs, gap: theme.spacing.xs }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              minHeight: 44,
            }}
          >
            <Text style={{ ...theme.typography.subtitle, color: theme.colors.text }}>
              {copy.fareTitle}
            </Text>
            {quoteFare.isPending ? (
              <BrandSpinner size={24} />
            ) : (
              <PriceTag amountCOP={currentFare.fare.total} size="xl" testID="confirm-fare" />
            )}
          </View>
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
            {copy.fareClosed}
          </Text>
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
            {copy.freeCancellation}
          </Text>
        </View>

        {referencesExpanded ? (
          <View style={{ gap: theme.spacing.md }}>
            <LocationReferenceField
              label={copy.pickupReferenceLabel}
              value={pickupReference}
              onChangeText={setPickupReference}
              accessibilityLabel={copy.pickupReferenceAccessibility}
            />
            <LocationReferenceField
              label={copy.dropoffReferenceLabel}
              value={dropoffReference}
              onChangeText={setDropoffReference}
              accessibilityLabel={copy.dropoffReferenceAccessibility}
            />
          </View>
        ) : (
          <LinkButton
            label={copy.references}
            onPress={() => setReferencesExpanded(true)}
            testID="references-toggle"
          />
        )}
      </ScrollView>

      <View
        style={{
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.lg + insets.bottom,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.bg,
        }}
      >
        <Button
          label={copy.requestTrip(currentFare.fare.total)}
          size="lg"
          loading={createTripRequest.isPending}
          loadingLabel={copy.requesting}
          disabled={requestDisabled}
          onPress={requestTrip}
          accessibilityHint={offline ? copy.offlineRequestHint : undefined}
          testID="request-trip-button"
        />
      </View>

      <ActiveTripConflictSheet
        visible={conflictOpen}
        loading={conflictLoading}
        failure={conflictFailure}
        onViewTrip={openActiveTrip}
        onClose={closeConflict}
      />
    </SafeAreaView>
  );
}
