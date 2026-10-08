import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { BootScreen } from '../../components/brand/BootScreen';
import { BrandLoader } from '../../components/brand/BrandLoader';
import { BrandHop } from '../../components/brand/BrandHop';
import { BrandMark } from '../../components/brand/BrandMark';
import { BrandMorph, type BrandMorphTarget } from '../../components/brand/BrandMorph';
import { BrandSpinner, type BrandSpinnerSize } from '../../components/brand/BrandSpinner';
import { MarkGlyph, type MarkGlyphName } from '../../components/brand/MarkGlyph';
import { RadarPulse } from '../../components/brand/RadarPulse';
import { AccentText } from '../../components/AccentText';
import { Button } from '../../components/Button';
import { ProgressRail } from '../../components/ProgressRail';
import { Reveal } from '../../components/Reveal';
import { Skeleton, SkeletonList } from '../../components/Skeleton';
import { Stage } from '../../components/Stage';
import { GalleryCaption, GalleryRow, GallerySection } from '../GallerySection';

const noop = (): void => undefined;

const GLYPHS: readonly MarkGlyphName[] = [
  'empty',
  'clock',
  'error',
  'offline',
  'success',
  'pin',
  'search',
];
const SPINNER_SIZES: readonly BrandSpinnerSize[] = [16, 20, 24, 32];
const MORPH_FRAMES: readonly number[] = [0, 0.25, 0.5, 0.75, 1];
const MORPH_TARGETS: readonly BrandMorphTarget[] = ['person', 'car'];
const BOOT_BOX_SIZE = 240;
const BOOT_READY_DELAY_MS = 1200;

function MorphRow({ target }: { target: BrandMorphTarget }): React.JSX.Element {
  const frames = useMemo(() => MORPH_FRAMES.map((value) => new Animated.Value(value)), []);

  return (
    <Stage>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 8, gap: 8 }}>
        {frames.map((progress, index) => {
          const value = MORPH_FRAMES[index] ?? 0;
          return (
            <BrandMorph
              key={value}
              target={target}
              progress={progress}
              size={88}
              ringOpacity={value === 0 ? 1 : 0}
              wheelsOpacity={value >= 1 ? 1 : 0}
              testID={`gallery-morph-${target}-${Math.round(value * 100)}`}
            />
          );
        })}
      </View>
    </Stage>
  );
}

function BootDemo(): React.JSX.Element {
  const theme = useTheme();
  const [target, setTarget] = useState<BrandMorphTarget>('person');
  const [runId, setRunId] = useState(0);
  const [ready, setReady] = useState(true);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const replay = (nextTarget: BrandMorphTarget): void => {
    if (timer.current) clearTimeout(timer.current);
    setTarget(nextTarget);
    setReady(false);
    setDone(false);
    setRunId((previous) => previous + 1);
    timer.current = setTimeout(() => setReady(true), BOOT_READY_DELAY_MS);
  };

  return (
    <>
      <GalleryRow>
        <Button label="Pasajero" size="sm" variant="ghost" onPress={() => replay('person')} />
        <Button label="Conductor" size="sm" variant="ghost" onPress={() => replay('car')} />
      </GalleryRow>
      <View
        style={{
          width: BOOT_BOX_SIZE,
          height: BOOT_BOX_SIZE,
          borderRadius: theme.radius.card,
          overflow: 'hidden',
          backgroundColor: theme.colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ ...theme.typography.bodyStrong, color: theme.colors.text }}>
          {done ? 'App lista' : 'Arrancando…'}
        </Text>
        {!done && (
          <BootScreen
            key={runId}
            target={target}
            ready={ready}
            size={BOOT_BOX_SIZE}
            onDone={() => setDone(true)}
          />
        )}
      </View>
    </>
  );
}

