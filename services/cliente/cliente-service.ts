import axios from 'axios';

import { apiClient } from '../api-client';
import type { ClienteDto, PuntoDeEntrega, PuntoEntregaCredentials, LocalList } from '@/lib/cliente/types';

async function getCliente(id: string): Promise<ClienteDto> {
  const { data } = await apiClient.get<ClienteDto>(`/clientes/${id}`);
  return data;
}

async function getPuntosEntrega(clienteId: string): Promise<PuntoDeEntrega[]> {
  const { data } = await apiClient.get<PuntoDeEntrega[]>(`/api/clientes/${clienteId}/puntos-entrega`);
  return data;
}

async function addPuntoEntrega(clienteId: string, credentials: PuntoEntregaCredentials): Promise<void> {
  try {
    await apiClient.post(`/api/clientes/${clienteId}/puntos-entrega`, credentials);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data;
      const message = data?.error ?? data?.message ?? 'Error al guardar el punto de entrega';
      throw new Error(message);
    }
    throw new Error('Error al guardar el punto de entrega');
  }
}

// Export para puntos de entrega
export const puntoEntregaService = { getCliente, getPuntosEntrega, addPuntoEntrega };




// Export lista locales (provisorio, hardcoded)
export async function getLocales(clienteId: string): Promise<LocalList[]>{
    return [
        {
            id: 1,
            nombre: "McDonald's",
            descripcion: "Hamburguesas, papas fritas y menús para toda la familia",
            direccion: "Av. 18 de Julio 1360, Centro, Montevideo",
            url_foto: require("../../assets/locales/McDonalds_Golden_Arches.svg.png"),
            califiacion: 3.8,
            estado_servicio: true,
        },
        {
            id: 2,
            nombre: "Burger King",
            descripcion: "Whopper a la parrilla y King deals exclusivos",
            direccion: "Punta Carretas Shopping, Montevideo",
            url_foto: require("../../assets/locales/Burger_King_2020.svg.png"),
            califiacion: 3.9,
            estado_servicio: true,
        },
        {
            id: 3,
            nombre: "KFC",
            descripcion: "Pollo frito crujiente con la receta original de 11 especias",
            direccion: "Av. Brasil 2776, Pocitos, Montevideo",
            url_foto: require("../../assets/locales/KFC_logo-image.svg.png"),
            califiacion: 4.0,
            estado_servicio: true,
        },
        {
            id: 4,
            nombre: "Subway",
            descripcion: "Sándwiches frescos armados a tu gusto con pan horneado al momento",
            direccion: "Av. Rivera 2100, Pocitos, Montevideo",
            url_foto: require("../../assets/locales/Subway_2016_logo.svg.png"),
            califiacion: 3.7,
            estado_servicio: true,
        },
        {
            id: 5,
            nombre: "Pizza Hut",
            descripcion: "Pizzas al horno, pastas y breadsticks para compartir",
            direccion: "World Trade Center, Av. Luis A. de Herrera 1248, Montevideo",
            url_foto: require("../../assets/locales/Pizza_Hut_2025.svg.png"),
            califiacion: 4.1,
            estado_servicio: true,
        },
        {
            id: 6,
            nombre: "Domino's",
            descripcion: "Pizzas a domicilio en 30 minutos o menos",
            direccion: "Av. Agraciada 3560, Aguada, Montevideo",
            url_foto: require("../../assets/locales/Dominos_2025.svg.png"),
            califiacion: 4.2,
            estado_servicio: false,
        },
        {
            id: 7,
            nombre: "Starbucks",
            descripcion: "Cafés de especialidad, frappuccinos y pastelería artesanal",
            direccion: "Rambla República de México 6400, Carrasco, Montevideo",
            url_foto: require("../../assets/locales/Starbucks_Corporation_Logo_2011.svg.png"),
            califiacion: 4.3,
            estado_servicio: true,
        },
        {
            id: 8,
            nombre: "Popeyes",
            descripcion: "Pollo frito cajún crujiente y biscuits al estilo Louisiana",
            direccion: "Ellauri 460, Punta Carretas, Montevideo",
            url_foto: require("../../assets/locales/Popeyes_Logo_2020.svg.png"),
            califiacion: 4.4,
            estado_servicio: true,
        },
        {
            id: 9,
            nombre: "Dunkin'",
            descripcion: "Donuts, café y snacks para llevar a toda hora",
            direccion: "Av. Gral. Flores 3264, La Blanqueada, Montevideo",
            url_foto: require("../../assets/locales/Dunkin_2022.svg.png"),
            califiacion: 4.0,
            estado_servicio: false,
        },
        {
            id: 10,
            nombre: "Dairy Queen",
            descripcion: "Blizzards, helados suaves y hamburguesas flame-grilled",
            direccion: "Br. Artigas 1340, Parque Rodó, Montevideo",
            url_foto: require("../../assets/locales/Dairy_Queen_logo.svg.png"),
            califiacion: 4.2,
            estado_servicio: true,
        },
        {
            id: 11,
            nombre: "Five Guys",
            descripcion: "Hamburguesas artesanales y papas fritas estilo cajún",
            direccion: "Av. Italia 3462, Tres Cruces, Montevideo",
            url_foto:  require("../../assets/locales/Five_Guys_logo.svg.png"),
            califiacion: 4.6,
            estado_servicio: true,
        },
        {
            id: 12,
            nombre: "Shake Shack",
            descripcion: "ShackBurgers, shake de vainilla y crinkle fries",
            direccion: "Rambla Gandhi 400, Pocitos, Montevideo",
            url_foto:  require("../../assets/locales/Shake_Shack_logo.svg.png"),
            califiacion: 4.5,
            estado_servicio: true,
        },
        {
            id: 13,
            nombre: "Baskin-Robbins",
            descripcion: "31 sabores de helado artesanal y tortas heladas",
            direccion: "Av. Sarmiento 2530, Pocitos, Montevideo",
            url_foto: require("../../assets/locales/Baskin-Robbins_logo_2022.svg.png"),
            califiacion: 4.3,
            estado_servicio: false,
        },
        {
            id: 14,
            nombre: "Papa John's",
            descripcion: "Pizzas con ingredientes frescos y salsa de ajo especial",
            direccion: "Av. Luis Batlle Berres 5270, Montevideo",
            url_foto: require("../../assets/locales/Papa_Johns_logo.svg.png"),
            califiacion: 4.0,
            estado_servicio: true,
        },
        {
            id: 15,
            nombre: "Panera Bread",
            descripcion: "Sándwiches, sopas y ensaladas con pan artesanal horneado",
            direccion: "Av. Dr. Luis Morquio 1820, Pocitos, Montevideo",
            url_foto: require("../../assets/locales/Panera_Bread_wordmark.svg.png"),
            califiacion: 4.1,
            estado_servicio: true,
        },
    ];
}



