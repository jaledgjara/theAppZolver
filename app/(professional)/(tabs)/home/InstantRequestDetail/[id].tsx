import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import InstantRequestDetailScreen from "@/appSRC/reservations/Screens/Instant/InstantRequestDetailScreen";
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";

import { fetchReservationByIdForProfessional } from "@/appSRC/reservations/Service/ReservationService";
import { useConfirmInstantReservation } from "@/appSRC/reservations/Hooks/useConfirmInstantReservation";
import { useRejectByProfessional } from "@/appSRC/reservations/Hooks/useRejectByProfessional";
import { Reservation } from "@/appSRC/reservations/Type/ReservationType";

const InstantRequestDetailRoute = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { confirmRequest, processingId } = useConfirmInstantReservation();
  const { rejectReservation, isRejecting } = useRejectByProfessional();

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    fetchReservationByIdForProfessional(id)
      .then(setReservation)
      .catch((err) => {
        console.error("[ROUTE] Error fetching reservation:", err);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleAccept = () => {
    if (!id) return;
    confirmRequest(id, () => {
      router.back();
    });
  };

  const handleReject = () => {
    if (!id) return;
    rejectReservation(id, () => {
      router.back();
    });
  };

  if (isLoading || !reservation) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <MiniLoaderScreen />
      </View>
    );
  }

  return (
    <InstantRequestDetailScreen
      reservation={reservation}
      isLoading={isLoading}
      isAccepting={processingId === id}
      isRejecting={isRejecting}
      onAccept={handleAccept}
      onReject={handleReject}
    />
  );
};

export default InstantRequestDetailRoute;
