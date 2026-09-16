import {
    Pressable,
    StyleSheet,
    Text,
    ViewStyle,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

type Props = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: ViewStyle;
};

export default function ActionButton({
  title,
  icon,
  onPress,
  variant = 'primary',
  style,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' &&
          styles.primary,
        variant === 'secondary' &&
          styles.secondary,
        variant === 'danger' &&
          styles.danger,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={
          variant === 'secondary'
            ? '#222'
            : 'white'
        }
      />

      <Text
        style={[
          styles.text,
          variant === 'secondary' &&
            styles.secondaryText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  primary: {
    backgroundColor: '#222',
  },

  secondary: {
    backgroundColor: '#f1f1f1',
    borderWidth: 1,
    borderColor: '#ddd',
  },

  danger: {
    backgroundColor: '#b3261e',
  },

  pressed: {
    opacity: 0.7,
  },

  text: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },

  secondaryText: {
    color: '#222',
  },
});