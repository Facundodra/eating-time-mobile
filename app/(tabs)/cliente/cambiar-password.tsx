import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ChevronLeftIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
} from 'react-native-heroicons/outline';

import { Brand } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { changePassword, ChangePasswordError } from '@/services/auth-service';

type FormValues = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

export default function CambiarPasswordScreen() {
  const { logout } = useAuth();

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { control, handleSubmit, getValues, formState: { errors } } = useForm<FormValues>({ mode: 'onBlur' });

  async function onSubmit(data: FormValues) {
    setSubmitError(null);
    setLoading(true);
    try {
      await changePassword(data.current_password, data.new_password);
      setDone(true);
    } catch (err) {
      if (err instanceof ChangePasswordError && err.code === 'unauthorized') {
        await logout();
        router.replace('/auth/login');
        return;
      }
      setSubmitError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña. Intentalo nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeftIcon size={20} color={Brand.gray600} />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBadge}>
                <LockClosedIcon size={22} color={Brand.primary} />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.title}>Nueva contraseña</Text>
                <Text style={styles.subtitle}>Ingresá tu contraseña actual y elegí una nueva.</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {done ? (
              <View style={styles.successBox}>
                <View style={styles.successIcon}>
                  <Text style={styles.successCheck}>✓</Text>
                </View>
                <Text style={styles.successTitle}>¡Contraseña actualizada!</Text>
                <Text style={styles.successSub}>Tu contraseña fue cambiada correctamente.</Text>
                <TouchableOpacity style={styles.submitButton} onPress={() => router.back()} activeOpacity={0.85}>
                  <Text style={styles.submitText}>Volver a mi cuenta</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.form}>
                <View style={styles.field}>
                  <Text style={styles.label}>Contraseña actual</Text>
                  <View style={[styles.inputWrap, errors.current_password && styles.inputError]}>
                    <Controller
                      control={control}
                      name="current_password"
                      rules={{ required: 'La contraseña actual es obligatoria' }}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          style={styles.inputInner}
                          secureTextEntry={!showCurrent}
                          autoComplete="current-password"
                          textContentType="password"
                          onChangeText={onChange}
                          onBlur={onBlur}
                          value={value}
                        />
                      )}
                    />
                    <TouchableOpacity onPress={() => setShowCurrent((v) => !v)} style={styles.eyeBtn}>
                      {showCurrent ? <EyeSlashIcon size={20} color={Brand.gray400} /> : <EyeIcon size={20} color={Brand.gray400} />}
                    </TouchableOpacity>
                  </View>
                  {errors.current_password && <Text style={styles.errorMsg}>{errors.current_password.message}</Text>}
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Nueva contraseña</Text>
                  <View style={[styles.inputWrap, errors.new_password && styles.inputError]}>
                    <Controller
                      control={control}
                      name="new_password"
                      rules={{
                        required: 'La nueva contraseña es obligatoria',
                        minLength: { value: 8, message: 'Debe tener al menos 8 caracteres' },
                      }}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          style={styles.inputInner}
                          secureTextEntry={!showNew}
                          autoComplete="new-password"
                          textContentType="newPassword"
                          onChangeText={onChange}
                          onBlur={onBlur}
                          value={value}
                        />
                      )}
                    />
                    <TouchableOpacity onPress={() => setShowNew((v) => !v)} style={styles.eyeBtn}>
                      {showNew ? <EyeSlashIcon size={20} color={Brand.gray400} /> : <EyeIcon size={20} color={Brand.gray400} />}
                    </TouchableOpacity>
                  </View>
                  {errors.new_password && <Text style={styles.errorMsg}>{errors.new_password.message}</Text>}
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Confirmar nueva contraseña</Text>
                  <View style={[styles.inputWrap, errors.confirm_password && styles.inputError]}>
                    <Controller
                      control={control}
                      name="confirm_password"
                      rules={{
                        required: 'Repetí la nueva contraseña',
                        validate: (value) => value === getValues('new_password') || 'Las contraseñas no coinciden',
                      }}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          style={styles.inputInner}
                          secureTextEntry={!showConfirm}
                          autoComplete="new-password"
                          textContentType="newPassword"
                          onChangeText={onChange}
                          onBlur={onBlur}
                          value={value}
                        />
                      )}
                    />
                    <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} style={styles.eyeBtn}>
                      {showConfirm ? <EyeSlashIcon size={20} color={Brand.gray400} /> : <EyeIcon size={20} color={Brand.gray400} />}
                    </TouchableOpacity>
                  </View>
                  {errors.confirm_password && <Text style={styles.errorMsg}>{errors.confirm_password.message}</Text>}
                </View>

                {submitError && (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>{submitError}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.submitDisabled]}
                  onPress={handleSubmit(onSubmit)}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.submitText}>Guardar contraseña</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.gray100 },

  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Brand.gray200 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 14, color: Brand.gray600 },

  content: { padding: 20, paddingBottom: 40 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },

  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBadge: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' },
  cardHeaderText: { flex: 1 },
  title: { fontSize: 18, fontWeight: '800', color: Brand.black },
  subtitle: { fontSize: 12, color: Brand.gray400, marginTop: 2 },
  divider: { height: 1, backgroundColor: Brand.gray200, marginVertical: 14 },

  form: { gap: 4 },
  field: { marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '700', color: Brand.gray600, marginBottom: 6 },

  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Brand.gray200, borderRadius: 10, backgroundColor: '#fff', paddingRight: 6 },
  inputInner: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Brand.black },
  inputError: { borderColor: '#EF4444' },
  eyeBtn: { padding: 8 },
  errorMsg: { fontSize: 11, color: '#EF4444', marginTop: 4 },

  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  errorBannerText: { fontSize: 13, color: '#DC2626', fontWeight: '500' },

  submitButton: {
    backgroundColor: Brand.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  successBox: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCheck: { fontSize: 24, color: '#059669' },
  successTitle: { fontSize: 18, fontWeight: '800', color: Brand.black },
  successSub: { fontSize: 13, color: Brand.gray400, textAlign: 'center' },
});
