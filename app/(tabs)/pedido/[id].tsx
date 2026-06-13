import { useLocalSearchParams } from 'expo-router';

import type { PedidoDto } from '@/lib/cliente/types';
import PedidoDetail from '@/ui/pedido-detail';

export default function PedidoDetailPage() {
  const { pedido: pedidoJson } = useLocalSearchParams<{ id: string; pedido: string }>();
  const pedido: PedidoDto = JSON.parse(pedidoJson);
  return <PedidoDetail pedido={pedido} />;
}
