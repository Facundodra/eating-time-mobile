import { useLocalSearchParams } from 'expo-router';

import StartClaimPage from '@/ui/start-claim-page';

export default function IniciarReclamoScreen() {
  const { pedidoId } = useLocalSearchParams<{ pedidoId: string }>();
  const id = Number(pedidoId);

  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }

  return <StartClaimPage key={id} pedidoId={id} />;
}
