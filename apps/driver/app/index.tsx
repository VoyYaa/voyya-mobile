import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, ErrorState, useTheme } from '@voyyaa/ui-mobile';
import { useLogout } from '@voyyaa/app-runtime';
import { ShiftToggle } from '../src/components/ShiftToggle';
import { AssignmentRulesCard } from '../src/components/AssignmentRulesCard';
import { OffShiftPanel } from '../src/components/OffShiftPanel';
import { RequestRow } from '../src/components/RequestRow';
import { RequestListSkeleton } from '../src/components/RequestListSkeleton';
import { useShiftStore } from '../src/state/useShiftStore';
import { useNearbyOffers } from '../src/hooks/useNearbyOffers';
import {
  SEARCH_RADIUS_FALLBACK_KM,
  ACCEPTANCE_TIMEOUT_FALLBACK_SEC,
} from '../src/constants/parameters';

export default function HomeScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const onShift = useShiftStore((s) => s.onShift);
  const startShift = useShiftStore((s) => s.startShift);
  const toggleShift = useShiftStore((s) => s.toggleShift);
  const logout = useLogout();

  const offers = useNearbyOffers(onShift);
  const firstOffer = offers.data?.[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text style={{ ...theme.typography.title, color: theme.colors.brandPressed }}>
            VoyYa Conductor
          </Text>
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

        <ShiftToggle onShift={onShift} onToggle={toggleShift} />

        <Card>
          <Text style={{ ...theme.typography.subtitle, color: theme.colors.text }}>
            Resumen de hoy
          </Text>
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted, marginTop: 2 }}>
            Placeholder · aún no hay un endpoint de resumen de viajes/ingresos del conductor.
          </Text>
          <View
            style={{ flexDirection: 'row', gap: theme.spacing.xl, marginTop: theme.spacing.sm }}
          >
            <View>
              <Text style={{ ...theme.typography.numeric, fontSize: 20, color: theme.colors.text }}>
                0
              </Text>
              <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
                Viajes
              </Text>
            </View>
            <View>
              <Text style={{ ...theme.typography.numeric, fontSize: 20, color: theme.colors.text }}>
                $0
              </Text>
              <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
                Recaudo
              </Text>
            </View>
          </View>
        </Card>

        <View style={{ gap: theme.spacing.sm as number }}>
          <Text style={{ ...theme.typography.subtitle, color: theme.colors.text }}>
            Solicitudes cercanas
          </Text>

          {!onShift && <OffShiftPanel onActivate={startShift} />}

          {onShift && offers.isLoading && <RequestListSkeleton count={1} />}

          {onShift && offers.isError && (
            <ErrorState
              title="No pudimos cargar tus solicitudes"
              onRetry={() => offers.refetch()}
            />
          )}

          {onShift && offers.isSuccess && offers.data.length === 0 && (
            <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>
              Sin solicitudes cercanas por ahora. Sigues visible para los pasajeros.
            </Text>
          )}

          {onShift && firstOffer && (
            <>
              <RequestRow
                originLabel={firstOffer.origin.address}
                destinationLabel={firstOffer.dropoff_neighborhood}
                distanceToPickup={`${firstOffer.distance_to_origin_m} m`}
                price={firstOffer.total_fare}
                isNearest
                onPress={() =>
                  router.push({
                    pathname: '/requests/[id]',
                    params: { id: String(firstOffer.assignment_id) },
                  })
                }
              />
              <Text
                accessibilityRole="link"
                onPress={() => router.push('/requests')}
                style={{
                  ...theme.typography.small,
                  fontWeight: '700',
                  color: theme.colors.brandPressed,
                }}
              >
                Ver todas ({offers.data?.length ?? 0})
              </Text>
            </>
          )}
        </View>

        <AssignmentRulesCard
          radioKm={SEARCH_RADIUS_FALLBACK_KM}
          timeoutSeg={ACCEPTANCE_TIMEOUT_FALLBACK_SEC}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
