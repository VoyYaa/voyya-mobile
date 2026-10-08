import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Linking, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  ErrorState,
  Map,
  PointRow,
  ScreenHeader,
  StatusBadge,
  useTheme,
  type MapLatLng,
} from '@voyyaa/ui-mobile';
import type { Location } from '@voyyaa/shared';
import { domainErrorCode, isNetworkError, useNetworkStatus } from '@voyyaa/app-runtime';
import { useQuoteFare } from '../src/hooks/useQuoteFare';
import { useResolveOrigin } from '../src/hooks/useResolveOrigin';
import { useTripDraftStore } from '../src/state/useTripDraftStore';
import { YARUMAL_CENTER } from '../src/constants/demo-places';
import { POIS_YARUMAL, type PoiYarumal } from '../src/constants/pois-yarumal';

interface SelectedPlace {
  id: string;
  title: string;
  lat: number;
  lng: number;
}

const SearchSchema = z.object({ query: z.string() });
type SearchForm = z.infer<typeof SearchSchema>;

function coverageMessage(target: 'origen' | 'destino'): string {
  return target === 'origen'
    ? 'Ese punto de partida está fuera de la zona donde operamos en Yarumal por ahora.'
    : 'Ese destino está fuera de la zona donde operamos en Yarumal por ahora.';
}

