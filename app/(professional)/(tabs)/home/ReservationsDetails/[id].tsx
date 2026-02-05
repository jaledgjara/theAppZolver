import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// Components & Theme
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { COLORS } from "@/appASSETS/theme";
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";
import ReservationDetailsCard from "@/appSRC/reservations/Screens/Client/ReservationDetailsCard";
import { QuoteJobControlCard } from "@/appSRC/reservations/Screens/Quote/QuoteJobControlCard";

// Hooks
import { useQuoteStatusForProfessional } from "@/appSRC/reservations/Hooks/useQuoteStatusForProfessional";
import { getStatusConfig } from "@/appSRC/reservations/Helper/MapStatusToUIClient";

const ReservationsDetailsScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { reservation, isLoading, refresh } = useQuoteStatusForProfessional(id);

  const displayData = useMemo(() => {
    if (!reservation) return null;

    const dateObj = reservation.scheduledStart || new Date();
    const statusStyle = getStatusConfig(reservation.statusUI);

    return {
      clientName: reservation.roleName,
      clientAvatar: reservation.roleAvatar,
      serviceTitle: reservation.serviceTitle,
      description: reservation.description, // ✅ Ahora mapeado
      statusText: statusStyle.text,
      statusBg: statusStyle.bg,
      statusColor: statusStyle.color,
      dateFormatted: dateObj.toLocaleDateString("es-AR", {
        day: "numeric",
        month: "long",
      }),
      timeFormatted: dateObj.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      address: reservation.address,
      priceService: reservation.financials?.price || 0,
      platformFee: reservation.financials?.platformFee || 0,
      totalAmount:
        (reservation.financials?.price || 0) +
        (reservation.financials?.platformFee || 0),

      // ✅ LÓGICA DE CONTROL:
      isCompleted: reservation.statusDTO === "completed",
      isCanceled: reservation.statusDTO.includes("canceled"),
    };
  }, [reservation]);

  if (isLoading)
    return (
      <View style={styles.centerContainer}>
        <MiniLoaderScreen />
      </View>
    );
  if (!displayData || !reservation) return null;

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Detalles del Trabajo" showBackButton={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refresh} />
        }>
        <ReservationDetailsCard
          type="professional"
          name={displayData.clientName}
          avatar={displayData.clientAvatar}
          statusText={displayData.statusText}
          statusBg={displayData.statusBg}
          statusColor={displayData.statusColor}
        />

        <ReservationDetailsCard type="title" title={displayData.serviceTitle} />
        <ReservationDetailsCard
          type="date"
          date={displayData.dateFormatted}
          time={displayData.timeFormatted}
        />
        <ReservationDetailsCard
          type="location"
          location={displayData.address}
        />

        {/* NOTA DEL CLIENTE */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.sectionHeader}>Nota del cliente</Text>
          <Text style={styles.descriptionText}>
            {displayData.description || "Sin especificaciones adicionales."}
          </Text>
        </View>

        <ReservationDetailsCard
          type="payment"
          priceService={`$${displayData.priceService.toLocaleString("es-AR")}`}
          platformFee={`$${displayData.platformFee.toLocaleString("es-AR")}`}
          totalAmount={`$${displayData.totalAmount.toLocaleString("es-AR")}`}
        />

        {/* --- LÓGICA DEL CARTEL --- */}
        <View style={styles.actionContainer}>
          {displayData.isCompleted ? (
            // 1. SI ESTÁ COMPLETADO: Mostrar badge de éxito
            <View style={styles.finishedBadge}>
              <Ionicons
                name="checkmark-circle"
                size={26}
                color={COLORS.success}
              />
              <Text style={styles.finishedText}>TRABAJO FINALIZADO</Text>
            </View>
          ) : displayData.isCanceled ? // 2. SI ESTÁ CANCELADO: No mostrar controlador
          null : (
            // 3. SI ESTÁ ACTIVO: Mostrar el controlador de Quote
            <QuoteJobControlCard job={reservation} onJobCompleted={refresh} />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default ReservationsDetailsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  scrollContent: { padding: 16, paddingBottom: 60 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  descriptionContainer: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9CA3AF",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  descriptionText: { fontSize: 15, color: "#374151", lineHeight: 22 },
  actionContainer: { marginTop: 24 },
  finishedBadge: {
    flexDirection: "row",
    backgroundColor: "#E8F5E9",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  finishedText: {
    marginLeft: 10,
    color: COLORS.success,
    fontWeight: "800",
    fontSize: 16,
  },
});
