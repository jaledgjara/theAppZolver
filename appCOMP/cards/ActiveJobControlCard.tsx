import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { BaseCard } from "@/appCOMP/cards/BaseCard"; // Usamos BaseCard para consistencia
import { Reservation } from "@/appSRC/reservations/Type/ReservationType";
import { COLORS } from "@/appASSETS/theme";
import { updateReservationStatusService } from "@/appSRC/reservations/Service/ReservationService";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { getStatusConfig } from "@/appSRC/reservations/Helper/MapStatusToUIClient";

interface Props {
  job: Reservation;
  onJobCompleted: () => void;
}

export const ActiveJobControlCard = ({ job, onJobCompleted }: Props) => {
  const { user } = useAuthStore();

  // --- LOG CRÍTICO AQUÍ ---
  console.log("🃏 [CARD UI] Recibiendo Job ID:", job.id);
  console.log(
    "👤 [CARD UI] Objeto Client completo:",
    JSON.stringify(job.client, null, 2)
  );
  console.log(
    "🏷️ [CARD UI] Intentando leer legalName:",
    job.client?.legal_name
  );
  // Aseguramos que haya un nombre o usamos un fallback
  const clientName = job.client?.legal_name || "Cliente";

  const handleNextStep = async () => {
    if (!user) return;

    let nextStatus: "on_route" | "in_progress" | "completed" = "on_route";
    if (job.status === "confirmed") nextStatus = "on_route";
    else if (job.status === "on_route") nextStatus = "in_progress";
    else if (job.status === "in_progress") nextStatus = "completed";

    try {
      await updateReservationStatusService(job.id, user.uid, nextStatus);
      onJobCompleted();
    } catch (e) {
      console.error(e);
      alert("Error actualizando estado");
    }
  };

  const statusInfo = getStatusConfig(job.status);

  return (
    <BaseCard style={styles.cardContainer}>
      {/* --- Header: Cliente y Estado --- */}
      <View style={styles.header}>
        <View style={styles.clientRow}>
          {/* Avatar Placeholder con Inicial */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {clientName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.clientName}>{clientName}</Text>
            <Text style={styles.clientLabel}>Cliente</Text>
          </View>
        </View>

        {/* Badge de Estado */}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusInfo.color + "20" },
          ]}>
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.text}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* --- Body: Dirección --- */}
      <View style={styles.body}>
        <View style={styles.infoRow}>
          <Ionicons
            name="location"
            size={20}
            color={COLORS.primary}
            style={styles.icon}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>Ubicación del servicio</Text>
            <Text style={styles.addressText} numberOfLines={2}>
              {job.location.street}
            </Text>
          </View>
        </View>
      </View>

      {/* --- Footer: Botón de Acción --- */}
      <View style={styles.footer}>
        <LargeButton
          title={
            job.status === "confirmed"
              ? "INICIAR RUTA"
              : job.status === "on_route"
              ? "LLEGUÉ AL LUGAR"
              : "FINALIZAR TRABAJO"
          }
          onPress={handleNextStep}
          style={{ backgroundColor: COLORS.primary, width: "100%" }}
        />
      </View>
    </BaseCard>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.textSecondary + "30", // Un tono suave del secundario
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary || "#000",
  },
  clientLabel: {
    fontSize: 12,
    color: COLORS.textSecondary || "#666",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 12,
  },
  body: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary || "#888",
    marginBottom: 2,
  },
  addressText: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.textPrimary || "#333",
  },
  footer: {
    marginTop: 4,
  },
});
