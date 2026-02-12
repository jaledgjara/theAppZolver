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

export const ActiveJobControlCard = ({ job, onJobCompleted }: Props) => {
  const { user } = useAuthStore();

  // ✅ 1. Nombre directo (El Mapper ya decidió quién es)
  const clientName = job.roleName || "Cliente";

  const handleNextStep = async () => {
    if (!user) return;

    // ✅ 2. Usamos 'statusDTO' para la lógica de negocio (Maquina de estados)
    let nextStatus: "on_route" | "in_progress" | "completed" = "on_route";

    if (job.statusDTO === "confirmed") nextStatus = "on_route";
    else if (job.statusDTO === "on_route") nextStatus = "in_progress";
    else if (job.statusDTO === "in_progress") nextStatus = "completed";

    try {
      await updateReservationStatusService(job.id, user.uid, nextStatus);

      // Side-effect: Notificar al cliente del cambio de estado (fire & forget)
      const notificationMap = {
        on_route: {
          title: "Profesional en camino",
          body: "El profesional salió hacia tu ubicación.",
          type: "reservation_accepted" as const,
        },
        in_progress: {
          title: "Servicio iniciado",
          body: "El profesional llegó y comenzó el trabajo.",
          type: "reservation_accepted" as const,
        },
        completed: {
          title: "Servicio finalizado",
          body: "El profesional completó el trabajo.",
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
      console.error(e);
      alert("Error actualizando estado");
    }
  };

  // ✅ 3. Usamos 'statusUI' para la configuración visual (Colores)
  const statusInfo = getStatusConfig(job.statusUI);

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
            { backgroundColor: statusInfo.bg }, // Usamos .bg del config
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
            {/* ✅ 4. Usamos 'address' directa */}
            <Text style={styles.addressText} numberOfLines={2}>
              {job.address}
            </Text>
          </View>
        </View>
      </View>

      {/* --- Footer: Botón de Acción --- */}
      <View style={styles.footer}>
        {/* ✅ 5. Lógica de botón basada en DTO */}
        <LargeButton
          title={
            job.statusDTO === "confirmed"
              ? "INICIAR RUTA"
              : job.statusDTO === "on_route"
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
    backgroundColor: COLORS.textSecondary + "30",
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
