import { useQuery } from "@tanstack/react-query";
import { fetchReviewByReservation } from "../Service/ReviewService";

export const useReviewByReservation = (reservationId: string) => {
  console.log("[REVIEW-HOOK] useReviewByReservation called with:", reservationId);

  return useQuery({
    queryKey: ["review", "reservation", reservationId],
    queryFn: () => {
      console.log("[REVIEW-HOOK] useReviewByReservation queryFn executing for:", reservationId);
      return fetchReviewByReservation(reservationId);
    },
    enabled: !!reservationId && reservationId !== "undefined",
    staleTime: 1000 * 60 * 10,
  });
};
