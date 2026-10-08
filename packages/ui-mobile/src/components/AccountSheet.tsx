import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../theme';
import { uiCopy } from '../copy';
import { useFocusState } from '../hooks/useFocusState';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { LinkButton } from './LinkButton';

export interface AccountAvatarProps {
  name?: string;
  onPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
}

const AVATAR_SIZE = 44;

export function AccountAvatar({
  name,
  onPress,
  accessibilityLabel = uiCopy.accountOpen,
  testID,
}: AccountAvatarProps): React.JSX.Element {
  const theme = useTheme();
  const { focused, onFocus, onBlur } = useFocusState();
  const initial = name?.trim().charAt(0).toUpperCase() ?? '';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onFocus={onFocus}
      onBlur={onBlur}
      testID={testID}
      style={{
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.stage,
        borderWidth: 2,
        borderColor: focused ? theme.colors.focusRing : theme.colors.brand,
      }}
    >
      {initial.length > 0 ? (
        <Text style={{ ...theme.typography.subtitle, color: theme.colors.onStage }}>{initial}</Text>
      ) : (
        <Svg width={22} height={22} viewBox="0 0 24 24">
          <Circle cx={12} cy={8} r={4} fill={theme.colors.onStage} />
          <Path d="M4 21 C4 16 8 14 12 14 C16 14 20 16 20 21 Z" fill={theme.colors.onStage} />
        </Svg>
      )}
    </Pressable>
  );
}

export interface AccountSheetProps {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
  name?: string;
  phoneMasked?: string;
  onPrivacy?: () => void;
  loggingOut?: boolean;
  testID?: string;
}

export function AccountSheet({
  visible,
  onClose,
  onLogout,
  name,
  phoneMasked,
  onPrivacy,
  loggingOut = false,
  testID,
}: AccountSheetProps): React.JSX.Element {
  const theme = useTheme();
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!visible) setConfirming(false);
  }, [visible]);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={confirming ? uiCopy.logoutConfirmTitle : uiCopy.accountTitle}
      testID={testID}
    >
      {confirming ? (
        <View style={{ gap: theme.spacing.lg }}>
          <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>
            {uiCopy.logoutConfirmBody}
          </Text>
          <View style={{ gap: theme.spacing.sm }}>
            <Button
              label={uiCopy.logout}
              loadingLabel={uiCopy.loggingOut}
              variant="danger"
              size="lg"
              loading={loggingOut}
              onPress={onLogout}
              testID="account-logout-confirm"
            />
            <View style={{ alignItems: 'center' }}>
              <LinkButton
                label={uiCopy.cancel}
                tone="muted"
                disabled={loggingOut}
                onPress={() => setConfirming(false)}
                style={{ alignSelf: 'center' }}
              />
            </View>
          </View>
        </View>
      ) : (
        <View style={{ gap: theme.spacing.lg }}>
          {Boolean(name || phoneMasked) && (
            <View style={{ gap: theme.spacing.xxs }}>
              {name ? (
                <Text style={{ ...theme.typography.subtitle, color: theme.colors.text }}>
                  {name}
                </Text>
              ) : null}
              {phoneMasked ? (
                <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>
                  {phoneMasked}
                </Text>
              ) : null}
            </View>
          )}
          {onPrivacy && <LinkButton label={uiCopy.privacyLink} onPress={onPrivacy} />}
          <Button
            label={uiCopy.logout}
            variant="ghost"
            onPress={() => setConfirming(true)}
            testID="account-logout"
          />
        </View>
      )}
    </BottomSheet>
  );
}
