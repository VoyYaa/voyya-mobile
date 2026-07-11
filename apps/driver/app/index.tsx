// =============================================================================
// VoyYa Conductor — Home / Turno
// -----------------------------------------------------------------------------
// Toggle "En turno / Fuera de turno" (Zustand — UI local, §2.5), resumen del
// día (PLACEHOLDER: no existe todavía un endpoint de resumen de viajes/ingresos
// del conductor en @voyya/shared/apps/api — se muestra estático y claramente
// rotulado, nunca como si fuera un dato real) y la variante "Resumen" de
// solicitudes cercanas (§2.3: máx. 1 fila + enlace "Ver todas", mismos estados
// que la lista completa en versión condensada).
// =============================================================================

import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, ErrorState, useTheme } from '@voyya/ui-mobile';
import { ShiftToggle } from '../src/components/ShiftToggle';
import { AssignmentRulesCard } from '../src/components/AssignmentRulesCard';
import { OffShiftPanel } from '../src/components/OffShiftPanel';
import { RequestRow } from '../src/components/RequestRow';
import { RequestListSkeleton } from '../src/components/RequestListSkeleton';
import { useLogout } from '../src/hooks/useLogout';
import { useTurnoStore } from '../src/state/useTurnoStore';
import { useSolicitudesCercanas } from '../src/hooks/useSolicitudesCercanas';
import {
  RADIO_BUSQUEDA_FALLBACK_KM,
  TIMEOUT_ACEPTACION_FALLBACK_SEG,
} from '../src/constants/parametros';

export default function HomeScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const enTurno = useTurnoStore((s) => s.enTurno);
  const activarTurno = useTurnoStore((s) => s.activarTurno);
  const alternarTurno = useTurnoStore((s) => s.alternarTurno);
  const logout = useLogout();

  const solicitudes = useSolicitudesCercanas(enTurno);
  const primeraSolicitud = solicitudes.data?.[0];

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

        <ShiftToggle enTurno={enTurno} onToggle={alternarTurno} />

        {/* Resumen del día — PLACEHOLDER: sin endpoint real todavía (rotulado como tal, no simulado como dato en vivo). */}
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

          {!enTurno && <OffShiftPanel onActivar={activarTurno} />}

          {enTurno && solicitudes.isLoading && <RequestListSkeleton count={1} />}

          {enTurno && solicitudes.isError && (
            <ErrorState
              title="No pudimos cargar tus solicitudes"
              onRetry={() => solicitudes.refetch()}
            />
          )}

          {enTurno && solicitudes.isSuccess && solicitudes.data.length === 0 && (
            <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>
              Sin solicitudes cercanas por ahora. Sigues visible para los pasajeros.
            </Text>
          )}

          {enTurno && primeraSolicitud && (
            <>
              <RequestRow
                originLabel={primeraSolicitud.origen.direccion}
                destinationLabel={primeraSolicitud.destino_barrio}
                distanceToPickup={`${primeraSolicitud.distancia_al_origen_m} m`}
                price={primeraSolicitud.tarifa_total}
                isNearest
                onPress={() =>
                  router.push({
                    pathname: '/solicitudes/[id]',
                    params: { id: String(primeraSolicitud.id_asignacion) },
                  })
                }
              />
              <Text
                accessibilityRole="link"
                onPress={() => router.push('/solicitudes')}
                style={{
                  ...theme.typography.small,
                  fontWeight: '700',
                  color: theme.colors.brandPressed,
                }}
              >
                Ver todas ({solicitudes.data?.length ?? 0})
              </Text>
            </>
          )}
        </View>

        <AssignmentRulesCard
          radioKm={RADIO_BUSQUEDA_FALLBACK_KM}
          timeoutSeg={TIMEOUT_ACEPTACION_FALLBACK_SEG}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
