import { IconMapPin } from '@tabler/icons-react-native';
import { useCallback, useEffect, useState } from 'react';
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

import { Brand } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import type { DeliveryPoint } from '@/lib/cliente/types';
import { deliveryPointService } from '@/services/cliente/cliente-service';

type FormValues = {
  loc: string;
  street: string;
  number: string;
  apto: string;
  indications: string;
};

export default function DeliveryPointsScreen() {
  const { user } = useAuth();

  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({ mode: 'onBlur' });

  const loadDeliveryPoints = useCallback(async () => {
    if (!user) return;
    setListLoading(true);
    setListError(null);
    try {
      const data = await deliveryPointService.getDeliveryPoints(user.roleId);
      setDeliveryPoints(data);
    } catch (e) {
      setListError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setListLoading(false);
    }
  }, [user]);

  useEffect(() => { loadDeliveryPoints(); }, [loadDeliveryPoints]);

  async function onSubmit(data: FormValues) {
    if (!user) return;
    setFormError(null);
    setFormLoading(true);
    try {
      await deliveryPointService.addDeliveryPoint(user.roleId, {
        loc: data.loc,
        street: data.street,
        number: data.number,
        apto: data.apto || undefined,
        indications: data.indications || undefined,
      });
      setFormSuccess(true);
      reset();
      await loadDeliveryPoints();
      setTimeout(() => setFormSuccess(false), 3000);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setFormLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Puntos de entrega</Text>
        <Text style={styles.subtitle}>Gestioná tus direcciones para recibir pedidos.</Text>

        {/* Lista */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Mis puntos de entrega</Text>
          <Text style={styles.sectionSub}>Direcciones guardadas para realizar pedidos</Text>
          <View style={styles.divider} />

          {listLoading ? (
            <ActivityIndicator color={Brand.primary} />
          ) : listError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{listError}</Text>
            </View>
          ) : deliveryPoints.length === 0 ? (
            <Text style={styles.emptyText}>No tenés puntos de entrega guardados todavía.</Text>
          ) : (
            <View style={styles.list}>
              {deliveryPoints.map((deliveryPoint) => (
                <View key={deliveryPoint.id} style={styles.deliveryPointItem}>
                  <View style={styles.pinWrapper}>
                    <IconMapPin size={18} color={Brand.primary} strokeWidth={1.5} />
                  </View>
                  <View style={styles.deliveryPointInfo}>
                    <Text style={styles.deliveryPointAddress}>
                      {deliveryPoint.calle} {deliveryPoint.numero}
                      {deliveryPoint.nroApto ? `, Apto ${deliveryPoint.nroApto}` : ''}
                    </Text>
                    <Text style={styles.deliveryPointCity}>{deliveryPoint.localidad}</Text>
                    {deliveryPoint.indicaciones ? (
                      <Text style={styles.deliveryPointIndications}>{deliveryPoint.indicaciones}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Formulario */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Nuevo punto</Text>
          <Text style={styles.sectionSub}>Ingresá los datos de una dirección de entrega.</Text>
          <View style={styles.divider} />

          {formSuccess ? (
            <View style={styles.successBox}>
              <View style={styles.successIcon}>
                <Text style={styles.successCheck}>✓</Text>
              </View>
              <Text style={styles.successTitle}>¡Punto guardado!</Text>
              <Text style={styles.successSub}>El punto fue agregado a tu cuenta.</Text>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Localidad <Text style={styles.required}>*</Text></Text>
                <Controller
                  control={control}
                  name="loc"
                  rules={{ required: 'La localidad es obligatoria' }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, errors.loc && styles.inputError]}
                      placeholder="Ej: Montevideo, Pando"
                      placeholderTextColor={Brand.gray400}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                    />
                  )}
                />
                {errors.loc && <Text style={styles.errorMsg}>{errors.loc.message}</Text>}
              </View>

              <View style={styles.row}>
                <View style={[styles.field, styles.fieldFlex]}>
                  <Text style={styles.label}>Calle <Text style={styles.required}>*</Text></Text>
                  <Controller
                    control={control}
                    name="street"
                    rules={{ required: 'La calle es obligatoria' }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[styles.input, errors.street && styles.inputError]}
                        placeholder="18 de Julio"
                        placeholderTextColor={Brand.gray400}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        value={value}
                      />
                    )}
                  />
                  {errors.street && <Text style={styles.errorMsg}>{errors.street.message}</Text>}
                </View>
                <View style={[styles.field, styles.fieldNumero]}>
                  <Text style={styles.label}>Número <Text style={styles.required}>*</Text></Text>
                  <Controller
                    control={control}
                    name="number"
                    rules={{ required: 'Requerido' }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[styles.input, errors.number && styles.inputError]}
                        placeholder="2718"
                        placeholderTextColor={Brand.gray400}
                        keyboardType="numeric"
                        onChangeText={onChange}
                        onBlur={onBlur}
                        value={value}
                      />
                    )}
                  />
                  {errors.number && <Text style={styles.errorMsg}>{errors.number.message}</Text>}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Nro. de apartamento <Text style={styles.optional}>(opcional)</Text></Text>
                <Controller
                  control={control}
                  name="apto"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={styles.input}
                      placeholder="901"
                      placeholderTextColor={Brand.gray400}
                      keyboardType="numeric"
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                    />
                  )}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Indicaciones <Text style={styles.optional}>(opcional)</Text></Text>
                <Controller
                  control={control}
                  name="indications"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, styles.textarea]}
                      placeholder="Ej: portón azul, timbre 301, edificio en esquina"
                      placeholderTextColor={Brand.gray400}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                    />
                  )}
                />
              </View>

              {formError && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>
                    {formError === 'Conflict'
                      ? 'Ya existe un punto de entrega con ese número de puerta registrado para este cliente'
                      : formError}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.submitButton, formLoading && styles.submitDisabled]}
                onPress={handleSubmit(onSubmit)}
                disabled={formLoading}
                activeOpacity={0.85}
              >
                {formLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.submitText}>Guardar punto</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.gray100 },
  content: { padding: 20, paddingBottom: 40, gap: 16 },
  title: { fontSize: 22, fontWeight: '800', color: Brand.black },
  subtitle: { fontSize: 13, color: Brand.gray400, marginTop: 4 },

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
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Brand.black },
  sectionSub: { fontSize: 12, color: Brand.gray400, marginTop: 2 },
  divider: { height: 1, backgroundColor: Brand.gray200, marginVertical: 14 },

  emptyText: { fontSize: 13, color: Brand.gray400 },

  list: { gap: 10 },
  deliveryPointItem: { flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderColor: Brand.gray200, borderRadius: 12, padding: 12 },
  pinWrapper: { marginRight: 10, marginTop: 1 },
  deliveryPointInfo: { flex: 1 },
  deliveryPointAddress: { fontSize: 13, fontWeight: '700', color: Brand.black },
  deliveryPointCity: { fontSize: 12, color: Brand.gray400, marginTop: 2 },
  deliveryPointIndications: { fontSize: 12, color: Brand.gray600, marginTop: 4 },

  form: { gap: 4 },
  field: { marginBottom: 12 },
  fieldFlex: { flex: 1, marginRight: 10 },
  fieldNumero: { width: 90 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
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
  textarea: { height: 80, paddingTop: 12 },
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