export function MarkSection(): React.JSX.Element {
  return (
    <GallerySection title="Marca">
      <Stage>
        <GalleryRow>
          <BrandMark size={64} />
          <BrandMark size={64} role="driver" />
          <BrandMark size={64} role="neutral" />
          <BrandMark size={48} wordmark />
        </GalleryRow>
      </Stage>
      <GalleryRow>
        <BrandMark size={64} tone="onLight" />
        <BrandMark size={64} role="driver" tone="onLight" />
        <BrandMark size={48} tone="onLight" wordmark />
      </GalleryRow>
      <GalleryCaption label="Glifos (con dibujo de entrada)" />
      <GalleryRow>
        {GLYPHS.map((glyph) => (
          <View key={glyph} style={{ alignItems: 'center' }}>
            <MarkGlyph glyph={glyph} size={64} animate />
            <GalleryCaption label={glyph} />
          </View>
        ))}
      </GalleryRow>
    </GallerySection>
  );
}

export function LoadingSection(): React.JSX.Element {
  const theme = useTheme();
  const [overlay, setOverlay] = useState(false);

  return (
    <GallerySection title="Carga de marca">
      <GalleryCaption label="BrandSpinner" />
      <GalleryRow>
        {SPINNER_SIZES.map((size) => (
          <BrandSpinner key={size} size={size} />
        ))}
        <View style={{ backgroundColor: theme.colors.stage, padding: theme.spacing.sm }}>
          <BrandSpinner size={24} tone="onDark" />
        </View>
        <View style={{ backgroundColor: theme.colors.brand, padding: theme.spacing.sm }}>
          <BrandSpinner size={24} tone="onBrand" />
        </View>
      </GalleryRow>
      <GalleryCaption label="BrandLoader md, lg, xl" />
      <Stage style={{ height: 200 }}>
        <BrandLoader size="md" label="Cargando…" testID="gallery-brand-loader-md" />
      </Stage>
      <Stage style={{ height: 240 }}>
        <BrandLoader size="lg" />
      </Stage>
      <Stage style={{ height: 300 }}>
        <BrandLoader size="xl" label="Buscando tu ubicación…" />
      </Stage>
      <GalleryCaption label="RadarPulse" />
      <Stage>
        <GalleryRow>
          <RadarPulse size={120} rings={1} />
          <RadarPulse size={120} rings={2} />
          <RadarPulse size={120} rings={3} color={theme.colors.success} />
        </GalleryRow>
      </Stage>
      <GalleryCaption label="BrandLoader overlay" />
      <Button label="Mostrar overlay" variant="ghost" size="sm" onPress={() => setOverlay(true)} />
      {overlay && (
        <View style={{ height: 220 }}>
          <BrandLoader variant="overlay" onCancel={() => setOverlay(false)} />
        </View>
      )}
      <GalleryCaption label="Skeleton" />
      <Skeleton height={20} width="70%" />
      <SkeletonList count={3} />
      <SkeletonList count={2} variant="row" />
      <GalleryCaption label="ProgressRail" />
      <ProgressRail />
      <ProgressRail value={0.4} />
    </GallerySection>
  );
}

export function MotionSection(): React.JSX.Element {
  const theme = useTheme();

  return (
    <GallerySection title="Movimiento">
      <GalleryCaption label="BrandMorph en 0, 25, 50, 75 y 100 %" />
      {MORPH_TARGETS.map((target) => (
        <MorphRow key={target} target={target} />
      ))}
      <GalleryCaption label="BrandHop: ciclo salto, aterrizaje y figura (pasajero, conductor, neutro)" />
      <Stage>
        <GalleryRow>
          <BrandHop size={144} target="person" testID="gallery-hop-person" />
          <BrandHop size={144} target="car" ringColor={theme.colors.success} testID="gallery-hop-car" />
          <BrandHop size={96} testID="gallery-hop-neutral" />
        </GalleryRow>
      </Stage>
      <GalleryCaption label="BootScreen" />
      <BootDemo />
      <GalleryCaption label="AccentText y Reveal" />
      <Stage style={{ padding: theme.spacing.gutter }}>
        <Reveal index={0}>
          <AccentText accent="sin llamar a nadie" color={theme.colors.onStage}>
            Tu taxi, sin llamar a nadie.
          </AccentText>
        </Reveal>
        <Reveal index={1}>
          <Text style={{ ...theme.typography.body, color: theme.colors.onStageMuted }}>
            Segundo elemento de la entrada escalonada.
          </Text>
        </Reveal>
        <Reveal index={2}>
          <Button label="Continuar" size="lg" onPress={noop} />
        </Reveal>
      </Stage>
    </GallerySection>
  );
}
