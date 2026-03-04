import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { COLORS } from "@/appASSETS/theme";
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";
import ReservationDetailsCard from "@/appSRC/reservations/Screens/Client/ReservationDetailsCard";

import { Reservation } from "@/appSRC/reservations/Type/ReservationType";
import { useMapNavigation } from "@/appSRC/maps/Hooks/openMapMenu";

interface InstantRequestDetailScreenProps {
  reservation: Reservation;
  isLoading: boolean;
  isAccepting: boolean;
  isRejecting: boolean;
  onAccept: () => void;
  onReject: () => void;
}

const InstantRequestDetailScreen: React.FC<InstantRequestDetailScreenProps> = ({
  reservation,
  isLoading,
  isAccepting,
  isRejecting,
  onAccept,
  onReject,
}) => {
  const { handleOpenMap } = useMapNavigation(reservation.address);

  const displayData = useMemo(() => {
    const dateObj = reservation.scheduledStart || reservation.createdAt;

    return {
      clientName: reservation.roleName,
      serviceTitle: reservation.serviceTitle,
      description: reservation.description,
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
    };
  }, [reservation]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <MiniLoaderScreen />
      </View>
    );
  }

  const handleRejectPress = () => {
    Alert.alert(
      "Rechazar solicitud",
      "El cliente recibirá un reembolso automático. ¿Confirmar?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Rechazar", style: "destructive", onPress: onReject },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Detalle de Solicitud" showBackButton={true} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ReservationDetailsCard
          type="identity"
          name={displayData.clientName}
          statusText="Pendiente"
          statusBg="#FEF3C7"
          statusColor="#F59E0B"
          viewRole="professional"
        />

        <ReservationDetailsCard
          type="title"
          title={displayData.serviceTitle}
        />

        <ReservationDetailsCard
          type="date"
          date={displayData.dateFormatted}
          time={displayData.timeFormatted}
          viewRole="professional"
        />

        <ReservationDetailsCard
          type="location"
          location={displayData.address}
        />

        {/* Nota del cliente */}
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

        {/* Ver en Mapa */}
        <View style={styles.mapButtonContainer}>
          <LargeButton
            title="Ver en Mapa"
            onPress={() => handleOpenMap(reservation.address)}
            iconName="map-outline"
            backgroundColor={COLORS.tertiary}
            style={{ marginVertical: 10 }}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={handleRejectPress}
            disabled={isRejecting || isAccepting}
            activeOpacity={0.7}>
            <Ionicons name="close-circle-outline" size={20} color={COLORS.error} />
            <Text style={styles.rejectText}>Rechazar</Text>
          </TouchableOpacity>

          <View style={styles.acceptButtonWrapper}>
            <LargeButton
              title="Aceptar Trabajo"
              onPress={onAccept}
              loading={isAccepting}
              disabled={isRejecting || isAccepting}
              style={{ marginVertical: 0 }}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default InstantRequestDetailScreen;

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
  mapButtonContainer: { marginTop: 8 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: COLORS.error,
    gap: 6,
  },
  rejectText: {
    color: COLORS.error,
    fontWeight: "600",
    fontSize: 16,
  },
  acceptButtonWrapper: {
    flex: 2,
  },
});