export default function DestinationScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const networkStatus = useNetworkStatus();
  const quoteFare = useQuoteFare();
  const originQuote = useQuoteFare();
  const resolveOrigin = useResolveOrigin();

  const origin = useTripDraftStore((s) => s.origin);
  const originSource = useTripDraftStore((s) => s.originSource);
  const setOrigin = useTripDraftStore((s) => s.setOrigin);
  const clearOrigin = useTripDraftStore((s) => s.clearOrigin);
  const setOriginDestination = useTripDraftStore((s) => s.setOriginDestination);
  const setQuote = useTripDraftStore((s) => s.setQuote);
  const municipalityId = useTripDraftStore((s) => s.municipalityId);

  const [coverageErrorId, setCoverageErrorId] = useState<string | null>(null);
  const [pinCandidate, setPinCandidate] = useState<MapLatLng | null>(null);
  const [originPinCandidate, setOriginPinCandidate] = useState<MapLatLng | null>(null);
  const [originCoverageBlocked, setOriginCoverageBlocked] = useState(false);

  const isFixingOrigin = origin === null;

  const { control, watch } = useForm<SearchForm>({
    resolver: zodResolver(SearchSchema),
    defaultValues: { query: '' },
  });
  const query = watch('query');

  const visiblePois = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return POIS_YARUMAL;
    return POIS_YARUMAL.filter((poi) => poi.title.toLowerCase().includes(text));
  }, [query]);

  useEffect(() => {
    if (resolveOrigin.status === 'resolved' && resolveOrigin.origin) {
      setOrigin(resolveOrigin.origin, 'gps');
    }
  }, [resolveOrigin.status, resolveOrigin.origin, setOrigin]);

  const selectPlace = (place: SelectedPlace): void => {
    if (!origin) return;
    setCoverageErrorId(null);
    const destination: Location = { address: place.title, lat: place.lat, lng: place.lng };
    quoteFare.mutate(
      { origin, destination, municipality_id: municipalityId, service_type: 'taxi' },
      {
        onSuccess: (quote) => {
          setOriginDestination(origin, destination);
          setQuote(quote);
          router.push('/confirm');
        },
        onError: (error) => {
          if (domainErrorCode(error) === 'OUT_OF_COVERAGE') {
            setCoverageErrorId(place.id);
          }
        },
      },
    );
  };

  const confirmPin = (): void => {
    if (!pinCandidate) return;
    selectPlace({
      id: 'pin-drop',
      title: 'Punto marcado en el mapa',
      lat: pinCandidate.lat,
      lng: pinCandidate.lng,
    });
  };

  const selectPoi = (poi: PoiYarumal): void => {
    if (!poi.coord) return;
    selectPlace({
      id: poi.id,
      title: poi.title,
      lat: poi.coord.lat,
      lng: poi.coord.lng,
    });
  };

  const confirmOriginPin = (): void => {
    if (!originPinCandidate) return;
    setOriginCoverageBlocked(false);
    const candidate: Location = {
      address: 'Punto marcado en el mapa',
      lat: originPinCandidate.lat,
      lng: originPinCandidate.lng,
    };
    originQuote.mutate(
      {
        origin: candidate,
        destination: candidate,
        municipality_id: municipalityId,
        service_type: 'taxi',
      },
      {
        onSuccess: () => setOrigin(candidate, 'manual'),
        onError: (error) => {
          if (domainErrorCode(error) === 'OUT_OF_COVERAGE') {
            setOriginCoverageBlocked(true);
          }
        },
      },
    );
  };

  const selectOriginPoi = (poi: PoiYarumal): void => {
    if (!poi.coord) return;
    setOriginCoverageBlocked(false);
    const candidate: Location = { address: poi.title, lat: poi.coord.lat, lng: poi.coord.lng };
    originQuote.mutate(
      {
        origin: candidate,
        destination: candidate,
        municipality_id: municipalityId,
        service_type: 'taxi',
      },
      {
        onSuccess: () => setOrigin(candidate, 'manual'),
        onError: (error) => {
          if (domainErrorCode(error) === 'OUT_OF_COVERAGE') {
            setOriginCoverageBlocked(true);
          }
        },
      },
    );
  };

  const retryUseMyLocation = (): void => {
    if (!resolveOrigin.canAskAgain) {
      void Linking.openSettings();
      return;
    }
    resolveOrigin.resolve();
  };

  const errorCode = domainErrorCode(quoteFare.error);
  const hasGenericError =
    quoteFare.isError && !isNetworkError(quoteFare.error) && errorCode !== 'OUT_OF_COVERAGE';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScreenHeader title="Tu viaje" onBack={() => router.back()} />
      <View style={{ paddingHorizontal: theme.spacing.lg, gap: theme.spacing.sm }}>
        {isFixingOrigin ? (
          <View style={{ gap: 2 }}>
            <Text style={{ ...theme.typography.subtitle, color: theme.colors.text }}>
              Aún no tienes un punto de partida
            </Text>
            <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
              Márcalo en el mapa o elige un lugar conocido.
            </Text>
            <Text
              accessibilityRole="link"
              onPress={retryUseMyLocation}
              style={{
                ...theme.typography.small,
                fontWeight: '700',
                color: theme.colors.brandInk,
                marginTop: 4,
              }}
            >
              Usar mi ubicación
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm }}>
            <View style={{ flex: 1 }}>
              <PointRow marker="●" label="Origen" value={origin.address} />
            </View>
            {originSource === 'manual' && (
              <Text
                accessibilityRole="link"
                onPress={clearOrigin}
                style={{
                  ...theme.typography.small,
                  fontWeight: '700',
                  color: theme.colors.brandInk,
                  marginTop: theme.spacing.xs,
                }}
              >
                Cambiar
              </Text>
            )}
          </View>
        )}

        {!isFixingOrigin && (
          <PointRow
            marker="▼"
            label="Destino"
            value={query || 'Escribe tu destino…'}
            markerColor={theme.colors.brandInk}
          />
        )}

        <Map
          pinDrop
          center={
            isFixingOrigin
              ? (originPinCandidate ?? YARUMAL_CENTER)
              : { lat: origin.lat, lng: origin.lng }
          }
          markers={
            isFixingOrigin
              ? []
              : [
                  {
                    id: 'origin',
                    kind: 'origin',
                    coord: { lat: origin.lat, lng: origin.lng },
                    label: `Origen: ${origin.address}`,
                  },
                ]
          }
          onPickLocation={isFixingOrigin ? setOriginPinCandidate : setPinCandidate}
          height={200}
        />

        {isFixingOrigin && originPinCandidate && (
          <>
            <Button
              label="Usar este punto como origen"
              variant="ghost"
              loading={originQuote.isPending}
              loadingLabel="Verificando…"
              disabled={networkStatus === 'offline'}
              onPress={confirmOriginPin}
            />
            {originCoverageBlocked && (
              <View accessibilityRole="alert">
                <Text
                  style={{
                    ...theme.typography.small,
                    fontWeight: '700',
                    color: theme.colors.dangerInk,
                  }}
                >
                  Fuera de cobertura
                </Text>
                <Text style={{ ...theme.typography.small, color: theme.colors.dangerInk }}>
                  {coverageMessage('origen')}
                </Text>
              </View>
            )}
          </>
        )}

        {!isFixingOrigin && pinCandidate && (
          <>
            <Button
              label="Usar este punto como destino"
              variant="ghost"
              loading={quoteFare.isPending}
              loadingLabel="Cotizando…"
              disabled={networkStatus === 'offline'}
              onPress={confirmPin}
            />
            {coverageErrorId === 'pin-drop' && (
              <View accessibilityRole="alert">
                <Text
                  style={{
                    ...theme.typography.small,
                    fontWeight: '700',
                    color: theme.colors.dangerInk,
                  }}
                >
                  Fuera de cobertura
                </Text>
                <Text style={{ ...theme.typography.small, color: theme.colors.dangerInk }}>
                  {coverageMessage('destino')}
                </Text>
              </View>
            )}
          </>
        )}

        {!isFixingOrigin && (
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
        )}
        {!isFixingOrigin && networkStatus === 'offline' && (
          <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
            Sin conexión · no se puede cotizar un destino ahora.
          </Text>
        )}
      </View>

      <FlatList
        contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.sm }}
        data={visiblePois}
        keyExtractor={(poi) => poi.id}
        ListHeaderComponent={
          <Text
            style={{
              ...theme.typography.small,
              color: theme.colors.textMuted,
              marginBottom: theme.spacing.xs,
            }}
          >
            LUGARES DE YARUMAL
          </Text>
        }
        ListEmptyComponent={
          <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>
            No encontramos ese lugar. Márcalo en el mapa.
          </Text>
        }
        renderItem={({ item: poi }) => (
          <View style={{ marginBottom: theme.spacing.sm }}>
            <Pressable
              disabled={
                !poi.coord ||
                networkStatus === 'offline' ||
                quoteFare.isPending ||
                originQuote.isPending
              }
              onPress={() => (isFixingOrigin ? selectOriginPoi(poi) : selectPoi(poi))}
              accessibilityRole="button"
              accessibilityLabel={
                poi.coord
                  ? poi.title
                  : `${poi.title}, ubicación pendiente de confirmar, márcalo en el mapa`
              }
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                minHeight: theme.touch.min,
                gap: theme.spacing.sm,
                padding: theme.spacing.sm,
                borderRadius: theme.radius.field,
                borderWidth: 1,
                borderColor: coverageErrorId === poi.id ? theme.colors.danger : theme.colors.border,
                opacity: poi.coord ? 1 : 0.6,
              }}
            >
              <Text style={{ fontSize: 20 }}>{poi.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ ...theme.typography.body, color: theme.colors.text }}>
                  {poi.title}
                </Text>
                {!poi.coord && (
                  <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
                    Ubicación pendiente de confirmar · márcalo en el mapa
                  </Text>
                )}
              </View>
              {!poi.coord && <StatusBadge label="Pendiente" tone="warn" />}
            </Pressable>
            {coverageErrorId === poi.id && (
              <View accessibilityRole="alert" style={{ marginTop: 4 }}>
                <Text
                  style={{
                    ...theme.typography.small,
                    fontWeight: '700',
                    color: theme.colors.dangerInk,
                  }}
                >
                  Fuera de cobertura
                </Text>
                <Text style={{ ...theme.typography.small, color: theme.colors.dangerInk }}>
                  {coverageMessage('destino')}
                </Text>
              </View>
            )}
          </View>
        )}
      />

      {hasGenericError && (
        <View style={{ padding: theme.spacing.lg }}>
          <ErrorState title="No pudimos cotizar tu viaje" onRetry={() => quoteFare.reset()} />
        </View>
      )}
    </SafeAreaView>
  );
}
