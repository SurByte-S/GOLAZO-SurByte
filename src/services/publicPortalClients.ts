import { Client } from '../types';

export const PUBLIC_PORTAL_CLIENTS: Client[] = [
  {
    id: 'ddc2224f-dc36-4a8e-99ec-eed3b0b5a878',
    name: 'Complejo Aire Libre y Techada',
    complex_name: 'Complejo Aire Libre y Techada',
    address: 'Reservas online',
    status: 'active',
    expires_at: null,
    enable_ranking: true,
    enable_sales: false,
    enable_reservations: true,
    enable_statistics: false,
    created_at: new Date(0).toISOString(),
    features: {
      reservas: true,
      ranking: true,
      ventas: false,
      estadisticas: false,
    },
  },
  {
    id: '279c4ebd-4a94-4772-b608-3ced7807622f',
    name: 'Complejo BOU',
    complex_name: 'Complejo BOU',
    address: 'Reservas online',
    status: 'active',
    expires_at: null,
    enable_ranking: true,
    enable_sales: false,
    enable_reservations: true,
    enable_statistics: false,
    created_at: new Date(0).toISOString(),
    features: {
      reservas: true,
      ranking: true,
      ventas: false,
      estadisticas: false,
    },
  },
];

export const getPublicPortalClientById = (clientId?: string | null) =>
  PUBLIC_PORTAL_CLIENTS.find((client) => client.id === clientId) || null;
