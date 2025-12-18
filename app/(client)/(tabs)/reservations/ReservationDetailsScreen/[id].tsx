import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons"; // Iconos estándar

// Components
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { ReservationDetailsCard } from "@/appSRC/reservations/Screens/Client/ReservationDetailsCard"; // Usamos tu componente modular
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { useReservationDetail } from "@/appSRC/reservations/Hooks/useClientReservationDetail";
import {
  getStatusConfig,
  mapStatusToUI,
} from "@/appSRC/reservations/Helper/MapStatusToUIClient";
import { BudgetPayload } from "@/appSRC/messages/Type/MessageType";

// Helper de colores para status (Consistente con la Card)

const ReservationDetailScreen = () => {
  const { id, conversationId } = useLocalSearchParams();
  const reservationId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();

  // 1. Data Fetching
  const { reservation, isLoading, isError, refetch } =
    useReservationDetail(reservationId);

  const handleBudgetPress = (payload: BudgetPayload, messageId: string) => {
    if (payload.status !== "pending") return;

    router.push({
      pathname: "/(client)/(tabs)/reservations/ConfirmBudgetScreen",
      params: {
        professionalId: id,
        budgetPrice: payload.price.toString(),
        budgetTitle: payload.serviceName,
        budgetNotes: payload.notes || "",
        messageId: messageId,
        conversationId: conversationId,
      },
    });
  };

  // 2. Loading State
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Cargando detalle...</Text>
      </View>
    );
  }

  // 3. Error State
  if (isError || !reservation) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorTitle}>Error al cargar</Text>
        <Text style={styles.errorText}>No pudimos encontrar esta reserva.</Text>
        <LargeButton title="Volver" onPress={() => router.back()} />
      </View>
    );
  }

  // 4. Data Preparation
  const statusUI = mapStatusToUI(reservation.status);
  const statusStyle = getStatusConfig(statusUI);

  // Precios (Calculados o Estimados)
  const priceService = reservation.financials.priceEstimated || 0;
  const platformFee = reservation.financials.platformFee || 0;
  const totalAmount =
    reservation.financials.priceFinal || priceService + platformFee;

  // Formato de Fechas
  const dateObj = new Date(reservation.schedule.startDate);
  const dateStr = dateObj.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = dateObj.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

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
          // TODO: Mapear nombre real cuando el backend lo envíe
          name="Profesional Zolver"
          service={reservation.title} // Usamos 'title' como nombre del servicio
          avatar={require("@/appASSETS/RawImages/avatar-0.jpg")} // Placeholder por ahora
          statusText={statusStyle.text}
          statusBg={statusStyle.bg}
          statusColor={statusStyle.color}
        />

        {/* SECCIÓN 2: Fecha y Hora */}
        <ReservationDetailsCard
          type="date"
          date={dateStr} // "Lunes, 15 de Diciembre de 2024"
          time={`${timeStr} hs`}
        />

        {/* SECCIÓN 3: Ubicación */}
        <ReservationDetailsCard
          type="location"
          location={reservation.location.street}
        />

        {/* SECCIÓN 4: Descripción (Si existe) - "Yes or no? YES, context is key" */}
        {reservation.description ? (
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionHeader}>Nota del servicio</Text>
            <Text style={styles.descriptionText}>
              {reservation.description}
            </Text>
          </View>
        ) : null}

        {/* SECCIÓN 5: Desglose de Pago */}
        <ReservationDetailsCard
          type="payment"
          priceService={`$${priceService.toLocaleString("es-AR")}`}
          platformFee={`$${platformFee.toLocaleString("es-AR")}`}
          totalAmount={`$${totalAmount.toLocaleString("es-AR")}`}
        />
      </ScrollView>

      {/* FOOTER: Acciones (Solo visible si está activa/completada) */}
      <View style={styles.footer}>
        {statusUI === "in_progress" || statusUI === "confirmed" ? (
          <LargeButton
            title="Contactar Profesional"
            iconName="chatbubble-outline" // Icono de chat
            onPress={() => console.log("Ir al chat")} // Futura implementación
          />
        ) : null}
      </View>
    </View>
  );
};

export default ReservationDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA", // Fondo consistente con la lista
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Espacio para el footer
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
  // Estilos específicos para la descripción
  descriptionContainer: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    // Sombra suave (Elevation)
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
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
});
