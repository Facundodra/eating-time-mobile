import { IconEye, IconEyeOff, IconLock, IconMail } from '@tabler/icons-react-native';
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
import { useAuth } from '@/hooks/use-auth';

type FormValues = {
  email: string;
  password: string;
};

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    mode: 'onBlur',
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(data: FormValues) {
    setApiError(null);
    setLoading(true);

    try {
      await login({
        email: data.email.trim(),
        password: data.password,
      });
      router.replace('/(tabs)');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo iniciar sesión. Intentalo nuevamente.';
      setApiError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.form}>
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
                placeholder="tu@email.com"
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

      <View style={styles.field}>
        <Text style={styles.label}>Contraseña</Text>
        <View style={[styles.inputWrap, errors.password && styles.inputWrapError]}>
          <IconLock size={20} color={Brand.gray400} strokeWidth={1.8} />
          <Controller
            control={control}
            name="password"
            rules={{ required: 'La contraseña es obligatoria' }}
            render={({ field: { onBlur, onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Brand.gray400}
                secureTextEntry={!showPassword}
                autoComplete="current-password"
                textContentType="password"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          <TouchableOpacity
            onPress={() => setShowPassword((value) => !value)}
            hitSlop={8}
            accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? (
              <IconEyeOff size={20} color={Brand.gray400} />
            ) : (
              <IconEye size={20} color={Brand.gray400} />
            )}
          </TouchableOpacity>
        </View>
        {errors.password && <Text style={styles.errorMsg}>{errors.password.message}</Text>}
      </View>

      <TouchableOpacity onPress={() => router.push('/auth/forgot-password')}>
          <Text style={styles.forgotText}>¿Olvidaste tu contraseña? </Text>
      </TouchableOpacity>

      {apiError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{apiError}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitDisabled]}
        onPress={handleSubmit(onSubmit)}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.submitText}>Iniciar sesión</Text>
        )}
      </TouchableOpacity>

      <View style={styles.registerLink}>
        <Text style={styles.registerText}>¿No tenés cuenta? </Text>
        <TouchableOpacity onPress={() => router.push('/auth/register')}>
          <Text style={styles.registerAction}>Registrate gratis</Text>
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
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 28,
  },
  forgotText: {
    color: Brand.primary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 30,
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
  },
  submitButton: {
    height: 52,
    borderRadius: 28,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
  registerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerText: {
    color: Brand.gray400,
    fontSize: 14,
  },
  registerAction: {
    color: Brand.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
