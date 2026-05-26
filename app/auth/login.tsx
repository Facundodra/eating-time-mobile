import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import LoginForm from '@/components/auth/login-form';
import { Brand } from '@/constants/theme';

const logo = require('@/assets/images/logo.png');

export default function LoginScreen() {
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

        <Text style={styles.title}>¡Bienvenido de vuelta!</Text>
        <Text style={styles.subtitle}>Ingresá a tu cuenta para continuar</Text>

        <LoginForm />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F7F7' },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '800',
    color: Brand.black,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Brand.black,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Brand.gray400,
    textAlign: 'center',
    marginBottom: 32,
  },
});
