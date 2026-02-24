import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createReviewService } from "../Service/ReviewService";
import { CreateReviewPayload } from "../Type/ReviewType";

export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReviewPayload) => {
      console.log("[REVIEW-HOOK] useCreateReview mutationFn called with:", JSON.stringify(payload));
      return createReviewService(payload);
    },

    onSuccess: (_data, variables) => {
      console.log("[REVIEW-HOOK] useCreateReview onSuccess for reservation:", variables.reservation_id);

      queryClient.invalidateQueries({
        queryKey: ["review", "reservation", variables.reservation_id],
      });

      queryClient.invalidateQueries({
        queryKey: ["reviews", "professional", variables.professional_id],
      });
    },

    onError: (error, variables) => {
      console.error("[REVIEW-HOOK] useCreateReview onError:", error.message, "for reservation:", variables.reservation_id);
    },
  });
};
