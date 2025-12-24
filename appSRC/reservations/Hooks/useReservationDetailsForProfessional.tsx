import { useState, useEffect, useCallback } from "react";
// 1. IMPORTAR LA FUNCIÓN CORRECTA
import { fetchReservationByIdForProfessional } from "../Service/ReservationService";
import { Reservation } from "../Type/ReservationType";

export const useReservationDetailsForProfessional = (
  id: string | undefined
) => {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDetails = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);

      // 2. USAR LA FUNCIÓN CORRECTA AQUÍ
      const data = await fetchReservationByIdForProfessional(id);

      setReservation(data);
    } catch (err: any) {
      console.error("Error fetching details:", err);
      setError(err.message || "Error al cargar la reserva");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    getDetails();
  }, [getDetails]);

  return {
    reservation,
    isLoading,
    error,
    refresh: getDetails,
  };
};
