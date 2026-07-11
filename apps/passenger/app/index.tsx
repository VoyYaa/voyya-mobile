import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Chip, ErrorState, Map, useTheme } from '@voyyaa/ui-mobile';
import { CoverageBlockedPanel } from '../src/components/CoverageBlockedPanel';
import { useCoverageGate } from '../src/hooks/useCoverageGate';
import { useLogout } from '../src/hooks/useLogout';
import { useTripDraftStore } from '../src/state/useTripDraftStore';
import { CURRENT_LOCATION_MOCK, SAVED_PLACES } from '../src/constants/demo-places';

export default function HomeScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const municipalityId = useTripDraftStore((s) => s.municipalityId);
  const coverage = useCoverageGate(CURRENT_LOCATION_MOCK, municipalityId);
  const logout = useLogout();

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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

        <Map
          center={{ lat: CURRENT_LOCATION_MOCK.lat, lng: CURRENT_LOCATION_MOCK.lng }}
          markers={[
            {
              id: 'current-location',
              kind: 'origin',
              coord: { lat: CURRENT_LOCATION_MOCK.lat, lng: CURRENT_LOCATION_MOCK.lng },
              label: `Tu ubicación: ${CURRENT_LOCATION_MOCK.address}`,
            },
          ]}
          interactive={false}
          height={200}
        />

        <Card>
          <Pressable
            onPress={() => goToDestination()}
            accessibilityRole="button"
            accessibilityLabel="¿A dónde vas? Toca para escribir tu destino"
            style={{ minHeight: theme.touch.min, justifyContent: 'center' }}
          >
            <Text style={{ ...theme.typography.subtitle, color: theme.colors.text }}>¿A dónde vas?</Text>
            <Text style={{ ...theme.typography.small, color: theme.colors.textMuted, marginTop: 4 }}>
              Toca para escribir tu destino
            </Text>
          </Pressable>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
            {SAVED_PLACES.map((place) => (
              <Chip key={place.id} leading={place.icon} label={place.title} onPress={() => goToDestination(place.id)} />
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
    </SafeAreaView>
  );
}
