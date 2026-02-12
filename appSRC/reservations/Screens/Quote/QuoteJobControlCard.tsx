import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { BaseCard } from "@/appCOMP/cards/BaseCard";
import { Reservation } from "@/appSRC/reservations/Type/ReservationType";
import { COLORS } from "@/appASSETS/theme";
import { updateReservationStatusService } from "@/appSRC/reservations/Service/ReservationService";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { getStatusConfig } from "@/appSRC/reservations/Helper/MapStatusToUIClient";
import { createNotification } from "@/appSRC/notifications/Service/NotificationCrudService";

interface Props {
  job: Reservation;
  onJobCompleted: () => void;
}

/**
 * Tarjeta de control específica para trabajos de Agenda (Quote).
 * Flujo simplificado: "in_progress" y luego "completed".
 */
export const QuoteJobControlCard = ({ job, onJobCompleted }: Props) => {
  const { user } = useAuthStore();
  const clientName = job.roleName || "Cliente";

  const handleNextStep = async () => {
    if (!user) return;

    // ✅ LÓGICA DE FILTRADO: MÁQUINA DE ESTADOS (Quote Flow)
    let nextStatus: "in_progress" | "completed" = "in_progress";

    // Si está confirmado (o por error en ruta), el siguiente paso es directo a la ejecución
    if (job.statusDTO === "confirmed" || job.statusDTO === "on_route") {
      nextStatus = "in_progress";
    } else if (job.statusDTO === "in_progress") {
      nextStatus = "completed";
    } else {
      return; // Otros estados (cancelados/finalizados) no accionan nada
    }

    try {
      await updateReservationStatusService(job.id, user.uid, nextStatus);

      // Side-effect: Notificar al cliente del cambio de estado (fire & forget)
      const notificationMap = {
        in_progress: {
          title: "Trabajo iniciado",
          body: "El profesional comenzó el servicio agendado.",
          type: "reservation_accepted" as const,
        },
        completed: {
          title: "Trabajo finalizado",
          body: "El profesional completó el servicio agendado.",
          type: "reservation_completed" as const,
        },
      };

      const notif = notificationMap[nextStatus];
      createNotification({
        user_id: job.roleId,
        title: notif.title,
        body: notif.body,
        type: notif.type,
        data: { reservation_id: job.id, screen: "/(client)/(tabs)/reservations" },
      });

      onJobCompleted();
    } catch (e) {
      console.error("[QuoteControl] Error:", e);
      alert("No se pudo actualizar el progreso del trabajo.");
    }
  };

  const statusInfo = getStatusConfig(job.statusUI);

  return (
    <BaseCard style={styles.cardContainer}>
      {/* Header: Cliente y Estado actual */}
      <View style={styles.header}>
        <View style={styles.clientRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {clientName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.clientName}>{clientName}</Text>
            <Text style={styles.clientLabel}>Trabajo Agendado</Text>
          </View>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.text}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Footer: Acción basada en el estado simplificado */}
      <View style={styles.footer}>
        <LargeButton
          title={
            job.statusDTO === "confirmed" || job.statusDTO === "on_route"
              ? "COMENZAR TRABAJO"
              : "FINALIZAR TRABAJO"
          }
          onPress={handleNextStep}
          backgroundColor={COLORS.primary}
        />
      </View>
    </BaseCard>
  );
};

const styles = StyleSheet.create({
  cardContainer: { padding: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  clientRow: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.textSecondary + "30",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: "bold", color: COLORS.primary },
  clientName: { fontSize: 16, fontWeight: "bold", color: COLORS.textPrimary },
  clientLabel: { fontSize: 12, color: COLORS.textSecondary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#F0F0F0", marginVertical: 12 },
  body: { marginBottom: 20 },
  infoRow: { flexDirection: "row", alignItems: "center" },
  icon: { marginRight: 12 },
  infoLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 },
  addressText: { fontSize: 15, fontWeight: "500", color: COLORS.textPrimary },
  footer: { marginTop: 4 },
});
