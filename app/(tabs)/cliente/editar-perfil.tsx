import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Image,
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
  CameraIcon,
  ChevronLeftIcon,
  UserCircleIcon,
} from 'react-native-heroicons/outline';

import ProfileAvatar from '@/components/shared/widgets/profile-avatar';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { editUserData, getCurrentSession } from '@/services/auth-service';

type FormValues = {
  nombre: string;
  telefono: string;
};

export default function EditarPerfilScreen() {
  const { user, setSession, logout } = useAuth();

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fotoActual, setFotoActual] = useState<string | undefined>(undefined);
  const [fotoUri, setFotoUri] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    mode: 'onBlur',
    defaultValues: { nombre: '', telefono: '' },
  });

  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      setLoadingInitial(true);
      setLoadError(null);
      setFotoUri(null);
      setSubmitError(null);
      setDone(false);

      getCurrentSession()
        .then((session) => {
          reset({ nombre: session.nombre, telefono: '' });
          setFotoActual(session.urlFoto ?? undefined);
        })
        .catch((err) => setLoadError(err instanceof Error ? err.message : 'No se pudieron cargar tus datos.'))
        .finally(() => setLoadingInitial(false));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, reset])
  );

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
      setFotoUri(result.assets[0].uri);
    }
  }

  async function onSubmit(data: FormValues) {
    setSubmitError(null);
    setDone(false);
    setLoading(true);
    try {
      await editUserData(data.nombre, data.telefono, fotoUri);
      if (user) {
        await setSession({ ...user, name: data.nombre });
      }
      setDone(true);
    } catch (err) {
      if (err instanceof Error && err.message === 'Tu sesión expiró.') {
        await logout();
        router.replace('/auth/login');
        return;
      }
      setSubmitError(err instanceof Error ? err.message : 'No se pudo editar el usuario. Intentalo nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  const photoSource = fotoUri ?? fotoActual;

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
                <UserCircleIcon size={22} color={Brand.primary} />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.title}>Editar perfil</Text>
                <Text style={styles.subtitle}>Actualizá tus datos personales.</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {loadingInitial ? (
              <ActivityIndicator color={Brand.primary} />
            ) : loadError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{loadError}</Text>
              </View>
            ) : (
              <View style={styles.form}>
                <View style={styles.avatarSection}>
                  {photoSource ? (
                    <Image source={{ uri: photoSource }} style={styles.avatar} />
                  ) : (
                    <ProfileAvatar name={user?.name ?? ''} size={80} />
                  )}
                  <View style={styles.avatarActions}>
                    <TouchableOpacity style={styles.photoButton} onPress={pickImage} activeOpacity={0.8}>
                      <CameraIcon size={16} color={Brand.primary} />
                      <Text style={styles.photoButtonText}>Cambiar foto</Text>
                    </TouchableOpacity>
                    {fotoUri && (
                      <TouchableOpacity onPress={() => setFotoUri(null)}>
                        <Text style={styles.removePhoto}>Quitar foto</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Nombre</Text>
                  <Controller
                    control={control}
                    name="nombre"
                    rules={{ required: 'El nombre es obligatorio' }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[styles.input, errors.nombre && styles.inputError]}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        value={value}
                        autoComplete="name"
                      />
                    )}
                  />
                  {errors.nombre && <Text style={styles.errorMsg}>{errors.nombre.message}</Text>}
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Teléfono</Text>
                  <Controller
                    control={control}
                    name="telefono"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={styles.input}
                        keyboardType="phone-pad"
                        placeholder="Ej: 099123456"
                        placeholderTextColor={Brand.gray400}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        value={value}
                      />
                    )}
                  />
                </View>

                {submitError && (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>{submitError}</Text>
                  </View>
                )}

                {done && (
                  <View style={styles.successBanner}>
                    <Text style={styles.successBannerText}>¡Perfil actualizado correctamente!</Text>
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
                    : <Text style={styles.submitText}>Guardar cambios</Text>}
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

  avatarSection: { alignItems: 'center', gap: 10, marginBottom: 18 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Brand.gray200 },
  avatarActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Brand.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFF7F4',
  },
  photoButtonText: { fontSize: 12, color: Brand.primary, fontWeight: '600' },
  removePhoto: { fontSize: 12, color: '#EF4444', fontWeight: '500' },

  field: { marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '700', color: Brand.gray600, marginBottom: 6 },

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

  successBanner: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  successBannerText: { fontSize: 13, color: '#059669', fontWeight: '500' },
});
