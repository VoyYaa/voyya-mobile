// =============================================================================
// VoyYa Pasajero — Home (P3 del hi-fi aprobado)
// -----------------------------------------------------------------------------
// Mapa (placeholder — ver notas de entrega) + "¿A dónde vas?" + lugares
// guardados. Cubre el estado de borde "origen fuera de cobertura" (§5.2 de
// pasajero-estados-borde.md) vía <CoverageBlockedPanel>, bloqueante a pantalla
// completa antes de dejar elegir destino.
// =============================================================================

import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Chip, ErrorState, Map, useTheme } from '@voyya/ui-mobile';
import { CoverageBlockedPanel } from '../src/components/CoverageBlockedPanel';
import { useCoverageGate } from '../src/hooks/useCoverageGate';
import { useLogout } from '../src/hooks/useLogout';
import { useTripDraftStore } from '../src/state/useTripDraftStore';
import { LUGARES_GUARDADOS, UBICACION_ACTUAL_MOCK } from '../src/constants/lugares-demo';

export default function HomeScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const idMunicipio = useTripDraftStore((s) => s.idMunicipio);
  const coverage = useCoverageGate(UBICACION_ACTUAL_MOCK, idMunicipio);
  const logout = useLogout();

  const irADestino = (presetId?: string): void => {
    if (presetId) {
      router.push({ pathname: '/destino', params: { preset: presetId } });
    } else {
      router.push('/destino');
    }
  };

  if (coverage.status === 'fuera') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <CoverageBlockedPanel onAjustarUbicacion={coverage.reintentar} />
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

        {/* Mapa real (Mapbox) — solo lectura: muestra la ubicación actual (mock
            hasta que exista expo-location). Cae a placeholder sin token/en
            Expo Go, ver @voyya/ui-mobile Map.tsx. */}
        <Map
          center={{ lat: UBICACION_ACTUAL_MOCK.lat, lng: UBICACION_ACTUAL_MOCK.lng }}
          markers={[
            {
              id: 'ubicacion-actual',
              kind: 'origen',
              coord: { lat: UBICACION_ACTUAL_MOCK.lat, lng: UBICACION_ACTUAL_MOCK.lng },
              label: `Tu ubicación: ${UBICACION_ACTUAL_MOCK.direccion}`,
            },
          ]}
          interactive={false}
          height={200}
        />

        <Card>
          <Pressable
            onPress={() => irADestino()}
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
            {LUGARES_GUARDADOS.map((lugar) => (
              <Chip key={lugar.id} leading={lugar.icono} label={lugar.titulo} onPress={() => irADestino(lugar.id)} />
            ))}
          </View>
        </Card>

        {coverage.status === 'error' && (
          <ErrorState
            title="No pudimos verificar tu zona"
            body="Puedes seguir e intentarlo; te avisaremos si tu viaje no se puede cotizar."
            onRetry={coverage.reintentar}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
