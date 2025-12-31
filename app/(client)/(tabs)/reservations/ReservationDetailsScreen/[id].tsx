import React, { useMemo } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// Components
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { ReservationDetailsCard } from "@/appSRC/reservations/Screens/Client/ReservationDetailsCard";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { useReservationDetail } from "@/appSRC/reservations/Hooks/useClientReservationDetail";
import {
  getStatusConfig,
  mapStatusToUI,
} from "@/appSRC/reservations/Helper/MapStatusToUIClient";
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";

const ReservationDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const reservationId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();

  // 1. Data Fetching
  const { reservation, isLoading, isError, refetch } =
    useReservationDetail(reservationId);

  // 2. Data Preparation (Igual que en Professional Screen)
  const displayData = useMemo(() => {
    if (!reservation) return null;

    // DEBUG: Descomenta esto para ver qué llega exactamente en la fecha
    // console.log("SCHEDULE DATA:", reservation.schedule);

    // A. Fechas
    const dateObj =
      reservation.schedule.startDate instanceof Date &&
      !isNaN(reservation.schedule.startDate.getTime())
        ? reservation.schedule.startDate
        : new Date(); // Fallback if invalid

    const dateStr = dateObj.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
    });

    const timeStr = dateObj.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // B. Professional Info
    // Buscamos legalName, luego name, luego fallback
    const proName =
      reservation.professional?.name ||
      reservation.professional?.name ||
      "Profesional Zolver";

    const proAvatar = reservation.professional?.avatar
      ? { uri: reservation.professional.avatar }
      : require("@/appASSETS/RawImages/avatar-0.jpg");

    // C. Status & Styles
    const uiStatus = mapStatusToUI(reservation.status);
    const statusStyle = getStatusConfig(uiStatus);

    // D. Financials
    const priceService = reservation.financials?.priceEstimated || 0;
    const platformFee = reservation.financials?.platformFee || 0;
    const totalAmount =
      reservation.financials?.priceFinal || priceService + platformFee;

    return {
      // Info Principal
      proName: proName,
      proAvatar: proAvatar,

      // Detalles Servicio
      serviceTitle: reservation.title || "Servicio Solicitado",
      description: reservation.description,

      // Fechas
      dateFormatted: dateStr,
      timeFormatted: `${timeStr}`,

      // Status Visuals
      statusText: statusStyle.text,
      statusBg: statusStyle.bg,
      statusColor: statusStyle.color,

      // Ubicación
      address: reservation.location?.street || "Ubicación a coordinar",

      // Dinero
      priceService: `$${priceService.toLocaleString("es-AR")}`,
      platformFee: `$${platformFee.toLocaleString("es-AR")}`,
      totalAmount: `$${totalAmount.toLocaleString("es-AR")}`,

      // Lógica de visualización
      showContact: uiStatus === "in_progress" || uiStatus === "confirmed",
    };
  }, [reservation]);

  // 3. Loading State
  if (isLoading) {
    return <MiniLoaderScreen />;
  }

  // 4. Error State
  if (isError || !displayData) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorTitle}>Error al cargar</Text>
        <Text style={styles.errorText}>No pudimos encontrar esta reserva.</Text>
        <LargeButton title="Volver" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Detalle de Reserva" showBackButton={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }>
        {/* SECCIÓN 1: Profesional & Estado */}
        <ReservationDetailsCard
          type="professional"
          name={displayData.proName}
          avatar={displayData.proAvatar}
          statusText={displayData.statusText}
          statusBg={displayData.statusBg}
          statusColor={displayData.statusColor}
        />

        {/* Título del Servicio */}
        <ReservationDetailsCard type="title" title={displayData.serviceTitle} />

        {/* SECCIÓN 2: Fecha y Hora */}
        <ReservationDetailsCard
          type="date"
          date={displayData.dateFormatted}
          time={displayData.timeFormatted}
        />

        {/* SECCIÓN 3: Ubicación */}
        <ReservationDetailsCard
          type="location"
          location={displayData.address}
        />

        {/* SECCIÓN 4: Descripción */}
        {displayData.description ? (
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionHeader}>Nota del servicio</Text>
            <Text style={styles.descriptionText}>
              {displayData.description}
            </Text>
          </View>
        ) : null}

        {/* SECCIÓN 5: Desglose de Pago */}
        <ReservationDetailsCard
          type="payment"
          priceService={displayData.priceService}
          platformFee={displayData.platformFee}
          totalAmount={displayData.totalAmount}
        />

        {displayData.showContact && (
          <View style={styles.footerAction}>
            <LargeButton
              title="Contactar Profesional"
              iconName="chatbubble-outline"
              onPress={() => console.log("Ir al chat")}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default ReservationDetailScreen;

// ... (Mismos estilos que tenías)
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
    color: "#6B7280",
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
