import type { Restaurant, RestaurantList } from '@/lib/cliente/types';
import { getRestaurantAvailability } from '../restaurant/availability-service';
import { getRestaurantServiceStatus } from '../restaurant/service-status-service';

async function getEffectiveRestaurantState(restaurant: { id: number; state: boolean }): Promise<boolean> {
    const [serviceStatusResult, availabilityResult] = await Promise.allSettled([
        getRestaurantServiceStatus(String(restaurant.id)),
        getRestaurantAvailability(String(restaurant.id)),
    ]);

    if (serviceStatusResult.status === 'fulfilled' && serviceStatusResult.value === false) {
        return false;
    }

    if (availabilityResult.status === 'fulfilled') {
        return availabilityResult.value;
    }

    return restaurant.state;
}

export async function applyRestaurantAvailability(restaurants: RestaurantList[]): Promise<RestaurantList[]> {
    const results = await Promise.allSettled(
        restaurants.map(async (restaurant) => ({
            ...restaurant,
            state: await getEffectiveRestaurantState(restaurant),
        })),
    );

    return results.map((result, index) => (result.status === 'fulfilled' ? result.value : restaurants[index]));
}

export async function applyRestaurantAvailabilityToOne(restaurant: Restaurant): Promise<Restaurant> {
    return { ...restaurant, state: await getEffectiveRestaurantState(restaurant) };
}
