// =============================================================================
// VoyYa Pasajero — Destino (P4 del hi-fi aprobado)
// -----------------------------------------------------------------------------
// Selección de destino + cotización. Cubre el estado de borde "destino fuera
// de cobertura" (§5.1 de pasajero-estados-borde.md): error INLINE bajo la fila
// tocada, sin navegar — la solicitud no avanza a Confirmar hasta corregir.
// react-hook-form + zod valida el campo de búsqueda libre (uso ligero pero
// real de ambos, consistentes con el stack declarado para futuras pantallas).
// =============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, ErrorState, Map, StatusBadge, useTheme, type MapLatLng } from '@voyya/ui-mobile';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { PointRow } from '../src/components/PointRow';
import { useCotizar } from '../src/hooks/useCotizar';
import { useNetworkStatus } from '../src/hooks/useNetworkStatus';
import { useTripDraftStore } from '../src/state/useTripDraftStore';
import { codigoErrorDominio, esErrorDeRed } from '../src/api/errors';
import { SUGERENCIAS_DESTINO, UBICACION_ACTUAL_MOCK, type LugarSugerido } from '../src/constants/lugares-demo';
import { POIS_YARUMAL, type PoiYarumal } from '../src/constants/pois-yarumal';

const BusquedaSchema = z.object({ query: z.string() });
type BusquedaForm = z.infer<typeof BusquedaSchema>;

