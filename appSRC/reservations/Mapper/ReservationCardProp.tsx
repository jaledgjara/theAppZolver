// appSRC/reservations/Helper/MapStatusToUIClient.ts

import { ReservationCardProps } from "@/appCOMP/cards/ReservationCard";

// Asumo que tu objeto de reserva crudo (item) se parece a esto:
interface ReservationData {
  id: string;
  service: { name: string; price: string };
  date: string;
  time: string;
  status: any;
  // Relaciones
  client: { name: string; avatar: any };
  professional: { name: string; avatar: any };
}

export const mapReservationToCard = (
  item: ReservationData,
  viewRole: "client" | "professional" // <--- NUEVO ARGUMENTO
): ReservationCardProps => {
  // Lógica para decidir qué mostrar
  const isProfessionalView = viewRole === "professional";

  return {
    id: item.id,
    serviceName: item.service.name, // O 'Servicio de...'
    date: item.date, // Asegúrate de formatear esto si viene crudo
    time: item.time,
    status: item.status,
    price: item.service.price,

    // AQUÍ ESTÁ LA MAGIA:
    // Si soy el profesional, quiero ver el nombre del CLIENTE.
    // Si soy el cliente, quiero ver el nombre del PROFESIONAL.
    counterpartName: isProfessionalView
      ? item.client.name
      : item.professional.name,

    avatar: isProfessionalView ? item.client.avatar : item.professional.avatar,
  };
};
