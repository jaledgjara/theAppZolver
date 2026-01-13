// appSRC/reservations/Hooks/useReservationDetail.tsx

import { useQuery } from "@tanstack/react-query";
import { fetchReservationById } from "../Service/ReservationService";
import { useMemo } from "react";
import { getStatusConfig } from "../Helper/MapStatusToUIClient";
import { formatForUI } from "@/appSRC/timeAndData/Builder/TimeBuilder";

export const useReservationDetail = (
  reservationId: string,
  userRole: "client" | "professional"
) => {
  // 1. Fetch de Datos Crudos (Entidad de Dominio)
  const query = useQuery({
    queryKey: ["reservation", "detail", reservationId, userRole],
    queryFn: () => fetchReservationById(reservationId, userRole),
    enabled: !!reservationId && reservationId !== "undefined",
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });

  // 2. ViewModel Logic: Preparar datos para la UI
  const displayData = useMemo(() => {
    if (!query.data) return null;
    const r = query.data;

    // ---------------------------------------------------------
    // 🕒 LÓGICA DE FECHA (El Fix de las "12:00 a.m.")
    // ---------------------------------------------------------
    let targetDate = r.scheduledStart;

    // Si es Instantánea, la "hora del turno" es la hora en que se creó.
    // También usamos createdAt como respaldo si scheduledStart viniera nulo.
    if (r.modality === "instant" || !targetDate) {
      targetDate = r.createdAt;
    }

    // A. Formateo de Tiempo (Usando TimeEngine)
    const { date, time } = formatForUI(targetDate);
    // ---------------------------------------------------------

    // B. Formateo de Dinero
    const priceService = r.financials.price;
    const platformFee = r.financials.platformFee || 0;
    const totalAmount = priceService + platformFee;

    // C. Estilos de Estado
    const statusStyle = getStatusConfig(r.statusUI);

    return {
      // Entidad Original (por si se necesita lógica extra)
      raw: r,

      // Datos de Presentación (ViewModel)
      header: {
        avatar: r.roleAvatar,
        title: r.roleName,
        subTitle: userRole === "client" ? "Profesional" : "Cliente",
        status: {
          text: statusStyle.text,
          bg: statusStyle.bg,
          color: statusStyle.color,
        },
      },
      service: {
        title: r.serviceTitle,
        description:
          "Nota: " +
          (r.modality === "quote"
            ? "Servicio por cotización"
            : "Servicio instantáneo"),
        modality: r.modality,
      },
      time: {
        dateString: date,
        timeString: time,
      },
      location: r.address,
      finance: {
        service: `$${priceService.toLocaleString("es-AR")}`,
        fee: `$${platformFee.toLocaleString("es-AR")}`,
        total: `$${totalAmount.toLocaleString("es-AR")}`,
      },
      actions: {
        canChat: ["in_progress", "confirmed"].includes(r.statusUI),
        canCancel: ["pending", "confirmed"].includes(r.statusUI),

        canQuote:
          userRole === "professional" &&
          r.modality === "quote" &&
          r.statusUI === "pending",
      },
    };
  }, [query.data, userRole]);

  return {
    ...query,
    displayData,
  };
};
