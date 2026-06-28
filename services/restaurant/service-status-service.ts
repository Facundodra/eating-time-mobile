import axios from 'axios';

import { requireClienteId } from '@/lib/cliente/require-session';
import { apiClient } from '../api-client';

type RestaurantServiceStatusResponse = {
    estadoServicio: boolean;
};

export async function getRestaurantServiceStatus(restaurantId: string): Promise<boolean> {
    await requireClienteId();

    try {
        const response = await apiClient.get<RestaurantServiceStatusResponse>(`/api/local/${restaurantId}/estado`);
        return response.data.estadoServicio;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const data = error.response?.data;
            const message = data?.error ?? data?.message ?? `Error al obtener estado del local (${error.response?.status})`;
            throw new Error(message);
        }
        throw new Error("No se pudo cargar el estado del local.");
    }
}
