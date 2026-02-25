import React, { useEffect, useRef } from "react";
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

// Reviews (display only — modal is handled globally by GlobalReviewAlert)
import { useReviewByReservation } from "@/appSRC/reviews/Hooks/useReviewByReservation";
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

    console.log("[DETAIL] Setting up realtime subscription for reservation:", reservationId);

    channelRef.current = subscribeToReservationStatusService(
      reservationId,
      (newStatus) => {
        console.log("[DETAIL] Realtime status change detected:", newStatus);
        refetch();
      }
    );

    return () => {
      console.log("[DETAIL] Cleaning up realtime subscription");
      unsubscribeFromChannel(channelRef.current);
      channelRef.current = null;
    };
  }, [reservationId, refetch]);

  // --- Show existing review if already submitted ---
  const { data: existingReview } = useReviewByReservation(reservationId);

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

        {/* 6. Reseña existente */}
        {existingReview ? (
          <ReviewSummaryCard review={existingReview} />
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
  footerAction: {
    marginTop: 10,
  },
});
