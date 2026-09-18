import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Chip, ErrorState, Map, useTheme } from '@voyyaa/ui-mobile';
import { LOCATION_NOTICE_VERSION } from '@voyyaa/shared';
import { confirmConsent, hasSeenLocalConsent, useLogout } from '@voyyaa/app-runtime';
import { CoverageBlockedPanel } from '../src/components/CoverageBlockedPanel';
import { LocatingPill } from '../src/components/LocatingPill';
import {
  LocationConsentSheet,
  type LocationConsentSheetMode,
} from '../src/components/LocationConsentSheet';
import { useCoverageGate } from '../src/hooks/useCoverageGate';
import { useResolveOrigin } from '../src/hooks/useResolveOrigin';
import { useTripDraftStore } from '../src/state/useTripDraftStore';
import { SAVED_PLACES, YARUMAL_CENTER } from '../src/constants/demo-places';

export default function HomeScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const municipalityId = useTripDraftStore((s) => s.municipalityId);
  const origin = useTripDraftStore((s) => s.origin);
  const setOrigin = useTripDraftStore((s) => s.setOrigin);
  const coverage = useCoverageGate(origin, municipalityId);
  const resolveOrigin = useResolveOrigin();
  const logout = useLogout();

  const [consentVisible, setConsentVisible] = useState(false);
  const [consentMode, setConsentMode] = useState<LocationConsentSheetMode>('consent');
  const [consentChecked, setConsentChecked] = useState(false);

  useEffect(() => {
    if (origin || consentChecked) return;
    void hasSeenLocalConsent('location', LOCATION_NOTICE_VERSION).then((seen) => {
      setConsentChecked(true);
      if (seen) {
        resolveOrigin.resolve();
      } else {
        setConsentMode('consent');
        setConsentVisible(true);
      }
    });
  }, [origin, consentChecked]);

  useEffect(() => {
    if (resolveOrigin.status === 'resolved' && resolveOrigin.origin) {
      setOrigin(resolveOrigin.origin, 'gps');
    }
  }, [resolveOrigin.status, resolveOrigin.origin, setOrigin]);

  const handleConsentContinue = (): void => {
    setConsentVisible(false);
    void confirmConsent('location', LOCATION_NOTICE_VERSION);
    resolveOrigin.resolve();
  };

  const handleConsentDismiss = (): void => {
    setConsentVisible(false);
  };

  const handleReviewPrivacy = (): void => {
    setConsentMode('review');
    setConsentVisible(true);
  };

  const goToDestination = (presetId?: string): void => {
    if (presetId) {
      router.push({ pathname: '/destination', params: { preset: presetId } });
    } else {
      router.push('/destination');
    }
  };

  if (coverage.status === 'outside') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <CoverageBlockedPanel onAdjustLocation={coverage.retry} />
      </SafeAreaView>
    );
  }

  const isResolving = resolveOrigin.status === 'resolving';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text style={{ ...theme.typography.title, color: theme.colors.brandPressed }}>VoyYa</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            hitSlop={8}
            onPress={() => logout.mutate()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: theme.colors.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ ...theme.typography.small, color: theme.colors.text }}>Yo</Text>
          </Pressable>
        </View>

        <Text
          accessibilityRole="link"
          onPress={handleReviewPrivacy}
          style={{ ...theme.typography.small, color: theme.colors.textMuted }}
        >
          Privacidad de mi ubicación
        </Text>

        <View>
          <Map
            center={origin ? { lat: origin.lat, lng: origin.lng } : YARUMAL_CENTER}
            markers={
              origin
                ? [
                    {
                      id: 'current-location',
                      kind: 'origin',
                      coord: { lat: origin.lat, lng: origin.lng },
                      label: `Tu ubicación: ${origin.address}`,
                    },
                  ]
                : []
            }
            interactive={false}
            height={200}
          />
          {isResolving && (
            <View
              style={{ position: 'absolute', left: theme.spacing.sm, bottom: theme.spacing.sm }}
            >
              <LocatingPill />
            </View>
          )}
        </View>

        <Card>
          <Pressable
            onPress={() => goToDestination()}
            accessibilityRole="button"
            accessibilityLabel="¿A dónde vas? Toca para escribir tu destino"
            style={{ minHeight: theme.touch.min, justifyContent: 'center' }}
          >
            <Text style={{ ...theme.typography.subtitle, color: theme.colors.text }}>
              ¿A dónde vas?
            </Text>
            <Text
              style={{ ...theme.typography.small, color: theme.colors.textMuted, marginTop: 4 }}
            >
              Toca para escribir tu destino
            </Text>
          </Pressable>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: theme.spacing.sm,
              marginTop: theme.spacing.md,
            }}
          >
            {SAVED_PLACES.map((place) => (
              <Chip
                key={place.id}
                leading={place.icon}
                label={place.title}
                onPress={() => goToDestination(place.id)}
              />
            ))}
          </View>
        </Card>

        {coverage.status === 'error' && (
          <ErrorState
            title="No pudimos verificar tu zona"
            body="Puedes seguir e intentarlo; te avisaremos si tu viaje no se puede cotizar."
            onRetry={coverage.retry}
          />
        )}
      </ScrollView>

      <LocationConsentSheet
        visible={consentVisible}
        mode={consentMode}
        onContinue={handleConsentContinue}
        onDismiss={handleConsentDismiss}
      />
    </SafeAreaView>
  );
}
