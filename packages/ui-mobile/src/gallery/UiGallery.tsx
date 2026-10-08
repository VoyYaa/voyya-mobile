import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { ThemeProvider, useTheme } from '../theme';
import type { ThemeMode } from '../tokens';
import { ReducedMotionProvider } from '../hooks/useReducedMotion';
import { Chip } from '../components/Chip';
import { Toast, type ToastTone } from '../components/Toast';
import { ColorSection, TypographySection } from './sections/FoundationSections';
import {
  BadgeSection,
  ButtonSection,
  CardSection,
  FieldSection,
  HeaderSection,
  OtpSection,
  PriceRouteSection,
} from './sections/ControlSections';
import { LoadingSection, MarkSection, MotionSection } from './sections/BrandSections';
import {
  BannerSection,
  CountdownSection,
  OverlaySection,
  StateSection,
} from './sections/FeedbackSections';
import { GalleryRow, GallerySection } from './GallerySection';

export interface UiGalleryProps {
  initialMode?: ThemeMode;
  initialReducedMotion?: boolean;
  initialFontsReady?: boolean;
}

interface GalleryBodyProps {
  mode: ThemeMode;
  reduced: boolean;
  fontsReady: boolean;
  onMode: (mode: ThemeMode) => void;
  onReduced: (reduced: boolean) => void;
  onFonts: (fontsReady: boolean) => void;
}

function GalleryBody({
  mode,
  reduced,
  fontsReady,
  onMode,
  onReduced,
  onFonts,
}: GalleryBodyProps): React.JSX.Element {
  const theme = useTheme();
  const [toast, setToast] = useState<{ tone: ToastTone; visible: boolean }>({
    tone: 'neutral',
    visible: false,
  });

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }} testID="ui-gallery">
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.gutter,
          paddingBottom: theme.spacing.x4l * 2,
        }}
      >
        <Text
          accessibilityRole="header"
          style={{ ...theme.typography.headline, color: theme.colors.text }}
        >
          Galería de componentes
        </Text>
        <GallerySection title="Preferencias">
          <GalleryRow>
            <Chip label="Claro" selected={mode === 'light'} onPress={() => onMode('light')} />
            <Chip label="Oscuro" selected={mode === 'dark'} onPress={() => onMode('dark')} />
          </GalleryRow>
          <GalleryRow>
            <Chip label="Movimiento normal" selected={!reduced} onPress={() => onReduced(false)} />
            <Chip label="Movimiento reducido" selected={reduced} onPress={() => onReduced(true)} />
          </GalleryRow>
          <GalleryRow>
            <Chip label="Nunito" selected={fontsReady} onPress={() => onFonts(true)} />
            <Chip label="Pesos de sistema" selected={!fontsReady} onPress={() => onFonts(false)} />
          </GalleryRow>
        </GallerySection>
        <ColorSection />
        <TypographySection />
        <ButtonSection />
        <BadgeSection />
        <CardSection />
        <FieldSection />
        <OtpSection />
        <PriceRouteSection />
        <HeaderSection />
        <MarkSection />
        <LoadingSection />
        <MotionSection />
        <StateSection />
        <CountdownSection />
        <BannerSection />
        <OverlaySection showToast={(tone) => setToast({ tone, visible: true })} />
      </ScrollView>
      <Toast
        message="Aviso de ejemplo"
        tone={toast.tone}
        visible={toast.visible}
        onHide={() => setToast((previous) => ({ ...previous, visible: false }))}
      />
    </View>
  );
}

function GalleryRoot({
  initialMode = 'light',
  initialReducedMotion = false,
  initialFontsReady = false,
}: UiGalleryProps): React.JSX.Element {
  const [mode, setMode] = useState<ThemeMode>(initialMode);
  const [reduced, setReduced] = useState(initialReducedMotion);
  const [fontsReady, setFontsReady] = useState(initialFontsReady);

  return (
    <ThemeProvider overrideMode={mode} fontsReady={fontsReady}>
      <ReducedMotionProvider value={reduced}>
        <GalleryBody
          mode={mode}
          reduced={reduced}
          fontsReady={fontsReady}
          onMode={setMode}
          onReduced={setReduced}
          onFonts={setFontsReady}
        />
      </ReducedMotionProvider>
    </ThemeProvider>
  );
}

export function UiGallery(props: UiGalleryProps): React.JSX.Element | null {
  if (!__DEV__) return null;
  return <GalleryRoot {...props} />;
}
