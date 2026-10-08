import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../theme';
import type { ColorTokens } from '../../palette';
import { Button, type ButtonSize, type ButtonVariant } from '../../components/Button';
import { LinkButton } from '../../components/LinkButton';
import { Chip } from '../../components/Chip';
import { StatusBadge } from '../../components/StatusBadge';
import { Card, type CardTone } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { OtpInput, type OtpInputStatus } from '../../components/OtpInput';
import { PriceTag } from '../../components/PriceTag';
import { PointRoute } from '../../components/PointRow';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Stage } from '../../components/Stage';
import { tripStatusTone, type TripStatusValue } from '../../utils/trip-status-tone';
import { GalleryCaption, GalleryRow, GallerySection } from '../GallerySection';

const noop = (): void => undefined;

const BUTTON_VARIANTS: readonly ButtonVariant[] = [
  'primary',
  'secondary',
  'go',
  'ghost',
  'danger',
  'ghostOnStage',
];
const BUTTON_SIZES: readonly ButtonSize[] = ['sm', 'md', 'lg'];
const CARD_TEXT_COLOR: Record<CardTone, (colors: ColorTokens) => string> = {
  surface: (colors) => colors.text,
  alt: (colors) => colors.text,
  sunken: (colors) => colors.text,
  tint: (colors) => colors.text,
  raised: (colors) => colors.text,
  stage: (colors) => colors.onStage,
  danger: (colors) => colors.dangerInk,
};
const CARD_TONES: readonly CardTone[] = ['surface', 'sunken', 'tint', 'stage', 'raised', 'danger'];
const TRIP_STATUSES: readonly TripStatusValue[] = [
  'pending_assignment',
  'assigned',
  'driver_en_route',
  'in_progress',
  'completed',
  'cancelled_by_passenger',
  'no_driver',
  'no_show',
  'expired',
];

export function ButtonSection(): React.JSX.Element {
  const theme = useTheme();

  return (
    <GallerySection title="Botones">
      {BUTTON_VARIANTS.map((variant) => (
        <View
          key={variant}
          style={{
            gap: theme.spacing.sm,
            padding: variant === 'ghostOnStage' ? theme.spacing.md : 0,
            backgroundColor: variant === 'ghostOnStage' ? theme.colors.stage : 'transparent',
            borderRadius: theme.radius.card,
          }}
        >
          <GalleryCaption label={variant} />
          {BUTTON_SIZES.map((size) => (
            <Button
              key={size}
              label={`Botón ${size}`}
              variant={variant}
              size={size}
              onPress={noop}
              testID={`gallery-button-${variant}-${size}`}
            />
          ))}
          <Button
            label="Cargando"
            loadingLabel="Enviando…"
            variant={variant}
            loading
            onPress={noop}
          />
          <Button label="Deshabilitado" variant={variant} disabled onPress={noop} />
        </View>
      ))}
      <GalleryCaption label="LinkButton" />
      <GalleryRow>
        <LinkButton label="Cambiar" onPress={noop} />
        <LinkButton label="Cancelar viaje" tone="danger" onPress={noop} />
        <LinkButton label="Más opciones" tone="muted" onPress={noop} />
      </GalleryRow>
    </GallerySection>
  );
}

export function BadgeSection(): React.JSX.Element {
  return (
    <GallerySection title="Chips e insignias">
      <GalleryRow>
        <Chip label="Neutral" />
        <Chip label="Marca" tone="brand" />
        <Chip label="Aviso" tone="brandTint" />
        <Chip label="Éxito" tone="success" />
        <Chip label="Error" tone="danger" />
        <Chip label="Tocable" onPress={noop} />
        <Chip label="Seleccionado" selected onPress={noop} />
      </GalleryRow>
      <GalleryRow>
        {TRIP_STATUSES.map((status) => {
          const result = tripStatusTone(status);
          return (
            <StatusBadge
              key={status}
              label={result.label}
              tone={result.tone}
              pulse={result.pulse}
            />
          );
        })}
        <StatusBadge label="Llegó" tone="success" />
        <StatusBadge label="Sin conexión" tone="info" />
      </GalleryRow>
    </GallerySection>
  );
}

