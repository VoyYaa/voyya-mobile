import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { AccountAvatar, AccountSheet } from '../../components/AccountSheet';
import { BottomSheet } from '../../components/BottomSheet';
import { Button } from '../../components/Button';
import { CountdownRing, type CountdownRingStatus } from '../../components/CountdownRing';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState, OfflineState } from '../../components/ErrorState';
import { OfflineBanner } from '../../components/OfflineBanner';
import { Stage } from '../../components/Stage';
import type { ToastTone } from '../../components/Toast';
import { GalleryCaption, GalleryRow, GallerySection } from '../GallerySection';

const noop = (): void => undefined;

const TOAST_TONES: readonly ToastTone[] = ['neutral', 'success', 'danger', 'info'];
const COUNTDOWN_DURATION_SEC = 15;
const STATIC_RING_STATES: ReadonlyArray<{ status: CountdownRingStatus; remaining: number }> = [
  { status: 'counting', remaining: 3 },
  { status: 'success', remaining: 6 },
  { status: 'expired', remaining: 0 },
  { status: 'frozen', remaining: 9 },
];

export function StateSection(): React.JSX.Element {
  return (
    <GallerySection title="Estados">
      <EmptyState
        title="Sin solicitudes cercanas por ahora"
        body="Sigues visible para los pasajeros."
      />
      <ErrorState title="No pudimos cargar tu viaje" body="Inténtalo de nuevo." onRetry={noop} />
      <OfflineState onRetry={noop} />
      <EmptyState glyph="clock" title="No hay taxis disponibles ahora" />
      <EmptyState glyph="pin" title="Fuera de cobertura" />
      <EmptyState glyph="search" title="Sin resultados" />
      <EmptyState glyph="success" title="Todo al día" />
      <Stage>
        <EmptyState
          tone="onStage"
          glyph="clock"
          title="No hay taxis disponibles ahora"
          body="Prueba de nuevo en unos minutos."
          primaryAction={{ label: 'Intentar de nuevo', onPress: noop }}
          secondaryAction={{ label: 'Volver al inicio', onPress: noop }}
        />
      </Stage>
    </GallerySection>
  );
}

function LiveCountdown(): React.JSX.Element {
  const [remaining, setRemaining] = useState(COUNTDOWN_DURATION_SEC);

  useEffect(() => {
    const interval = setInterval(
      () => setRemaining((previous) => (previous <= 0 ? COUNTDOWN_DURATION_SEC : previous - 1)),
      1000,
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <CountdownRing
      durationSec={COUNTDOWN_DURATION_SEC}
      remainingSec={remaining}
      status={remaining <= 0 ? 'expired' : 'counting'}
      tone="onStage"
      size={220}
      testID="gallery-countdown-live"
    />
  );
}

export function CountdownSection(): React.JSX.Element {
  return (
    <GallerySection title="Temporizador">
      <Stage>
        <View style={{ alignItems: 'center', padding: 16, gap: 16 }}>
          <LiveCountdown />
          <GalleryRow>
            {STATIC_RING_STATES.map(({ status, remaining }) => (
              <View key={status} style={{ alignItems: 'center' }}>
                <CountdownRing
                  durationSec={COUNTDOWN_DURATION_SEC}
                  remainingSec={remaining}
                  status={status}
                  tone="onStage"
                  size={120}
                  dimmed={status === 'frozen'}
                />
                <GalleryCaption label={status} />
              </View>
            ))}
          </GalleryRow>
        </View>
      </Stage>
    </GallerySection>
  );
}

export function BannerSection(): React.JSX.Element {
  return (
    <GallerySection title="Banners">
      <OfflineBanner state="offline" lastUpdatedLabel="2 min" onRetryNow={noop} />
      <OfflineBanner state="reconnecting" onRetryNow={noop} />
      <OfflineBanner state="restored" />
    </GallerySection>
  );
}

export interface OverlayControls {
  showToast: (tone: ToastTone) => void;
}

export function OverlaySection({ showToast }: OverlayControls): React.JSX.Element {
  const theme = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <GallerySection title="Hojas y avisos">
      <GalleryRow>
        {TOAST_TONES.map((tone) => (
          <Button
            key={tone}
            label={`Aviso ${tone}`}
            size="sm"
            variant="ghost"
            onPress={() => showToast(tone)}
          />
        ))}
      </GalleryRow>
      <GalleryRow>
        <Button label="Abrir hoja" size="sm" variant="ghost" onPress={() => setSheetOpen(true)} />
        <AccountAvatar name="Laura" onPress={() => setAccountOpen(true)} />
        <AccountAvatar onPress={() => setAccountOpen(true)} />
      </GalleryRow>
      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="Hoja inferior">
        <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>
          Se cierra con el velo, con Atrás o arrastrando hacia abajo.
        </Text>
        <View style={{ marginTop: theme.spacing.lg }}>
          <Button label="Entendido" onPress={() => setSheetOpen(false)} />
        </View>
      </BottomSheet>
      <AccountSheet
        visible={accountOpen}
        onClose={() => setAccountOpen(false)}
        onLogout={() => setAccountOpen(false)}
        name="Laura Gómez"
        phoneMasked="+57 300 ••• 4567"
        onPrivacy={noop}
      />
    </GallerySection>
  );
}
