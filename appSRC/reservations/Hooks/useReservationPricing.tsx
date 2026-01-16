// appSRC/reservations/Hooks/useReservationPricing.ts
import { useMemo } from "react";
import { ProfessionalTemplate } from "@/appSRC/categories/Service/ProfessionalCatalog";

export function useReservationPricing(
  selectedServices: ProfessionalTemplate[],
  isInstant: boolean
) {
  return useMemo(() => {
    // Suma de precios personalizados
    const finalPrice = selectedServices.reduce(
      (acc, curr) => acc + curr.price,
      0
    );

    // Suma de tiempos estimados
    const totalMinutes = selectedServices.reduce(
      (acc, curr) => acc + curr.estimatedMinutes,
      0
    );

    // Formateo de horas (ej: 1.5 hs)
    const hoursLabel = (totalMinutes / 60).toFixed(1);

    return {
      finalPrice,
      totalMinutes,
      hoursLabel,
    };
  }, [selectedServices]);
}
