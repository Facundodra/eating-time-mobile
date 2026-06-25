import { Image, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';

type Props = {
  name: string;
  size?: number;
  photoUrl?: string | null;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ProfileAvatar({ name, size = 36, photoUrl }: Props) {
  const sizeStyle = { width: size, height: size, borderRadius: size / 2 };

  if (photoUrl) {
    return <Image source={{ uri: photoUrl }} style={[styles.circle, sizeStyle]} />;
  }

  const initials = getInitials(name);
  const fontSize = size * 0.38;

  return (
    <View style={[styles.circle, sizeStyle]}>
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
