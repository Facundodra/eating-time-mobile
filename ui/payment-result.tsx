import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from 'react-native-heroicons/outline';

import { Brand } from '@/constants/theme';
import { notifyCartRefresh } from '@/lib/cliente/cart-refresh';
import type { PaymentStatus } from '@/lib/cliente/types';
import { resolvePaymentStatus } from '@/services/cliente/cliente-service';

const STATUS_CONFIG: Record<
  PaymentStatus,
  { title: string; description: string; bg: string; border: string }
> = {
  approved: {
    title: '¡Pago aprobado!',
    description:
      'Tu pedido fue recibido y está esperando confirmación del local. Te avisaremos cuando sea aceptado.',
    bg: '#F0FDF4',
    border: '#BBF7D0',
  },
  pending: {
    title: 'Pago pendiente',
    description:
      'El pago está siendo procesado. Cuando se confirme, el local recibirá tu pedido.',
    bg: '#FEFCE8',
    border: '#FEF08A',
  },
  failure: {
    title: 'Pago rechazado',
    description: 'Hubo un problema con el pago. Podés reintentar desde tu carrito.',
    bg: '#FEF2F2',
    border: '#FECACA',
  },
};

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 30;

function StatusIcon({ status }: { status: PaymentStatus }) {
  if (status === 'approved') return <CheckCircleIcon size={64} color="#22C55E" />;
  if (status === 'pending') return <ClockIcon size={64} color="#EAB308" />;
  return <XCircleIcon size={64} color="#EF4444" />;
}

function parseUrlStatus(raw?: string): PaymentStatus | null {
  const normalized = raw?.split(',')[0] ?? '';
  const status = (normalized === 'rejected' ? 'failure' : normalized) as PaymentStatus;
  return status in STATUS_CONFIG ? status : null;
}

export default function PaymentResultScreen() {
  const params = useLocalSearchParams<{
    pedidoId?: string;
    localId?: string;
    paymentStatus?: string;
  }>();

  const pedidoId = params.pedidoId ? Number(params.pedidoId) : null;
  const localId = params.localId ? Number(params.localId) : null;
  const urlStatus = parseUrlStatus(params.paymentStatus);

  const [status, setStatus] = useState<PaymentStatus | null>(urlStatus);
  const [loading, setLoading] = useState(
    urlStatus !== 'approved' && urlStatus !== 'failure' && pedidoId != null && localId != null,
  );

  const pollOnce = useCallback(async (): Promise<PaymentStatus | null> => {
    if (pedidoId == null || localId == null) return null;

    const resolved = await resolvePaymentStatus(pedidoId, localId);
    if (resolved === 'approved') return 'approved';
    return null;
  }, [pedidoId, localId]);

  useEffect(() => {
    if (urlStatus === 'approved' || urlStatus === 'failure') return;
    if (pedidoId == null || localId == null) return;

    let cancelled = false;
    let attempts = 0;

    async function poll() {
      while (!cancelled && attempts < MAX_POLL_ATTEMPTS) {
        try {
          const resolved = await pollOnce();
          if (resolved === 'approved') {
            if (!cancelled) {
              setStatus('approved');
              setLoading(false);
              notifyCartRefresh();
            }
            return;
          }
        } catch {
          // retry
        }

        attempts += 1;
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      }

      if (!cancelled) {
        setStatus('pending');
        setLoading(false);
      }
    }

    poll();

    return () => {
      cancelled = true;
    };
  }, [urlStatus, pedidoId, localId, pollOnce]);

  useEffect(() => {
    if (status === 'approved' || status === 'failure') return;
    if (pedidoId == null || localId == null) return;

    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') return;

      pollOnce()
        .then((resolved) => {
          if (resolved === 'approved') {
            setStatus('approved');
            setLoading(false);
            notifyCartRefresh();
          }
        })
        .catch(() => {});
    });

    return () => sub.remove();
  }, [status, pedidoId, localId, pollOnce]);

  async function handleRetryCheck() {
    if (pedidoId == null || localId == null) return;
    setLoading(true);
    try {
      const resolved = await pollOnce();
      setStatus(resolved ?? 'pending');
    } catch {
      setStatus('pending');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Brand.primary} />
        <Text style={styles.loadingText}>Verificando pago...</Text>
        {pedidoId ? <Text style={styles.pedidoHint}>Pedido #{pedidoId}</Text> : null}
      </View>
    );
  }

  if (!status) {
    return (
      <View style={styles.center}>
        <Text style={styles.unknownText}>Estado de pago no reconocido.</Text>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.link}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const config = STATUS_CONFIG[status];

  return (
    <View style={styles.root}>
      <View style={[styles.card, { backgroundColor: config.bg, borderColor: config.border }]}>
        <StatusIcon status={status} />
        <Text style={styles.title}>{config.title}</Text>
        <Text style={styles.description}>{config.description}</Text>
        {pedidoId ? <Text style={styles.pedidoId}>Pedido #{pedidoId}</Text> : null}
      </View>

      <View style={styles.actions}>
        {status === 'failure' && localId != null && (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() =>
              router.replace({
                pathname: '/(tabs)/local/[id]/cart',
                params: { id: String(localId) },
              })
            }
          >
            <Text style={styles.primaryBtnText}>Reintentar pago</Text>
          </TouchableOpacity>
        )}

        {status === 'pending' && (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleRetryCheck}>
            <Text style={styles.primaryBtnText}>Verificar de nuevo</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.secondaryBtnText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.gray100, padding: 20, justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  loadingText: { fontSize: 14, color: Brand.gray400, marginTop: 8 },
  pedidoHint: { fontSize: 12, color: Brand.gray400 },
  unknownText: { fontSize: 14, color: Brand.gray400, textAlign: 'center' },
  link: { fontSize: 14, fontWeight: '600', color: Brand.primary, marginTop: 12 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },
  title: { fontSize: 20, fontWeight: '800', color: Brand.black, textAlign: 'center' },
  description: { fontSize: 14, color: Brand.gray600, textAlign: 'center', lineHeight: 20 },
  pedidoId: { fontSize: 11, color: Brand.gray400, marginTop: 4 },
  actions: { marginTop: 24, gap: 10 },
  primaryBtn: {
    backgroundColor: Brand.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: Brand.gray200,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  secondaryBtnText: { color: Brand.gray600, fontSize: 14, fontWeight: '600' },
});
