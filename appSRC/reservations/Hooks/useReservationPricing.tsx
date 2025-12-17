import { useMemo } from "react";
import { ServiceTag } from "@/appSRC/categories/Service/ProfessionalCatalog";

export function useReservationPricing(
  selectedTags: ServiceTag[],
  pricePerHour: number,
  isInstant: boolean
) {
  return useMemo(() => {
    let totalMinutes = 0;

    selectedTags.forEach((tag) => {
      totalMinutes += tag.estimated_minutes || 60;
    });

    // Mínimo 1 hora
    if (totalMinutes === 0) totalMinutes = 60;

    const hours = totalMinutes / 60;
    const basePrice = hours * pricePerHour;

    // Recargo del 30% si es instantáneo
    const urgencyMultiplier = isInstant ? 1.3 : 1.0;
    const finalPrice = basePrice * urgencyMultiplier;

    return {
      totalMinutes,
      hoursLabel: hours.toFixed(1),
      finalPrice: Math.round(finalPrice),
      isBaseEstimate: selectedTags.length === 0,
    };
  }, [selectedTags, pricePerHour, isInstant]);
}
