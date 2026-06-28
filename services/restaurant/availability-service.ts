import axios from 'axios';

import { requireClienteId } from '@/lib/cliente/require-session';
import { apiClient } from '../api-client';

type RestaurantAvailabilityResponse = {
    disponible: boolean;
};

export async function getRestaurantAvailability(restaurantId: string): Promise<boolean> {
    await requireClienteId();

    try {
        const response = await apiClient.get<RestaurantAvailabilityResponse>(`/api/local/${restaurantId}/disponibilidad`);
        return response.data.disponible;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const data = error.response?.data;
            const message = data?.error ?? data?.message ?? `Error al obtener disponibilidad (${error.response?.status})`;
            throw new Error(message);
        }
        throw new Error("No se pudo cargar la disponibilidad del local.");
    }
}
