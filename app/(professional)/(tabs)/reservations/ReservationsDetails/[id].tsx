import React from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Text,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// Components
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import ReservationDetailsCard from "@/appSRC/reservations/Screens/Client/ReservationDetailsCard"; // Reutilizamos la misma Card
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";
import { useReservationDetail } from "@/appSRC/reservations/Hooks/useClientReservationDetail";
import { COLORS } from "@/appASSETS/theme";

// ✅ HOOK UNIFICADO (El mismo que usa el Cliente)

const ReservationsDetailsScreen = () => {
  const { id } = useLocalSearchParams();
  const reservationId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();

  // 1. Data Fetching UNIFICADO
  // Simplemente le decimos: "Soy un profesional"
  const { displayData, isLoading, isError, refetch } = useReservationDetail(
    reservationId,
    "professional"
  );

  // 2. Loading State
  if (isLoading) {
    return <MiniLoaderScreen />;
  }

  // 3. Error State
  if (isError || !displayData) {
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

  // Desestructuramos para limpieza en el JSX
  const { header, service, time, location, finance, actions } = displayData;

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Detalles del Trabajo" showBackButton={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }>
        {/* SECCIÓN 1: Info del CLIENTE (El hook ya trajo el avatar/nombre del cliente) */}
        <ReservationDetailsCard
          type="identity" // Mantenemos el tipo visual
          viewRole="professional"
          name={header.title} // Aquí vendrá el nombre del Cliente
          avatar={header.avatar}
          statusText={header.status.text}
          statusBg={header.status.bg}
          statusColor={header.status.color}
        />

        {/* SECCIÓN 2: Título del Servicio */}
        <ReservationDetailsCard type="title" title={service.title} />

        {/* SECCIÓN 3: Fecha y Hora (Ya corregido por TimeEngine) */}
        <ReservationDetailsCard
          type="date"
          date={time.dateString}
          time={time.timeString}
        />

        {/* SECCIÓN 4: Ubicación */}
        <ReservationDetailsCard
          type="location"
          location={location}
          onPress={() => console.log("Abrir mapa...")}
        />

        {/* SECCIÓN 5: Descripción */}
        {service.description ? (
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionHeader}>Nota del cliente</Text>
            <Text style={styles.descriptionText}>
              {/* Nota: En el hook unificado quizás quieras ajustar qué descripción mostramos */}
              {service.description}
            </Text>
          </View>
        ) : null}

        {/* SECCIÓN 6: Desglose de Pago */}
        <ReservationDetailsCard
          type="payment"
          priceService={finance.service}
          platformFee={finance.fee}
          totalAmount={finance.total}
        />

        {/* ACCIONES */}
        <View style={styles.footerAction}>
          {actions.canChat && (
            <LargeButton
              title="Contactar Cliente"
              iconName="chatbubble-outline"
              onPress={() => console.log("Ir al chat con", header.title)}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default ReservationsDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
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
    // Sombras sutiles
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9CA3AF",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  footerAction: {
    marginTop: 10,
    gap: 12,
  },
});
