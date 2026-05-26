import { IconCamera, IconEye, IconEyeOff } from '@tabler/icons-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Brand } from '@/constants/theme';
import { authService } from '@/services/auth-service';

type FormValues = {
  name: string;
  document: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterForm() {
  const router = useRouter();
  const [showPsw, setShowPsw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [profileUri, setProfileUri] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ mode: 'onBlur' });

  const passwordValue = watch('password');

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setProfileUri(result.assets[0].uri);
    }
  }

  async function onSubmit(data: FormValues) {
    setApiError(null);
    setLoading(true);
    try {
      await authService.register({
        name: data.name,
        document: data.document,
        phone: data.phone,
        email: data.email,
        password: data.password,
        profile_pic: profileUri ?? undefined,
      });
      setSuccess(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al registrar';
      const friendly =
        msg.includes('Bad Request') || msg.includes('400')
          ? 'El email o la cédula ya están registrados'
          : msg;
      setApiError(friendly);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <View style={styles.successBox}>
        <View style={styles.successIcon}>
          <Text style={styles.successCheck}>✓</Text>
        </View>
        <Text style={styles.successTitle}>¡Cuenta creada!</Text>
        <Text style={styles.successSub}>
          Te enviamos un correo de confirmación.
        </Text>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={() => router.replace('/auth/login')}
        >
          <Text style={styles.submitText}>Iniciar sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.form}>
      {/* Nombre completo */}
      <View style={styles.field}>
        <Text style={styles.label}>Nombre completo <Text style={styles.required}>*</Text></Text>
        <Controller
          control={control}
          name="name"
          rules={{ required: 'El nombre es obligatorio' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Juan García"
              placeholderTextColor={Brand.gray400}
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              autoComplete="name"
            />
          )}
        />
        {errors.name && <Text style={styles.errorMsg}>{errors.name.message}</Text>}
      </View>

      {/* Documento */}
      <View style={styles.field}>
        <Text style={styles.label}>Documento de identidad <Text style={styles.required}>*</Text></Text>
        <Controller
          control={control}
          name="document"
          rules={{ required: 'El documento es obligatorio' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.document && styles.inputError]}
              placeholder="Sin puntos ni guiones"
              placeholderTextColor={Brand.gray400}
              keyboardType="numeric"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
            />
          )}
        />
        {errors.document && <Text style={styles.errorMsg}>{errors.document.message}</Text>}
      </View>

      {/* Teléfono */}
      <View style={styles.field}>
        <Text style={styles.label}>Teléfono</Text>
        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="099 000 000"
              placeholderTextColor={Brand.gray400}
              keyboardType="phone-pad"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
            />
          )}
        />
      </View>

      {/* Email */}
      <View style={styles.field}>
        <Text style={styles.label}>Correo electrónico <Text style={styles.required}>*</Text></Text>
        <Controller
          control={control}
          name="email"
          rules={{
            required: 'El email es obligatorio',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="tu@email.com"
              placeholderTextColor={Brand.gray400}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
            />
          )}
        />
        {errors.email && <Text style={styles.errorMsg}>{errors.email.message}</Text>}
      </View>

      {/* Contraseña */}
      <View style={styles.field}>
        <Text style={styles.label}>Contraseña <Text style={styles.required}>*</Text></Text>
        <View style={styles.inputRow}>
          <Controller
            control={control}
            name="password"
            rules={{ required: 'La contraseña es obligatoria' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, styles.inputFlex, errors.password && styles.inputError]}
                placeholder="••••••••"
                placeholderTextColor={Brand.gray400}
                secureTextEntry={!showPsw}
                autoComplete="new-password"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
              />
            )}
          />
          <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPsw(v => !v)}>
            {showPsw
              ? <IconEyeOff size={20} color={Brand.gray400} />
              : <IconEye size={20} color={Brand.gray400} />}
          </TouchableOpacity>
        </View>
        {errors.password && <Text style={styles.errorMsg}>{errors.password.message}</Text>}
      </View>

      {/* Confirmar contraseña */}
      <View style={styles.field}>
        <Text style={styles.label}>Confirmar contraseña <Text style={styles.required}>*</Text></Text>
        <View style={styles.inputRow}>
          <Controller
            control={control}
            name="confirmPassword"
            rules={{
              required: 'Confirmá tu contraseña',
              validate: (v) => v === passwordValue || 'Las contraseñas no coinciden',
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, styles.inputFlex, errors.confirmPassword && styles.inputError]}
                placeholder="••••••••"
                placeholderTextColor={Brand.gray400}
                secureTextEntry={!showConfirm}
                autoComplete="new-password"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
              />
            )}
          />
          <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirm(v => !v)}>
            {showConfirm
              ? <IconEyeOff size={20} color={Brand.gray400} />
              : <IconEye size={20} color={Brand.gray400} />}
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && <Text style={styles.errorMsg}>{errors.confirmPassword.message}</Text>}
      </View>

      {/* Foto de perfil */}
      <View style={styles.field}>
        <Text style={styles.label}>Foto de perfil <Text style={styles.optional}>(opcional)</Text></Text>
        <TouchableOpacity style={styles.photoButton} onPress={pickImage} activeOpacity={0.8}>
          {profileUri ? (
            <Image source={{ uri: profileUri }} style={styles.photoPreview} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <IconCamera size={22} color={Brand.primary} />
              <Text style={styles.photoText}>Seleccionar foto</Text>
            </View>
          )}
        </TouchableOpacity>
        {profileUri && (
          <TouchableOpacity onPress={() => setProfileUri(null)}>
            <Text style={styles.removePhoto}>Quitar foto</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.hint}>Opcional · Máximo 5MB · JPG o PNG</Text>
      </View>

      {/* Error de API */}
      {apiError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{apiError}</Text>
        </View>
      )}

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitDisabled]}
        onPress={handleSubmit(onSubmit)}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={styles.submitText}>Crear cuenta</Text>}
      </TouchableOpacity>

      {/* Link a login */}
      <View style={styles.loginLink}>
        <Text style={styles.loginLinkText}>¿Ya tenés cuenta? </Text>
        <TouchableOpacity onPress={() => router.push('/auth/login')}>
          <Text style={styles.loginLinkAction}>Iniciá sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 4 },
  field: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '700', color: Brand.gray600, marginBottom: 6 },
  required: { color: Brand.primary },
  optional: { color: Brand.gray400, fontWeight: '400' },
  input: {
    borderWidth: 1,
    borderColor: Brand.gray200,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Brand.black,
    backgroundColor: '#fff',
  },
  inputError: { borderColor: '#EF4444' },
  inputFlex: { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  eyeButton: {
    borderWidth: 1,
    borderColor: Brand.gray200,
    borderLeftWidth: 0,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 13,
    backgroundColor: '#fff',
  },
  errorMsg: { fontSize: 11, color: '#EF4444', marginTop: 4 },
  photoButton: {
    borderWidth: 1.5,
    borderColor: Brand.primary,
    borderStyle: 'dashed',
    borderRadius: 10,
    overflow: 'hidden',
  },
  photoPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFF7F4',
  },
  photoText: { fontSize: 13, color: Brand.primary, fontWeight: '600' },
  photoPreview: { width: '100%', height: 120, resizeMode: 'cover' },
  removePhoto: { fontSize: 12, color: '#EF4444', marginTop: 4, textAlign: 'right' },
  hint: { fontSize: 11, color: Brand.gray400, marginTop: 4 },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 4,
  },
  errorBannerText: { fontSize: 13, color: '#DC2626', fontWeight: '500' },
  submitButton: {
    backgroundColor: Brand.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700', paddingHorizontal: 20 },
  loginLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  loginLinkText: { fontSize: 13, color: Brand.gray400 },
  loginLinkAction: { fontSize: 13, color: Brand.primary, fontWeight: '600' },
  successBox: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCheck: { fontSize: 28, color: '#059669' },
  successTitle: { fontSize: 22, fontWeight: '800', color: Brand.black },
  successSub: { fontSize: 13, color: Brand.gray400, textAlign: 'center' },
});
