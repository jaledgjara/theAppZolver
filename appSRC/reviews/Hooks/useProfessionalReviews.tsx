import { useQuery } from "@tanstack/react-query";
import { fetchReviewsByProfessional } from "../Service/ReviewService";

/**
 * Fetches all reviews for a professional.
 * Used in the professional's profile/dashboard to show their rating history.
 */
export const useProfessionalReviews = (professionalId: string) => {
  return useQuery({
    queryKey: ["reviews", "professional", professionalId],
    queryFn: () => fetchReviewsByProfessional(professionalId),
    enabled: !!professionalId && professionalId !== "undefined",
    staleTime: 1000 * 60 * 5, // 5 min cache
  });
};
