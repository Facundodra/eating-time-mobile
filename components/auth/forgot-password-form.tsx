import { IconCheck, IconMail } from '@tabler/icons-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Brand } from '@/constants/theme';
import { resetPassword } from '@/services/auth-service';

type FormValues = {
  email: string;
};

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    mode: 'onBlur',
    defaultValues: { email: '' },
  });

  async function onSubmit(data: FormValues) {
    setLoading(true);
    try {
      await resetPassword(data.email.trim());
    } catch {
      // always show success for security
    } finally {
      setLoading(false);
      setSent(true);
    }
  }

  if (sent) {
    return (
      <View style={styles.successBox}>
        <View style={styles.successIcon}>
          <IconCheck size={28} color="#16a34a" strokeWidth={2.2} />
        </View>
        <Text style={styles.successTitle}>Revisá tu correo</Text>
        <Text style={styles.successSub}>
          Si tu email está registrado, recibirás un correo con instrucciones para restablecer tu contraseña.
        </Text>
        <TouchableOpacity onPress={() => router.replace('/auth/login')}>
          <Text style={styles.backToLogin}>Volver al inicio de sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.form}>
      <Text style={styles.title}>Recuperar contraseña</Text>
      <Text style={styles.subtitle}>
        Ingresá tu email y te enviaremos un link para que puedas crear una nueva contraseña.
      </Text>

      <View style={styles.field}>
        <Text style={styles.label}>Correo electrónico</Text>
        <View style={[styles.inputWrap, errors.email && styles.inputWrapError]}>
          <IconMail size={20} color={Brand.gray400} strokeWidth={1.8} />
          <Controller
            control={control}
            name="email"
            rules={{
              required: 'El email es obligatorio',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' },
            }}
            render={({ field: { onBlur, onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="nombre@email.com"
                placeholderTextColor={Brand.gray400}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
        </View>
        {errors.email && <Text style={styles.errorMsg}>{errors.email.message}</Text>}
      </View>

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitDisabled]}
        onPress={handleSubmit(onSubmit)}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.submitText}>Enviar instrucciones</Text>
        )}
      </TouchableOpacity>

      <View style={styles.divider} />

      <View style={styles.loginLink}>
        <Text style={styles.loginText}>¿Recordaste tu contraseña? </Text>
        <TouchableOpacity onPress={() => router.push('/auth/login')}>
          <Text style={styles.loginAction}>Iniciá sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Brand.black,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Brand.gray400,
    lineHeight: 22,
    marginBottom: 28,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.gray600,
    marginBottom: 7,
  },
  inputWrap: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: Brand.gray200,
    borderRadius: 14,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  inputWrapError: {
    borderColor: '#EF4444',
  },
  input: {
    flex: 1,
    color: Brand.black,
    fontSize: 15,
    paddingVertical: 12,
  },
  errorMsg: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 5,
  },
  submitButton: {
    height: 52,
    borderRadius: 28,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  submitDisabled: {
    opacity: 0.65,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: Brand.gray200,
    marginBottom: 24,
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 14,
    color: Brand.gray400,
  },
  loginAction: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.primary,
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: Brand.black,
  },
  successSub: {
    fontSize: 14,
    fontWeight: '500',
    color: Brand.gray400,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  backToLogin: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '700',
    color: Brand.primary,
  },
});
