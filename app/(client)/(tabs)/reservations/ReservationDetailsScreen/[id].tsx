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
import { COLORS } from "@/appASSETS/theme";

const ReservationDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const reservationId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();

  const { displayData, isLoading, isError, refetch } = useReservationDetail(
    reservationId,
    "client"
  );

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
          type="professional" // Podríamos renombrar esta prop a "profile" en el componente base
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

        {/* 6. Acciones Dinámicas */}
        <View style={styles.footerAction}>
          {actions.canChat && (
            <LargeButton
              title={`Chat con ${header.title}`}
              iconName="chatbubble-outline"
              onPress={() => console.log("Navegar a Chat", displayData.raw.id)}
            />
          )}

          {/* Ejemplo de extensibilidad futura */}
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
