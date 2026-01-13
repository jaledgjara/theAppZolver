// appSRC/reservations/Hooks/useReservationPricing.ts

import { ServiceTag } from "@/appSRC/categories/Service/ProfessionalCatalog";
import { useMemo } from "react";

export function useReservationPricing(
  selectedTags: ServiceTag[],
  pricePerHour: number,
  isInstant: boolean
) {
  return useMemo(() => {
    // 1. Validamos que el precio sea un número válido
    const validPrice =
      isNaN(pricePerHour) || pricePerHour <= 0 ? 5000 : pricePerHour;

    let totalMinutes = 0;

    selectedTags.forEach((tag) => {
      // 2. Validamos que exista estimated_minutes o usamos 60 por defecto
      totalMinutes += tag.estimated_minutes ?? 60;
    });

    // Mínimo 1 hora si no hay nada seleccionado para mostrar un "Desde..."
    const calculationMinutes = totalMinutes === 0 ? 60 : totalMinutes;

    const hours = calculationMinutes / 60;
    const basePrice = hours * validPrice;

    const urgencyMultiplier = isInstant ? 1.3 : 1.0;
    const finalPrice = basePrice * urgencyMultiplier;

    return {
      totalMinutes: calculationMinutes,
      hoursLabel: hours.toFixed(1),
      finalPrice: Math.round(finalPrice),
      isBaseEstimate: selectedTags.length === 0,
    };
  }, [selectedTags, pricePerHour, isInstant]);
}
