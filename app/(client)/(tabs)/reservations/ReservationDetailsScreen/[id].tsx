import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { RealtimeChannel } from "@supabase/supabase-js";

// Components
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { ReservationDetailsCard } from "@/appSRC/reservations/Screens/Client/ReservationDetailsCard";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { useReservationDetail } from "@/appSRC/reservations/Hooks/useClientReservationDetail";
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";
import { COLORS } from "@/appASSETS/theme";

// Realtime
import {
  subscribeToReservationStatusService,
  unsubscribeFromChannel,
} from "@/appSRC/reservations/Service/ReservationService";

// Reviews
import { useReviewByReservation } from "@/appSRC/reviews/Hooks/useReviewByReservation";
import { useCreateReview } from "@/appSRC/reviews/Hooks/useCreateReview";
import ReviewModal from "@/appSRC/reviews/Screen/ReviewModal";
import { ReviewSummaryCard } from "@/appSRC/reviews/Screen/ReviewSummaryCard";

const ReservationDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const reservationId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();

  const { displayData, isLoading, isError, refetch } = useReservationDetail(
    reservationId,
    "client"
  );

  // --- Realtime: listen for status changes ---
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!reservationId) return;

    console.log("[REVIEW] Setting up realtime subscription for reservation:", reservationId);

    channelRef.current = subscribeToReservationStatusService(
      reservationId,
      (newStatus) => {
        console.log("[REVIEW] Realtime status change detected:", newStatus);
        // Refetch reservation data so UI updates immediately
        refetch();
      }
    );

    return () => {
      console.log("[REVIEW] Cleaning up realtime subscription");
      unsubscribeFromChannel(channelRef.current);
      channelRef.current = null;
    };
  }, [reservationId, refetch]);

  // --- Reviews ---
  const {
    data: existingReview,
    isLoading: reviewLoading,
  } = useReviewByReservation(reservationId);

  console.log("[REVIEW] existingReview:", existingReview);
  console.log("[REVIEW] reviewLoading:", reviewLoading);

  const createReview = useCreateReview();
  const [reviewModalVisible, setReviewModalVisible] = useState(false);

  // Auto-show modal when reservation is completed and no review exists
  const isCompleted = displayData?.raw.statusDTO === "completed";
  const canReview = isCompleted && !existingReview && !reviewLoading;

  console.log("[REVIEW] statusDTO:", displayData?.raw.statusDTO);
  console.log("[REVIEW] isCompleted:", isCompleted);
  console.log("[REVIEW] canReview:", canReview);

  useEffect(() => {
    if (canReview) {
      console.log("[REVIEW] canReview is true -> showing modal in 600ms");
      const timer = setTimeout(() => {
        console.log("[REVIEW] Opening review modal now");
        setReviewModalVisible(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [canReview]);

  const handleSubmitReview = (score: number, comment: string) => {
    if (!displayData) return;
    const raw = displayData.raw;

    console.log("[REVIEW] Submitting review:", {
      reservation_id: reservationId,
      client_id: raw.clientId,
      professional_id: raw.professionalId,
      score,
      comment: comment || "(empty)",
    });

    createReview.mutate(
      {
        reservation_id: reservationId,
        client_id: raw.clientId,
        professional_id: raw.professionalId,
        score,
        comment: comment || undefined,
      },
      {
        onSuccess: (data) => {
          console.log("[REVIEW] Review created successfully:", data);
          setReviewModalVisible(false);
        },
        onError: (error) => {
          console.error("[REVIEW] Error creating review:", error);
        },
      }
    );
  };

  if (isLoading) return <MiniLoaderScreen />;

  if (isError || !displayData) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorTitle}>Reserva no encontrada</Text>
        <LargeButton title="Volver" onPress={() => router.back()} />
      </View>
    );
  }

  const { header, service, time, location, finance, actions } = displayData;

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Detalle de Reserva" showBackButton={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }>
        {/* 1. Contraparte & Estado */}
        <ReservationDetailsCard
          type="identity"
          viewRole="client"
          name={header.title}
          avatar={header.avatar}
          statusText={header.status.text}
          statusBg={header.status.bg}
          statusColor={header.status.color}
        />

        {/* 2. Servicio */}
        <ReservationDetailsCard type="title" title={service.title} />

        {/* 3. Tiempo */}
        <ReservationDetailsCard
          type="date"
          date={time.dateString}
          time={time.timeString}
        />

        {/* 4. Ubicación */}
        <ReservationDetailsCard type="location" location={location} />

        {/* 5. Finanzas */}
        <ReservationDetailsCard
          type="payment"
          priceService={finance.service}
          platformFee={finance.fee}
          totalAmount={finance.total}
        />

        {/* 6. Reseña: Mostrar existente o botón para calificar */}
        {existingReview ? (
          <ReviewSummaryCard review={existingReview} />
        ) : canReview ? (
          <LargeButton
            title="Calificar Profesional"
            iconName="star"
            backgroundColor={COLORS.primary}
            onPress={() => setReviewModalVisible(true)}
            style={{ marginVertical: 10 }}
          />
        ) : null}

        {/* 7. Acciones Dinámicas */}
        <View style={styles.footerAction}>
          {actions.canQuote && (
            <LargeButton
              title="Enviar Cotización"
              backgroundColor={COLORS.primary}
              onPress={() => console.log("Abrir modal cotización")}
            />
          )}
        </View>
      </ScrollView>

      {/* Review Modal */}
      <ReviewModal
        visible={reviewModalVisible}
        professionalName={header.title}
        onClose={() => setReviewModalVisible(false)}
        onSubmit={handleSubmitReview}
        isLoading={createReview.isPending}
      />
    </View>
  );
};

export default ReservationDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 50,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  descriptionContainer: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9CA3AF",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  descriptionText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  footerAction: {
    marginTop: 10,
  },
});
