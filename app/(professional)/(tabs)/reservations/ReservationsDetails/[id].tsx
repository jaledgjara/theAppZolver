// app/(professional)/(tabs)/reservations/ReservationDetails/[id].tsx

import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { COLORS, SIZES } from "@/appASSETS/theme";
import { format, isValid } from "date-fns"; // Importamos isValid para seguridad
import { es } from "date-fns/locale";

// Componentes
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { CalendarReservationCard } from "@/appCOMP/cards/CalendarReservationCard";
import { ReservationLocationActions } from "@/appCOMP/maps/ReservationLocationActions";
import DescriptionCard from "@/appCOMP/cards/DescriptionCard";
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";
import StatusPlaceholder from "@/appCOMP/contentStates/StatusPlaceholder";

// Hooks & Utils
import { useReservationDetailsForProfessional } from "@/appSRC/reservations/Hooks/useReservationDetailsForProfessional";
import { mapStatusToUI } from "@/appSRC/reservations/Helper/MapStatusToUIClient";

const ReservationsDetailsScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { reservation, isLoading, error } =
    useReservationDetailsForProfessional(id);

  const displayData = useMemo(() => {
    if (!reservation) return null;

    // 1. OBTENER FECHA SEGURA (Desde la entidad ya mapeada)
    const rawDate = reservation.schedule?.startDate;
    const dateObj = rawDate instanceof Date ? rawDate : new Date();
    const safeDate = isValid(dateObj) ? dateObj : new Date();

    // 2. STATUS UI
    const uiStatus = mapStatusToUI(reservation.status);

    // 3. DATOS VISUALES
    return {
      clientName: reservation.client?.name || "Cliente",
      clientAvatar: reservation.client?.avatar,

      title: reservation.title || reservation.serviceCategory || "Servicio",
      description: reservation.description || "Sin descripción.",
      status: uiStatus,

      // Formateo seguro
      dateFormatted: format(safeDate, "dd - MM - yyyy", { locale: es }),
      timeFormatted: format(safeDate, "HH:mm", { locale: es }),

      // Ubicación (Ocultar si está cancelada)
      showLocation: uiStatus !== "canceled",
      address: reservation.location?.street || "Dirección no disponible",
      lat: reservation.location?.coordinates?.latitude || 0,
      lng: reservation.location?.coordinates?.longitude || 0,
    };
  }, [reservation]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <MiniLoaderScreen />
      </View>
    );
  }

  if (error || !displayData) {
    return (
      <View style={styles.container}>
        <ToolBarTitle titleText="Detalles" showBackButton={true} />
        <StatusPlaceholder
          title="No disponible"
          subtitle="No pudimos cargar la información."
          icon="alert-circle"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Detalles del trabajo" showBackButton={true} />

      <View style={styles.contentContainer}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* INFO PRINCIPAL */}
          <View style={styles.infoContainer}>
            <Text style={styles.titleTwo}>Información</Text>
            <CalendarReservationCard
              date={displayData.dateFormatted}
              time={displayData.timeFormatted}
              name={displayData.clientName}
              service={displayData.title}
              status={displayData.status}
              imageSource={
                displayData.clientAvatar
                  ? { uri: displayData.clientAvatar }
                  : undefined
              }
            />
          </View>

          {/* DESCRIPCIÓN */}
          <View style={styles.infoContainer}>
            <Text style={styles.titles}>Descripción</Text>
            <DescriptionCard description={displayData.description} />
          </View>

          {/* UBICACIÓN */}
          {displayData.showLocation ? (
            <View style={styles.infoContainer}>
              <Text style={styles.titles}>Ubicación</Text>
              <ReservationLocationActions
                address={displayData.address}
                latitude={displayData.lat}
                longitude={displayData.lng}
              />
            </View>
          ) : (
            <View style={styles.infoContainer}>
              <Text
                style={[
                  styles.titles,
                  { color: COLORS.textSecondary, fontSize: SIZES.body3 },
                ]}>
                Ubicación no disponible (Reserva Cancelada)
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default ReservationsDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 0,
    marginTop: 20,
  },
  titles: {
    fontSize: SIZES.h2,
    fontWeight: "600",
    color: COLORS.textSecondary,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  titleTwo: {
    fontSize: SIZES.h2,
    fontWeight: "600",
    color: COLORS.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 5,
  },
  infoContainer: {
    marginBottom: 20,
  },
});
