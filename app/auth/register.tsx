import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import RegisterForm from '@/components/auth/register-form';
import { Brand } from '@/constants/theme';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const logo = require('@/assets/images/logo.png');

export default function RegisterScreen() {
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brandName}>EatingTime</Text>
        </View>

        <Text style={styles.title}>Creá tu cuenta</Text>
        <Text style={styles.subtitle}>Ingresá tus datos para empezar a pedir.</Text>

        <RegisterForm />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  logo: { width: 64, height: 64 },
  brandName: { fontSize: 20, fontWeight: '800', color: Brand.black },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Brand.black,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: Brand.gray400,
    textAlign: 'center',
    marginBottom: 28,
  },
});
