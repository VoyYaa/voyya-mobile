import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { domainErrorCode, isNetworkError, useNetworkStatus } from '@voyyaa/app-runtime';
import { useQuoteFare } from '../src/hooks/useQuoteFare';
import { useTripDraftStore } from '../src/state/useTripDraftStore';
import {
  CURRENT_LOCATION_MOCK,
  DESTINATION_SUGGESTIONS,
  type SuggestedPlace,
} from '../src/constants/demo-places';
import { POIS_YARUMAL, type PoiYarumal } from '../src/constants/pois-yarumal';

const SearchSchema = z.object({ query: z.string() });
type SearchForm = z.infer<typeof SearchSchema>;

export default function DestinationScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ preset?: string }>();
  const networkStatus = useNetworkStatus();
  const quoteFare = useQuoteFare();
  const setOriginDestination = useTripDraftStore((s) => s.setOriginDestination);
  const setQuote = useTripDraftStore((s) => s.setQuote);
  const municipalityId = useTripDraftStore((s) => s.municipalityId);

  const [coverageErrorId, setCoverageErrorId] = useState<string | null>(null);
  const [pinCandidate, setPinCandidate] = useState<MapLatLng | null>(null);

  const { control, watch } = useForm<SearchForm>({
    resolver: zodResolver(SearchSchema),
    defaultValues: { query: '' },
  });
  const query = watch('query');

  const suggestions = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return DESTINATION_SUGGESTIONS;
    return DESTINATION_SUGGESTIONS.filter((place) => place.title.toLowerCase().includes(text));
  }, [query]);

  const selectPlace = (place: SuggestedPlace): void => {
    setCoverageErrorId(null);
    const destination = { address: place.title, lat: place.lat, lng: place.lng };
    quoteFare.mutate(
      {
        origin: CURRENT_LOCATION_MOCK,
        destination,
        municipality_id: municipalityId,
        service_type: 'taxi',
      },
      {
        onSuccess: (quote) => {
          setOriginDestination(CURRENT_LOCATION_MOCK, destination);
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
      icon: '📍',
      title: 'Punto marcado en el mapa',
      subtitle: `${pinCandidate.lat.toFixed(5)}, ${pinCandidate.lng.toFixed(5)}`,
      lat: pinCandidate.lat,
      lng: pinCandidate.lng,
    });
  };

  const selectPoi = (poi: PoiYarumal): void => {
    if (!poi.coord) return;
    selectPlace({
      id: poi.id,
      icon: poi.icon,
      title: poi.title,
      subtitle: 'Yarumal',
      lat: poi.coord.lat,
      lng: poi.coord.lng,
    });
  };

  useEffect(() => {
    if (!params.preset) return;
    const preset = DESTINATION_SUGGESTIONS.find((place) => place.id === params.preset);
    if (preset) selectPlace(preset);
  }, [params.preset]);

  const errorCode = domainErrorCode(quoteFare.error);
  const hasGenericError =
    quoteFare.isError && !isNetworkError(quoteFare.error) && errorCode !== 'OUT_OF_COVERAGE';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScreenHeader title="Tu viaje" onBack={() => router.back()} />
      <View style={{ paddingHorizontal: theme.spacing.lg, gap: theme.spacing.sm }}>
        <PointRow marker="●" label="Origen" value={CURRENT_LOCATION_MOCK.address} />
        <PointRow
          marker="▼"
          label="Destino"
          value={query || 'Escribe tu destino…'}
          markerColor={theme.colors.brandPressed}
        />

        <Map
          pinDrop
          center={{ lat: CURRENT_LOCATION_MOCK.lat, lng: CURRENT_LOCATION_MOCK.lng }}
          markers={[
            {
              id: 'origin',
              kind: 'origin',
              coord: { lat: CURRENT_LOCATION_MOCK.lat, lng: CURRENT_LOCATION_MOCK.lng },
              label: `Origen: ${CURRENT_LOCATION_MOCK.address}`,
            },
          ]}
          onPickLocation={setPinCandidate}
          height={200}
        />
        {pinCandidate && (
          <Button
            label="Usar este punto como destino"
            variant="ghost"
            loading={quoteFare.isPending}
            loadingLabel="Cotizando…"
            disabled={networkStatus === 'offline'}
            onPress={confirmPin}
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
        data={suggestions}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <Text
              style={{
                ...theme.typography.small,
                color: theme.colors.textMuted,
                marginBottom: theme.spacing.xs,
              }}
            >
              LUGARES DE YARUMAL
            </Text>
            {POIS_YARUMAL.map((poi) => (
              <Pressable
                key={poi.id}
                disabled={!poi.coord || networkStatus === 'offline' || quoteFare.isPending}
                onPress={() => selectPoi(poi)}
                accessibilityRole="button"
                accessibilityLabel={
                  poi.coord ? poi.title : `${poi.title}, ubicación pendiente de confirmar`
                }
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
                <Text style={{ fontSize: 20 }}>{poi.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...theme.typography.body, color: theme.colors.text }}>
                    {poi.title}
                  </Text>
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
              disabled={networkStatus === 'offline' || quoteFare.isPending}
              onPress={() => selectPlace(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}, ${item.subtitle}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                minHeight: theme.touch.min,
                gap: theme.spacing.sm,
                padding: theme.spacing.sm,
                borderRadius: theme.radius.field,
                borderWidth: 1,
                borderColor:
                  coverageErrorId === item.id ? theme.colors.danger : theme.colors.border,
                opacity: networkStatus === 'offline' ? 0.5 : 1,
              }}
            >
              <Text style={{ fontSize: 20 }}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ ...theme.typography.body, color: theme.colors.text }}>
                  {item.title}
                </Text>
                <Text style={{ ...theme.typography.small, color: theme.colors.textMuted }}>
                  {item.subtitle}
                </Text>
              </View>
            </Pressable>
            {coverageErrorId === item.id && (
              <View accessibilityRole="alert" style={{ marginTop: 4 }}>
                <Text
                  style={{
                    ...theme.typography.small,
                    fontWeight: '700',
                    color: theme.colors.danger,
                  }}
                >
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

      {hasGenericError && (
        <View style={{ padding: theme.spacing.lg }}>
          <ErrorState title="No pudimos cotizar tu viaje" onRetry={() => quoteFare.reset()} />
        </View>
      )}
    </SafeAreaView>
  );
}