export function CardSection(): React.JSX.Element {
  const theme = useTheme();

  return (
    <GallerySection title="Tarjetas">
      {CARD_TONES.map((tone) => (
        <Card key={tone} tone={tone}>
          <Text
            style={{
              ...theme.typography.bodyStrong,
              color: CARD_TEXT_COLOR[tone](theme.colors),
            }}
          >
            {tone}
          </Text>
        </Card>
      ))}
      <Card onPress={noop} accessibilityLabel="Tarjeta tocable">
        <Text style={{ ...theme.typography.bodyStrong, color: theme.colors.text }}>Tocable</Text>
      </Card>
    </GallerySection>
  );
}

export function FieldSection(): React.JSX.Element {
  const [phone, setPhone] = useState('300 123 4567');
  const [empty, setEmpty] = useState('');
  const [secret, setSecret] = useState('1234');
  const theme = useTheme();

  return (
    <GallerySection title="Campos">
      <TextField label="Celular" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextField
        label="Con prefijo"
        value={empty}
        onChangeText={setEmpty}
        keyboardType="phone-pad"
        placeholder="300 000 0000"
        leadingAdornment={
          <Text style={{ ...theme.typography.bodyStrong, color: theme.colors.text }}>+57</Text>
        }
        helper="Te enviaremos un código por mensaje de texto."
      />
      <TextField
        label="Con error"
        value="30012"
        onChangeText={noop}
        error="Revisa el número: faltan dígitos."
      />
      <TextField label="Validando" value="3001234567" onChangeText={noop} loading />
      <TextField label="Deshabilitado" value="No editable" onChangeText={noop} disabled />
      <TextField
        label="PIN"
        value={secret}
        onChangeText={setSecret}
        keyboardType="number-pad"
        secureTextEntry
        revealable
        maxLength={4}
      />
    </GallerySection>
  );
}

export function OtpSection(): React.JSX.Element {
  const [value, setValue] = useState('12');
  const statuses: readonly OtpInputStatus[] = ['verifying', 'success'];

  return (
    <GallerySection title="Código OTP">
      <GalleryCaption label="editing" />
      <OtpInput value={value} onChangeValue={setValue} status="editing" />
      {statuses.map((status) => (
        <View key={status}>
          <GalleryCaption label={status} />
          <OtpInput value="1234" onChangeValue={noop} status={status} />
        </View>
      ))}
      <GalleryCaption label="error (se limpia a los 600 ms)" />
      <OtpInput value="1234" onChangeValue={noop} status="error" />
    </GallerySection>
  );
}

export function PriceRouteSection(): React.JSX.Element {
  const theme = useTheme();

  return (
    <GallerySection title="Precio y ruta">
      <GalleryRow>
        <PriceTag amountCOP={8000} size="sm" />
        <PriceTag amountCOP={8000} size="md" />
        <PriceTag amountCOP={8000} size="lg" />
        <PriceTag amountCOP={12500} size="xl" />
        <PriceTag amountCOP={8000} size="md" quiet />
      </GalleryRow>
      <Card>
        <View style={{ gap: theme.spacing.sm }}>
          <PointRoute
            origin={{ value: 'Parque Principal' }}
            destination={{ value: 'Hospital San Juan de Dios' }}
          />
        </View>
      </Card>
    </GallerySection>
  );
}

export function HeaderSection(): React.JSX.Element {
  return (
    <GallerySection title="Encabezados">
      <ScreenHeader title="Confirmar viaje" onBack={noop} />
      <ScreenHeader title="Tu viaje" variant="large" onBack={noop} scrolled />
      <Stage>
        <ScreenHeader title="Solicitud" tone="stage" onBack={noop} />
      </Stage>
      <ScreenHeader title="Título oculto" hideTitle onBack={noop} />
    </GallerySection>
  );
}
