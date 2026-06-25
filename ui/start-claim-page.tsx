import { router } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { ChevronLeftIcon } from 'react-native-heroicons/outline';

import { Brand } from '@/constants/theme';
import { notifyClaimRefresh } from '@/lib/cliente/claim-refresh';
import { CLAIM_ELIGIBLE_STATUSES } from '@/lib/cliente/claim-utils';
import { formatOrderPrice } from '@/lib/cliente/order-utils';
import type { Order } from '@/lib/cliente/types';
import {
  MAX_COMPLAINT_NOTE_LENGTH,
  getOrderClaim,
  submitOrderClaim,
} from '@/services/cliente/claim-service';
import { getOrderHistory, getRestaurantName } from '@/services/cliente/cliente-service';

type Props = {
  pedidoId: number;
};

function activeItems(order: Order) {
  return order.items.filter((item) => item.eliminacion == null);
}

export default function StartClaimPage({ pedidoId }: Props) {
  const [order, setOrder] = useState<Order | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadOrder() {
      setLoading(true);
      setLoadError(null);
      setDescription('');
      setSubmitError(null);
      setIsSubmitting(false);
      setOrder(null);
      setRestaurantName(null);

      try {
        const { orders } = await getOrderHistory({
          orderId: pedidoId,
          size: 1,
          includeRatings: false,
        });

        if (ignore) return;

        const matchedOrder = orders[0] ?? null;

        if (!matchedOrder) {
          setLoadError('No encontramos ese pedido en tu historial.');
          setOrder(null);
          return;
        }

        if (!CLAIM_ELIGIBLE_STATUSES.includes(matchedOrder.estado)) {
          setLoadError('Este pedido no admite reclamos.');
          setOrder(null);
          return;
        }

        const existingClaim = await getOrderClaim(pedidoId).catch(() => null);

        if (ignore) return;

        if (existingClaim) {
          setLoadError(
            'Ya existe un reclamo para este pedido. Volvé al historial para verlo.',
          );
          setOrder(null);
          return;
        }

        setOrder(matchedOrder);

        const name = await getRestaurantName(matchedOrder.restaurantId).catch(
          () => `Local #${matchedOrder.restaurantId}`,
        );

        if (!ignore) setRestaurantName(name);
      } catch (error) {
        if (!ignore) {
          setLoadError(
            error instanceof Error
              ? error.message
              : 'No se pudo cargar la información del pedido.',
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void loadOrder();

    return () => {
      ignore = true;
    };
  }, [pedidoId]);

  async function handleSubmit() {
    const trimmed = description.trim();

    if (!trimmed) {
      setSubmitError('Contanos qué anduvo mal para continuar.');
      return;
    }

    if (trimmed.length > MAX_COMPLAINT_NOTE_LENGTH) {
      setSubmitError(
        `El texto no puede superar los ${MAX_COMPLAINT_NOTE_LENGTH} caracteres.`,
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await submitOrderClaim(pedidoId, trimmed);
      notifyClaimRefresh();
      router.replace({
        pathname: '/cliente/historial-pedidos',
        params: { reclamoEnviado: '1' },
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'No se pudo enviar el reclamo. Intentalo nuevamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Brand.primary} />
      </View>
    );
  }

  if (loadError || !order) {
    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
          <ChevronLeftIcon size={20} color={Brand.gray600} />
          <Text style={styles.backText}>Volver al historial</Text>
        </TouchableOpacity>
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{loadError ?? 'No se pudo cargar el pedido.'}</Text>
        </View>
      </ScrollView>
    );
  }

  const items = activeItems(order);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
          <ChevronLeftIcon size={20} color={Brand.gray600} />
          <Text style={styles.backText}>Volver al historial</Text>
        </TouchableOpacity>

        <Text style={styles.title}>¿Algo anduvo mal con tu pedido?</Text>
        <Text style={styles.subtitle}>Revisá los datos del pedido y contanos qué pasó.</Text>

        <View style={styles.orderCard}>
          <View style={styles.infoGrid}>
            <InfoField label="Pedido" value={`#${order.id}`} />
            <InfoField label="Local" value={restaurantName ?? '—'} />
            <InfoField label="Total" value={formatOrderPrice(order.total)} highlight />
            <InfoField
              label="Dirección"
              value={order.direccion?.trim() || 'Sin dirección registrada'}
            />
          </View>

          <Text style={styles.sectionLabel}>Platos</Text>
          {items.length === 0 ? (
            <Text style={styles.emptyItems}>No hay platos para mostrar.</Text>
          ) : (
            items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.nombre ?? `Plato #${item.platoId}`}</Text>
                <Text style={styles.itemMeta}>
                  x{item.cantidad} · {formatOrderPrice(item.total)}
                </Text>
              </View>
            ))
          )}

          {order.indicaciones?.trim() ? (
            <InfoField label="Notas para el local" value={order.indicaciones.trim()} />
          ) : null}
        </View>

        <Text style={styles.inputLabel}>
          Contanos tu experiencia y si entendés que el restaurante te debe una compensación por el
          problema (reembolso o voucher):
        </Text>
        <TextInput
          key={`claim-description-${pedidoId}`}
          style={styles.textarea}
          value={description}
          onChangeText={setDescription}
          placeholder="Ej: El pedido llegó frío y faltaba un plato..."
          placeholderTextColor={Brand.gray400}
          multiline
          numberOfLines={6}
          maxLength={MAX_COMPLAINT_NOTE_LENGTH}
          editable={!isSubmitting}
          autoComplete="off"
          textContentType="none"
          importantForAutofill="no"
        />
        <Text style={styles.charCount}>
          {description.length}/{MAX_COMPLAINT_NOTE_LENGTH}
        </Text>

        {submitError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{submitError}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
          onPress={() => void handleSubmit()}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitBtnText}>Enviar reclamo</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InfoField({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.infoField}>
      <Text style={styles.infoFieldLabel}>{label}</Text>
      <Text style={[styles.infoFieldValue, highlight && styles.infoFieldHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.gray100 },
  content: { padding: 16, paddingBottom: 32 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.gray100,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.gray600,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Brand.black,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: Brand.gray400,
    lineHeight: 18,
    marginBottom: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Brand.gray200,
    padding: 16,
    marginBottom: 16,
    gap: 10,
  },
  infoGrid: { gap: 8 },
  infoField: {
    backgroundColor: Brand.gray100,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Brand.gray200,
  },
  infoFieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Brand.gray400,
    textTransform: 'uppercase',
  },
  infoFieldValue: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
    color: Brand.gray800,
  },
  infoFieldHighlight: {
    color: Brand.primary,
    fontWeight: '800',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Brand.gray400,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  emptyItems: {
    fontSize: 13,
    color: Brand.gray400,
  },
  itemRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Brand.gray100,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.black,
  },
  itemMeta: {
    marginTop: 2,
    fontSize: 12,
    color: Brand.gray400,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.gray800,
    lineHeight: 18,
    marginBottom: 8,
  },
  textarea: {
    borderWidth: 1,
    borderColor: Brand.gray200,
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Brand.gray800,
    minHeight: 140,
    textAlignVertical: 'top',
  },
  charCount: {
    marginTop: 4,
    fontSize: 11,
    color: Brand.gray400,
    textAlign: 'right',
    marginBottom: 12,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  submitBtn: {
    backgroundColor: Brand.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