export default function DestinoScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ preset?: string }>();
  const networkStatus = useNetworkStatus();
  const cotizar = useCotizar();
  const setOrigenDestino = useTripDraftStore((s) => s.setOrigenDestino);
  const setCotizacion = useTripDraftStore((s) => s.setCotizacion);
  const idMunicipio = useTripDraftStore((s) => s.idMunicipio);

  const [coberturaErrorId, setCoberturaErrorId] = useState<string | null>(null);
  // Método PRINCIPAL de selección (decision-geocodificacion-yarumal.md): el
  // punto que el pasajero fija en el mapa queda "candidato" hasta que lo
  // confirma explícitamente — evita recotizar en cada frame mientras arrastra
  // el mapa bajo el pin central.
  const [pinCandidate, setPinCandidate] = useState<MapLatLng | null>(null);

  const { control, watch } = useForm<BusquedaForm>({
    resolver: zodResolver(BusquedaSchema),
    defaultValues: { query: '' },
  });
  const query = watch('query');

  const sugerencias = useMemo(() => {
    const texto = query.trim().toLowerCase();
    if (!texto) return SUGERENCIAS_DESTINO;
    return SUGERENCIAS_DESTINO.filter((lugar) => lugar.titulo.toLowerCase().includes(texto));
  }, [query]);

  const seleccionar = (lugar: LugarSugerido): void => {
    setCoberturaErrorId(null);
    const destino = { direccion: lugar.titulo, lat: lugar.lat, lng: lugar.lng };
    cotizar.mutate(
      { origen: UBICACION_ACTUAL_MOCK, destino, id_municipio: idMunicipio, tipo_servicio: 'taxi' },
      {
        onSuccess: (cotizacion) => {
          setOrigenDestino(UBICACION_ACTUAL_MOCK, destino);
          setCotizacion(cotizacion);
          router.push('/confirmar');
        },
        onError: (error) => {
          if (codigoErrorDominio(error) === 'FUERA_DE_COBERTURA') {
            setCoberturaErrorId(lugar.id);
          }
        },
      },
    );
  };

  // Confirma el punto fijado en el mapa (pin-drop) como destino. Reusa
  // `seleccionar` tal cual (mismo cotizar/error handling que un ítem de la
  // lista) — sin reverse-geocoding en este build, la dirección mostrada es el
  // punto marcado; queda como mejora natural (la decisión lo permite: "coords
  // → dirección aproximada para mostrar sí es aceptable con Mapbox").
  const confirmarPin = (): void => {
    if (!pinCandidate) return;
    seleccionar({
      id: 'pin-drop',
      icono: '📍',
      titulo: 'Punto marcado en el mapa',
      subtitulo: `${pinCandidate.lat.toFixed(5)}, ${pinCandidate.lng.toFixed(5)}`,
      lat: pinCandidate.lat,
      lng: pinCandidate.lng,
    });
  };

  // Segunda vía "principal" de selección: POIs curados (ver pois-yarumal.ts).
  // Los que aún no tienen coordenada verificada no son seleccionables — no se
  // inventa su ubicación (decision-geocodificacion-yarumal.md).
  const seleccionarPoi = (poi: PoiYarumal): void => {
    if (!poi.coord) return;
    seleccionar({ id: poi.id, icono: poi.icono, titulo: poi.titulo, subtitulo: 'Yarumal', lat: poi.coord.lat, lng: poi.coord.lng });
  };

  useEffect(() => {
    if (!params.preset) return;
    const preset = SUGERENCIAS_DESTINO.find((lugar) => lugar.id === params.preset);
    if (preset) seleccionar(preset);
    // Deliberadamente solo depende de `params.preset` (no de `seleccionar`,
    // que se recrea cada render): dispara una vez con el preset inicial de Home.
  }, [params.preset]);

  const codigoError = codigoErrorDominio(cotizar.error);
  const huboErrorGenerico = cotizar.isError && !esErrorDeRed(cotizar.error) && codigoError !== 'FUERA_DE_COBERTURA';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScreenHeader title="Tu viaje" />
      <View style={{ paddingHorizontal: theme.spacing.lg, gap: theme.spacing.sm }}>
        <PointRow marker="●" label="Origen" value={UBICACION_ACTUAL_MOCK.direccion} />
        <PointRow
          marker="▼"
          label="Destino"
          value={query || 'Escribe tu destino…'}
          markerColor={theme.colors.brandPressed}
        />

        {/* Pin-drop: método PRINCIPAL de selección de destino en Yarumal (la
            geocodificación por texto es insuficiente — ver decision-
            geocodificacion-yarumal.md). El texto de abajo sigue disponible,
            pero no bloquea ni es requisito. */}
        <Map
          pinDrop
          center={{ lat: UBICACION_ACTUAL_MOCK.lat, lng: UBICACION_ACTUAL_MOCK.lng }}
          markers={[
            {
              id: 'origen',
              kind: 'origen',
              coord: { lat: UBICACION_ACTUAL_MOCK.lat, lng: UBICACION_ACTUAL_MOCK.lng },
              label: `Origen: ${UBICACION_ACTUAL_MOCK.direccion}`,
            },
          ]}
          onPickLocation={setPinCandidate}
          height={200}
        />
        {pinCandidate && (
          <Button
            label="Usar este punto como destino"
            variant="ghost"
            loading={cotizar.isPending}
            loadingLabel="Cotizando…"
            disabled={networkStatus === 'offline'}
            onPress={confirmarPin}
          />
        )}

        <Controller
          control={control}
          name="query"
          render={({ field: { onChange, value } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="Buscar dirección, sitio o referencia"
              placeholderTextColor={theme.colors.textMuted}
              autoFocus
              accessibilityLabel="Buscar destino"
              style={{
                minHeight: theme.touch.min,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.field,
                paddingHorizontal: theme.spacing.md,
                color: theme.colors.text,
                backgroundColor: theme.colors.surface,
              }}
            />
          )}
        />
        {networkStatus === 'offline' && (
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
            Sin conexión · no se puede cotizar un destino ahora.
          </Text>
        )}
      </View>

      <FlatList
        contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.sm }}
        data={sugerencias}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <Text style={{ ...theme.typography.small, color: theme.colors.textMuted, marginBottom: theme.spacing.xs }}>
              LUGARES DE YARUMAL
            </Text>
            {POIS_YARUMAL.map((poi) => (
              <Pressable
                key={poi.id}
                disabled={!poi.coord || networkStatus === 'offline' || cotizar.isPending}
                onPress={() => seleccionarPoi(poi)}
                accessibilityRole="button"
                accessibilityLabel={poi.coord ? poi.titulo : `${poi.titulo}, ubicación pendiente de confirmar`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: theme.touch.min,
                  gap: theme.spacing.sm,
                  padding: theme.spacing.sm,
                  borderRadius: theme.radius.field,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  opacity: poi.coord ? 1 : 0.6,
                  marginBottom: theme.spacing.sm,
                }}
              >
                <Text style={{ fontSize: 20 }}>{poi.icono}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...theme.typography.body, color: theme.colors.text }}>{poi.titulo}</Text>
                </View>
                {!poi.coord && <StatusBadge label="Pendiente" tone="warn" />}
              </Pressable>
            ))}
            <Text
              style={{
                ...theme.typography.small,
                color: theme.colors.textMuted,
                marginTop: theme.spacing.sm,
                marginBottom: theme.spacing.xs,
              }}
            >
              SUGERENCIAS
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ marginBottom: theme.spacing.sm }}>
            <Pressable
              disabled={networkStatus === 'offline' || cotizar.isPending}
              onPress={() => seleccionar(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.titulo}, ${item.subtitulo}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                minHeight: theme.touch.min,
                gap: theme.spacing.sm,
                padding: theme.spacing.sm,
                borderRadius: theme.radius.field,
                borderWidth: 1,
                borderColor: coberturaErrorId === item.id ? theme.colors.danger : theme.colors.border,
                opacity: networkStatus === 'offline' ? 0.5 : 1,
              }}
            >
              <Text style={{ fontSize: 20 }}>{item.icono}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ ...theme.typography.body, color: theme.colors.text }}>{item.titulo}</Text>
                <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>{item.subtitulo}</Text>
              </View>
            </Pressable>
            {coberturaErrorId === item.id && (
              // RN no tiene un equivalente 1:1 de aria-invalid/aria-describedby;
              // `accessibilityRole="alert"` es la forma idiomática de anunciar el error.
              <View accessibilityRole="alert" style={{ marginTop: 4 }}>
                <Text style={{ ...theme.typography.small, fontWeight: '700', color: theme.colors.danger }}>
                  Fuera de cobertura
                </Text>
                <Text style={{ ...theme.typography.small, color: theme.colors.danger }}>
                  Ese destino está fuera de la zona donde operamos en Yarumal por ahora.
                </Text>
              </View>
            )}
          </View>
        )}
      />

      {huboErrorGenerico && (
        <View style={{ padding: theme.spacing.lg }}>
          <ErrorState title="No pudimos cotizar tu viaje" onRetry={() => cotizar.reset()} />
        </View>
      )}
    </SafeAreaView>
  );
}
