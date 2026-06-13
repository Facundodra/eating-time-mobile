import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { XMarkIcon } from 'react-native-heroicons/outline';
import { StarIcon } from 'react-native-heroicons/solid';

import { Brand } from '@/constants/theme';
import { formatOrderDate } from '@/lib/cliente/order-utils';
import type { Order, OrderRating, OrderRatingValue } from '@/lib/cliente/types';
import { submitOrderLocalRating } from '@/services/cliente/cliente-service';

type Props = {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
  onSaved: (rating: OrderRating) => void;
};

const ratingOptions: Array<{ label: string; level: number; value: OrderRatingValue }> = [
  { label: '1', level: 1, value: '1_ESTRELLA' },
  { label: '2', level: 2, value: '2_ESTRELLAS' },
  { label: '3', level: 3, value: '3_ESTRELLAS' },
  { label: '4', level: 4, value: '4_ESTRELLAS' },
  { label: '5', level: 5, value: '5_ESTRELLAS' },
];

function getRatingLevel(value?: string | null) {
  if (!value) return 0;
  const firstDigit = Number(value.charAt(0));
  return Number.isFinite(firstDigit) ? firstDigit : 0;
}

function getRatingValue(level: number): OrderRatingValue {
  return ratingOptions.find((option) => option.level === level)?.value ?? '5_ESTRELLAS';
}

export default function OrderRatingModal({ visible, order, onClose, onSaved }: Props) {
  const savedRating = order?.calificacionLocal;
  const isReadOnly = Boolean(order?.hasLocalRating || savedRating?.calificacion);
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !order) return;

    setSelectedLevel(getRatingLevel(order.calificacionLocal?.calificacion));
    setComment(order.calificacionLocal?.comentario ?? '');
    setSubmitError(null);
    setIsSubmitting(false);
  }, [visible, order]);

  if (!order) return null;

  const ratingDateLabel = savedRating?.creacion
    ? formatOrderDate(savedRating.creacion)
    : '--/--, --:--';

  async function handleSubmit() {
    if (!order) return;

    if (isReadOnly) {
      onClose();
      return;
    }

    if (!selectedLevel) {
      setSubmitError('Selecciona una calificación para continuar.');
      return;
    }

    const orderId = order.id;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const rating = await submitOrderLocalRating(orderId, {
        calificacion: getRatingValue(selectedLevel),
        comentario: comment,
      });
      onSaved(rating);
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'No se pudo registrar la calificación.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <View style={styles.headerMeta}>
                <Text style={styles.kicker}>
                  {isReadOnly ? 'Calificación del pedido' : 'Calificar pedido'}
                </Text>
                <Text style={styles.date}>{ratingDateLabel}</Text>
              </View>
              <Text style={styles.title}>PED-{order.id}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={isSubmitting}>
              <XMarkIcon size={22} color={Brand.gray400} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <Text style={styles.fieldLabel}>Calificación</Text>
            <View style={styles.starsRow}>
              {ratingOptions.map((option) => {
                const isActive = selectedLevel >= option.level;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => !isReadOnly && !isSubmitting && setSelectedLevel(option.level)}
                    disabled={isReadOnly || isSubmitting}
                    style={styles.starBtn}
                  >
                    <StarIcon
                      size={36}
                      color={isActive ? '#FB923C' : Brand.gray200}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Comentario</Text>
            <TextInput
              style={[styles.textarea, (isReadOnly || isSubmitting) && styles.textareaDisabled]}
              multiline
              maxLength={280}
              placeholder="Escribe un comentario sobre el pedido."
              placeholderTextColor={Brand.gray400}
              value={comment}
              onChangeText={setComment}
              editable={!isReadOnly && !isSubmitting}
              textAlignVertical="top"
            />

            {submitError ? (
              <Text style={styles.error}>{submitError}</Text>
            ) : null}

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={onClose}
                disabled={isSubmitting}
              >
                <Text style={styles.secondaryBtnText}>Cerrar</Text>
              </TouchableOpacity>

              {!isReadOnly ? (
                <TouchableOpacity
                  style={[styles.primaryBtn, (!selectedLevel || isSubmitting) && styles.primaryBtnDisabled]}
                  onPress={() => void handleSubmit()}
                  disabled={!selectedLevel || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Guardar calificación</Text>
                  )}
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.7)',
    justifyContent: 'center',
    padding: 16,
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Brand.gray200,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  headerMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    color: Brand.gray400,
    textTransform: 'uppercase',
  },
  date: {
    fontSize: 11,
    fontWeight: '600',
    color: Brand.gray400,
  },
  title: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: '800',
    color: Brand.black,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 18,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: Brand.gray800,
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 16,
  },
  starBtn: {
    padding: 2,
  },
  textarea: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: Brand.gray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Brand.gray800,
    backgroundColor: '#fff',
  },
  textareaDisabled: {
    backgroundColor: Brand.gray100,
    color: Brand.gray400,
  },
  error: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Brand.gray200,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: Brand.gray200,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: Brand.gray800,
  },
  primaryBtn: {
    backgroundColor: Brand.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 150,
    alignItems: 'center',
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
});
