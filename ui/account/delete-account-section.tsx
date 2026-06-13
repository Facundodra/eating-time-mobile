import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChevronLeftIcon } from 'react-native-heroicons/outline';

import { Brand } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import {
  AccountDeletionError,
  deleteClientAccount,
} from '@/services/cliente/cliente-service';

const CONFIRMATION_TEXT = 'ELIMINAR';

export default function DeleteAccountSection() {
  const { logout } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [confirmationValue, setConfirmationValue] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasPendingOrders, setHasPendingOrders] = useState(false);

  const isConfirmationValid =
    confirmationValue.trim().toUpperCase() === CONFIRMATION_TEXT;

  function handleCancel() {
    setIsExpanded(false);
    setConfirmationValue('');
    setErrorMessage(null);
    setHasPendingOrders(false);
  }

  async function handleDeleteAccount() {
    if (!isConfirmationValid) {
      setErrorMessage(`Escribí ${CONFIRMATION_TEXT} para confirmar la baja.`);
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);
    setHasPendingOrders(false);

    try {
      await deleteClientAccount();
      try {
        await logout();
      } finally {
        router.replace('/auth/login');
      }
    } catch (error) {
      if (error instanceof AccountDeletionError) {
        setErrorMessage(error.message);
        setHasPendingOrders(error.hasPendingOrders);
      } else {
        setErrorMessage('No se pudo eliminar la cuenta. Intentalo nuevamente.');
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
        <ChevronLeftIcon size={20} color={Brand.gray600} />
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Eliminar cuenta</Text>
          <Text style={styles.cardSubtitle}>
            Esta acción es permanente y no se puede deshacer.
          </Text>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.bodyText}>
            Al eliminar tu cuenta, tus datos personales se borran para proteger tu
            privacidad. Tus calificaciones y comentarios en los locales se conservan,
            pero aparecerán como <Text style={styles.bold}>Anónimo</Text>.
          </Text>
          <Text style={styles.bodyText}>
            El correo asociado no podrá reutilizarse para crear una nueva cuenta.
          </Text>
          <Text style={styles.bodyText}>
            Solo podés dar de baja la cuenta si no tenés pedidos pendientes (carrito
            activo, pago en curso o pedidos en preparación o entrega).
          </Text>

          {!isExpanded ? (
            <TouchableOpacity
              style={styles.expandBtn}
              onPress={() => {
                setIsExpanded(true);
                setErrorMessage(null);
                setHasPendingOrders(false);
              }}
            >
              <Text style={styles.expandBtnText}>Quiero eliminar mi cuenta</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.confirmBox}>
              <Text style={styles.confirmWarning}>
                ¿Estás seguro? Perderás el acceso a tu cuenta y no podrás recuperarla.
              </Text>

              <Text style={styles.inputLabel}>
                Escribí <Text style={styles.confirmKeyword}>{CONFIRMATION_TEXT}</Text> para confirmar
              </Text>
              <TextInput
                style={styles.input}
                value={confirmationValue}
                onChangeText={setConfirmationValue}
                editable={!isDeleting}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder={CONFIRMATION_TEXT}
                placeholderTextColor={Brand.gray400}
              />

              {errorMessage ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                  {hasPendingOrders ? (
                    <Text style={styles.pendingHint}>
                      Revisá tu carrito o historial de pedidos para resolver los pedidos pendientes.
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.deleteBtn, (!isConfirmationValid || isDeleting) && styles.deleteBtnDisabled]}
                  onPress={() => void handleDeleteAccount()}
                  disabled={!isConfirmationValid || isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.deleteBtnText}>Eliminar cuenta permanentemente</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleCancel}
                  disabled={isDeleting}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.gray100 },
  content: { padding: 16, paddingBottom: 32 },
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FEE2E2',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#DC2626',
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: Brand.gray400,
  },
  cardBody: {
    padding: 16,
    gap: 12,
  },
  bodyText: {
    fontSize: 13,
    color: Brand.gray600,
    lineHeight: 19,
  },
  bold: {
    fontWeight: '800',
    color: Brand.gray800,
  },
  expandBtn: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  expandBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  confirmBox: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    padding: 14,
    gap: 10,
  },
  confirmWarning: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B91C1C',
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.gray800,
  },
  confirmKeyword: {
    color: '#DC2626',
    fontWeight: '800',
  },
  input: {
    borderWidth: 1,
    borderColor: Brand.gray200,
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Brand.gray800,
  },
  errorBox: { gap: 6 },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  pendingHint: {
    fontSize: 12,
    color: Brand.gray600,
    lineHeight: 17,
  },
  actions: { gap: 8, marginTop: 4 },
  deleteBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteBtnDisabled: { opacity: 0.5 },
  deleteBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: Brand.gray200,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.gray600,
  },
});
