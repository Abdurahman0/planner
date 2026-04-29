import React, { type ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const MAIN_TAB_BAR_HEIGHT = 64;
export const FLOATING_CTA_CLEARANCE = 64;

interface FloatingTabCtaProps {
  label: string;
  icon: ReactNode;
  onPress: () => void;
  disabled?: boolean;
}

export function FloatingTabCta({
  label,
  icon,
  onPress,
  disabled = false,
}: FloatingTabCtaProps) {
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        { bottom: Math.max(insets.bottom - 4, 2) },
        disabled && styles.buttonDisabled,
      ]}
    >
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#A855F7',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
