import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { useQueryClient } from "@tanstack/react-query";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/appSRC/services/supabaseClient";
import {
  fetchPendingReview,
  PendingReviewReservation,
  createReviewService,
} from "../Service/ReviewService";

/**
 * Global hook that shows a review modal ONLY when a reservation
 * transitions to 'completed' via Realtime. Does NOT check on mount
 * so it won't nag the user every time they open the app.
 */
export const useGlobalReviewAlert = () => {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [pendingReview, setPendingReview] = useState<PendingReviewReservation | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const isClient = user?.role === "client";
  const clientId = user?.uid;

  // --- Check for pending reviews ---
  const checkPendingReview = useCallback(async () => {
    if (!clientId || !isClient) return;

    console.log("[GLOBAL-REVIEW] Checking for pending reviews...");
    const result = await fetchPendingReview(clientId);

    if (result) {
      console.log("[GLOBAL-REVIEW] Found pending review:", result.reservationId);
      setPendingReview(result);
      setModalVisible(true);
    } else {
      console.log("[GLOBAL-REVIEW] No pending reviews");
      setPendingReview(null);
      setModalVisible(false);
    }
  }, [clientId, isClient]);

  // --- Realtime: listen for ANY reservation status change for this client ---
  useEffect(() => {
    if (!clientId || !isClient) return;

    // Only listen for realtime — do NOT check on mount
    // Subscribe to realtime updates on client's reservations
    const channelName = `global_review_${clientId}`;

    const allChannels = supabase.getChannels();
    const stale = allChannels.find((ch) => ch.topic === `realtime:${channelName}`);
    if (stale) {
      supabase.removeChannel(stale);
    }

    console.log("[GLOBAL-REVIEW] Setting up realtime subscription");

    channelRef.current = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "reservations",
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          const newStatus = (payload.new as { status?: string }).status;
          console.log("[GLOBAL-REVIEW] Realtime reservation update, status:", newStatus);
          if (newStatus === "completed") {
            // Small delay to let the DB settle
            setTimeout(() => checkPendingReview(), 800);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("[GLOBAL-REVIEW] Realtime connected");
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("[GLOBAL-REVIEW] Realtime error:", status, err);
        }
      });

    return () => {
      console.log("[GLOBAL-REVIEW] Cleaning up realtime");
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [clientId, isClient, checkPendingReview]);

  // --- Submit review ---
  const handleSubmit = async (score: number, comment: string) => {
    if (!pendingReview) return;

    setIsSubmitting(true);
    console.log("[GLOBAL-REVIEW] Submitting review:", {
      reservationId: pendingReview.reservationId,
      score,
      comment: comment || "(empty)",
    });

    try {
      await createReviewService({
        reservation_id: pendingReview.reservationId,
        client_id: pendingReview.clientId,
        professional_id: pendingReview.professionalId,
        score,
        comment: comment || undefined,
      });

      console.log("[GLOBAL-REVIEW] Review submitted successfully");

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["review", "reservation", pendingReview.reservationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["reviews", "professional", pendingReview.professionalId],
      });

      setModalVisible(false);
      setPendingReview(null);
    } catch (error) {
      console.error("[GLOBAL-REVIEW] Error submitting review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Dismiss (user closes without reviewing) ---
  const handleDismiss = () => {
    console.log("[GLOBAL-REVIEW] Review dismissed by user");
    setModalVisible(false);
  };

  return {
    modalVisible,
    pendingReview,
    isSubmitting,
    handleSubmit,
    handleDismiss,
  };
};
