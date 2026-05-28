import axios from 'axios';

import type { ClienteDto, LocalDto, LocalesParams, Page, PuntoDeEntrega, PuntoEntregaCredentials } from '@/lib/cliente/types';
import { apiClient } from '../api-client';

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

export const puntoEntregaService = { getCliente, getPuntosEntrega, addPuntoEntrega };

export async function getLocales(params?: LocalesParams): Promise<Page<LocalDto>> {
  const { data } = await apiClient.get<Page<LocalDto>>('/api/locales', { params });
  return data;
/*
  const mock: LocalDto[] = [
    { id: 1, usuarioId: 1, nombre: "McDonald's", descripcion: "Hamburguesas, papas fritas y menús para toda la familia", direccion: "Av. 18 de Julio 1360, Centro, Montevideo", urlFoto: null, calificacion: 3.8, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 2, usuarioId: 2, nombre: "Burger King", descripcion: "Whopper a la parrilla y King deals exclusivos", direccion: "Punta Carretas Shopping, Montevideo", urlFoto: null, calificacion: 3.9, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 3, usuarioId: 3, nombre: "KFC", descripcion: "Pollo frito crujiente con la receta original de 11 especias", direccion: "Av. Brasil 2776, Pocitos, Montevideo", urlFoto: null, calificacion: 4.0, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 4, usuarioId: 4, nombre: "Subway", descripcion: "Sándwiches frescos armados a tu gusto", direccion: "Av. Rivera 2100, Pocitos, Montevideo", urlFoto: null, calificacion: 3.7, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 5, usuarioId: 5, nombre: "Pizza Hut", descripcion: "Pizzas al horno, pastas y breadsticks para compartir", direccion: "World Trade Center, Montevideo", urlFoto: null, calificacion: 4.1, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 6, usuarioId: 6, nombre: "Domino's", descripcion: "Pizzas a domicilio en 30 minutos o menos", direccion: "Av. Agraciada 3560, Aguada, Montevideo", urlFoto: null, calificacion: 4.2, estadoServicio: false, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 7, usuarioId: 7, nombre: "Starbucks", descripcion: "Cafés de especialidad y pastelería artesanal", direccion: "Rambla República de México 6400, Carrasco", urlFoto: null, calificacion: 4.3, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 8, usuarioId: 8, nombre: "Popeyes", descripcion: "Pollo frito cajún crujiente al estilo Louisiana", direccion: "Ellauri 460, Punta Carretas, Montevideo", urlFoto: null, calificacion: 4.4, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 9, usuarioId: 9, nombre: "Dunkin'", descripcion: "Donuts, café y snacks para llevar a toda hora", direccion: "Av. Gral. Flores 3264, La Blanqueada", urlFoto: null, calificacion: 4.0, estadoServicio: false, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 10, usuarioId: 10, nombre: "Dairy Queen", descripcion: "Blizzards, helados suaves y hamburguesas", direccion: "Br. Artigas 1340, Parque Rodó, Montevideo", urlFoto: null, calificacion: 4.2, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 11, usuarioId: 11, nombre: "Five Guys", descripcion: "Hamburguesas artesanales y papas fritas cajún", direccion: "Av. Italia 3462, Tres Cruces, Montevideo", urlFoto: null, calificacion: 4.6, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 12, usuarioId: 12, nombre: "Shake Shack", descripcion: "ShackBurgers, shake de vainilla y crinkle fries", direccion: "Rambla Gandhi 400, Pocitos, Montevideo", urlFoto: null, calificacion: 4.5, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 13, usuarioId: 13, nombre: "Baskin-Robbins", descripcion: "31 sabores de helado artesanal y tortas heladas", direccion: "Av. Sarmiento 2530, Pocitos, Montevideo", urlFoto: null, calificacion: 4.3, estadoServicio: false, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 14, usuarioId: 14, nombre: "Papa John's", descripcion: "Pizzas con ingredientes frescos y salsa de ajo especial", direccion: "Av. Luis Batlle Berres 5270, Montevideo", urlFoto: null, calificacion: 4.0, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 15, usuarioId: 15, nombre: "Panera Bread", descripcion: "Sándwiches, sopas y ensaladas con pan artesanal horneado", direccion: "Av. Dr. Luis Morquio 1820, Pocitos, Montevideo", urlFoto: null, calificacion: 4.1, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 16, usuarioId: 16, nombre: "La Pasiva", descripcion: "Chivitos y hamburguesas uruguayas de toda la vida", direccion: "Av. 18 de Julio 925, Montevideo", urlFoto: null, calificacion: 4.4, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 17, usuarioId: 17, nombre: "Telepizza", descripcion: "Pizzas artesanales con masa fresca y variedad de toppings", direccion: "Av. Millán 4200, Montevideo", urlFoto: null, calificacion: 3.9, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 18, usuarioId: 18, nombre: "El Palenque", descripcion: "Parrilla uruguaya con cortes premium y vista al puerto", direccion: "Mercado del Puerto, Montevideo", urlFoto: null, calificacion: 4.7, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 19, usuarioId: 19, nombre: "Sushi Club", descripcion: "Rolls, nigiris y combos de sushi fresco", direccion: "Av. Brasil 2830, Pocitos, Montevideo", urlFoto: null, calificacion: 4.5, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 20, usuarioId: 20, nombre: "Don Pepino", descripcion: "Pizzas a la piedra al estilo tradicional", direccion: "Av. Rivera 3100, Montevideo", urlFoto: null, calificacion: 4.2, estadoServicio: false, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 21, usuarioId: 21, nombre: "Tandoor", descripcion: "Cocina india auténtica con curries y naan artesanal", direccion: "Bulevar Artigas 1290, Montevideo", urlFoto: null, calificacion: 4.6, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 22, usuarioId: 22, nombre: "La Fusta", descripcion: "Parrilla tradicional con asados y empanadas caseras", direccion: "Av. Italia 2880, Montevideo", urlFoto: null, calificacion: 4.3, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 23, usuarioId: 23, nombre: "Wok to Walk", descripcion: "Noodles y woks preparados al momento con salsas asiáticas", direccion: "Peatonal Sarandí 650, Ciudad Vieja", urlFoto: null, calificacion: 4.1, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 24, usuarioId: 24, nombre: "Pizza Cero", descripcion: "Pizzas gourmet con ingredientes premium y masa madre", direccion: "Av. Libertador 2640, Montevideo", urlFoto: null, calificacion: 4.4, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 25, usuarioId: 25, nombre: "Taco Bell", descripcion: "Tacos, burritos y nachos al estilo tex-mex", direccion: "Av. 8 de Octubre 2900, Montevideo", urlFoto: null, calificacion: 3.8, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 26, usuarioId: 26, nombre: "El Drugstore", descripcion: "Bistró urbano con cocina de autor y cócteles artesanales", direccion: "Calle Minas 1486, Montevideo", urlFoto: null, calificacion: 4.5, estadoServicio: false, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 27, usuarioId: 27, nombre: "Café Brasilero", descripcion: "El café más antiguo de Montevideo, sándwiches y tortas", direccion: "Ituzaingó 1447, Ciudad Vieja", urlFoto: null, calificacion: 4.6, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 28, usuarioId: 28, nombre: "Panda Express", descripcion: "Cocina china americana con arroz frito y pollo naranja", direccion: "Shopping Tres Cruces, Montevideo", urlFoto: null, calificacion: 3.9, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 29, usuarioId: 29, nombre: "La Otra", descripcion: "Hamburguesas artesanales con pan brioche y papas rústicas", direccion: "Av. Gral. Rivera 2460, Montevideo", urlFoto: null, calificacion: 4.3, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 30, usuarioId: 30, nombre: "Güeya", descripcion: "Smash burgers y papas fritas con salsas de autor", direccion: "Calle Jackson 1380, Montevideo", urlFoto: null, calificacion: 4.7, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 31, usuarioId: 31, nombre: "Negroni", descripcion: "Cocina italiana moderna con pastas frescas y risottos", direccion: "Av. Brasil 2560, Pocitos, Montevideo", urlFoto: null, calificacion: 4.4, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 32, usuarioId: 32, nombre: "El Preferido", descripcion: "Bodegón clásico con guisos, pucheros y vino de la casa", direccion: "Washington 2462, Montevideo", urlFoto: null, calificacion: 4.2, estadoServicio: false, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 33, usuarioId: 33, nombre: "Tacos & Co", descripcion: "Tacos artesanales con rellenos creativos y guacamole fresco", direccion: "Bulevar España 2130, Montevideo", urlFoto: null, calificacion: 4.1, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 34, usuarioId: 34, nombre: "Green Eat", descripcion: "Bowls saludables, wraps veganos y jugos naturales", direccion: "Av. 18 de Julio 1230, Montevideo", urlFoto: null, calificacion: 4.3, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 35, usuarioId: 35, nombre: "Spiedo", descripcion: "Pollo al spiedo con papas asadas y ensaladas frescas", direccion: "Av. Millán 3200, Montevideo", urlFoto: null, calificacion: 4.0, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 36, usuarioId: 36, nombre: "Mozzarella", descripcion: "Pizzas napolitanas con mozzarella fresca importada", direccion: "Calle Ellauri 320, Punta Carretas", urlFoto: null, calificacion: 4.5, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 37, usuarioId: 37, nombre: "La Madelón", descripcion: "Empanadas criollas horneadas con rellenos tradicionales", direccion: "Av. Lezica 4830, Montevideo", urlFoto: null, calificacion: 4.2, estadoServicio: false, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 38, usuarioId: 38, nombre: "Ramen-Ya", descripcion: "Ramen tonkotsu y shoyu con ingredientes japoneses auténticos", direccion: "Calle Colonia 1860, Montevideo", urlFoto: null, calificacion: 4.6, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 39, usuarioId: 39, nombre: "El Fogón", descripcion: "Costillas, achuras y chorizos a la parrilla criolla", direccion: "Camino Carrasco 5200, Montevideo", urlFoto: null, calificacion: 4.4, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 40, usuarioId: 40, nombre: "Mostaza", descripcion: "Hamburguesas y combos al estilo argentino clásico", direccion: "Shopping Montevideo, Av. Luis A. de Herrera", urlFoto: null, calificacion: 3.8, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 41, usuarioId: 41, nombre: "La Lorraine", descripcion: "Café francés con croissants, quiches y macarons", direccion: "Bulevar Artigas 1475, Montevideo", urlFoto: null, calificacion: 4.5, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 42, usuarioId: 42, nombre: "Sushi Pop", descripcion: "Sushi fusión con rolls creativos y entradas asiáticas", direccion: "Av. Rivera 2950, Montevideo", urlFoto: null, calificacion: 4.3, estadoServicio: false, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 43, usuarioId: 43, nombre: "La Chopería", descripcion: "Cerveza artesanal de barril con picadas y sándwiches", direccion: "Calle Reconquista 587, Ciudad Vieja", urlFoto: null, calificacion: 4.4, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 44, usuarioId: 44, nombre: "Tiendas El Sol", descripcion: "Rotisería con platos del día caseros y milanesas", direccion: "Av. 8 de Octubre 1560, Montevideo", urlFoto: null, calificacion: 4.0, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 45, usuarioId: 45, nombre: "Burrito Bros", descripcion: "Burritos gigantes y nachos con queso cheddar fundido", direccion: "Calle San José 1190, Montevideo", urlFoto: null, calificacion: 4.2, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 46, usuarioId: 46, nombre: "Il Forno", descripcion: "Pastas frescas y pizzas al horno de leña importado", direccion: "Av. Sarmiento 2340, Pocitos", urlFoto: null, calificacion: 4.6, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 47, usuarioId: 47, nombre: "Melos Helados", descripcion: "Helados artesanales con sabores únicos y conos caseros", direccion: "Rambla Gandhi 624, Pocitos", urlFoto: null, calificacion: 4.7, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 48, usuarioId: 48, nombre: "El Tinkal", descripcion: "Cocina peruana con ceviches, tiraditos y lomo saltado", direccion: "Calle Libertad 2560, Montevideo", urlFoto: null, calificacion: 4.5, estadoServicio: false, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 49, usuarioId: 49, nombre: "Croissant & Co", descripcion: "Desayunos y meriendas con bollería francesa artesanal", direccion: "Av. Brasil 1550, Montevideo", urlFoto: null, calificacion: 4.3, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
    { id: 50, usuarioId: 50, nombre: "El Asador Criollo", descripcion: "Parrilla tradicional con cordero, vacío y morcilla", direccion: "Av. Gral. Flores 4200, Montevideo", urlFoto: null, calificacion: 4.4, estadoServicio: true, email: '', telefono: '', creacion: '', bloqueo: null, eliminacion: null },
  ];

  const size = params?.size ?? 10;
  const page = params?.page ?? 0;
  const start = page * size;
  const content = mock.slice(start, start + size);

  return {
    content,
    totalElements: mock.length,
    totalPages: Math.ceil(mock.length / size),
    number: page,
    size,
    first: page === 0,
    last: start + size >= mock.length,
    empty: content.length === 0,
  };
*/
}
