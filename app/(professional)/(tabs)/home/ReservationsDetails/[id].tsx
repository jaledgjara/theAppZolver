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
import { format, isValid } from "date-fns";
import { es } from "date-fns/locale";

// Components
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { LargeButton } from "@/appCOMP/button/LargeButton";

// Hooks & Utils
import { useReservationDetailsForProfessional } from "@/appSRC/reservations/Hooks/useReservationDetailsForProfessional";
import {
  getStatusConfig,
  mapStatusToUI,
} from "@/appSRC/reservations/Helper/MapStatusToUIClient"; // Assuming shared helper or similar logic
import ReservationDetailsCard from "@/appSRC/reservations/Screens/Client/ReservationDetailsCard";
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";

const ReservationsDetailsScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // 1. Data Fetching (Professional Hook)
  const { reservation, isLoading, error, refresh } =
    useReservationDetailsForProfessional(id);

  // 2. Data Preparation
  const displayData = useMemo(() => {
    if (!reservation) return null;

    // Date Safety
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
    const title = reservation.title || "Servicio";

    // UI Status
    const uiStatus = mapStatusToUI(reservation.status);
    const statusStyle = getStatusConfig(uiStatus);

    return {
      // Client Info (For the professional view)
      clientName: reservation.client?.name || "Cliente",
      clientAvatar: reservation.client?.avatar
        ? { uri: reservation.client.avatar }
        : require("@/appASSETS/RawImages/avatar-0.jpg"), // Fallback

      serviceTitle: title,
      description: reservation.description,

      // Status Styles
      statusText: statusStyle.text,
      statusBg: statusStyle.bg,
      statusColor: statusStyle.color,

      // Formatting
      dateFormatted: dateStr,
      timeFormatted: timeStr,

      // Location
      address: reservation.location?.street || "Dirección no disponible",

      // Financials (Add fallbacks/safe access)
      priceService: reservation.financials?.priceEstimated || 0,
      platformFee: reservation.financials?.platformFee || 0,
      totalAmount:
        reservation.financials?.priceFinal ||
        (reservation.financials?.priceEstimated || 0) +
          (reservation.financials?.platformFee || 0),

      showContact: uiStatus === "in_progress" || uiStatus === "confirmed",
    };
  }, [reservation]);

  // 3. Loading State
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <MiniLoaderScreen />
      </View>
    );
  }

  // 4. Error State
  if (error || !displayData) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorTitle}>Error al cargar</Text>
        <Text style={styles.errorText}>
          No pudimos encontrar la información de esta reserva.
        </Text>
        <LargeButton title="Volver" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Detalles del Trabajo" showBackButton={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} />
        }>
        {/* SECTION 1: Client Info & Status */}
        <ReservationDetailsCard
          type="professional"
          name={displayData.clientName}
          avatar={displayData.clientAvatar}
          statusText={displayData.statusText}
          statusBg={displayData.statusBg}
          statusColor={displayData.statusColor}
        />
        {/* SECTION 2: Work title */}
        <ReservationDetailsCard type="title" title={displayData.serviceTitle} />

        {/* SECTION 2: Date & Time */}
        <ReservationDetailsCard
          type="date"
          date={displayData.dateFormatted}
          time={displayData.timeFormatted}
        />

        {/* SECTION 3: Location */}
        <ReservationDetailsCard
          type="location"
          location={displayData.address}
          // Optional: Add onPress to open maps if supported in your Card
          onPress={() => console.log("Open Maps Logic")}
        />

        {/* SECTION 4: Description (Context) */}
        {displayData.description ? (
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionHeader}>Nota del cliente</Text>
            <Text style={styles.descriptionText}>
              {displayData.description}
            </Text>
          </View>
        ) : null}

        {/* SECTION 5: Payment Details */}
        <ReservationDetailsCard
          type="payment"
          priceService={`$${displayData.priceService.toLocaleString("es-AR")}`}
          platformFee={`$${displayData.platformFee.toLocaleString("es-AR")}`}
          totalAmount={`$${displayData.totalAmount.toLocaleString("es-AR")}`}
        />

        {/* Actions */}
        {displayData.showContact && (
          <View style={styles.footerAction}>
            <LargeButton
              title="Contactar Cliente"
              iconName="chatbubble-outline"
              onPress={() => console.log("Navigate to Chat")}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default ReservationsDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white", // Matches the clean look
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
  loadingText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 16,
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
  // Description Box Styles
  descriptionContainer: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 14, // Consistent with Card radius
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
  descriptionText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  footerAction: {
    marginTop: 20,
  },
});
