import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, FONTS } from "@/appASSETS/theme"; // Asumiendo que tienes estas definiciones
import { BudgetMessage } from "../Type/MessageType";

interface Props {
  message: BudgetMessage;
  onPress?: () => void;
}

export const ChatBudgetCard = ({ message, onPress }: Props) => {
  const { data, isMine, createdAt } = message;
  const { serviceName, price, currency, proposedDate, status, notes } = data;

  // 1. Helper para colores según estado
  const getStatusColor = () => {
    switch (status) {
      case "accepted":
        return "#10B981"; // Verde
      case "rejected":
        return "#EF4444"; // Rojo
      case "expired":
        return "#9CA3AF"; // Gris
      case "pending":
      default:
        return "#F59E0B"; // Amarillo/Naranja
    }
  };

  const statusColor = getStatusColor();

  // 2. Formateo de Fecha (Nativo JS)
  const dateObj = new Date(proposedDate);
  const formattedDate = dateObj.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const formattedTime = dateObj.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View
      style={[
        styles.wrapper,
        isMine ? styles.wrapperMine : styles.wrapperOther,
      ]}>
      {/* --- HEADER: Estado y Título --- */}
      <View style={[styles.header, { borderLeftColor: statusColor }]}>
        <View style={styles.headerTopRow}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + "20" },
            ]}>
            <View
              style={[styles.statusDot, { backgroundColor: statusColor }]}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {status === "pending" ? "Pendiente" : status.toUpperCase()}
            </Text>
          </View>
          {/* Icono decorativo */}
          <MaterialCommunityIcons
            name="file-document-outline"
            size={18}
            color={COLORS.textSecondary}
          />
        </View>

        <Text style={styles.serviceName} numberOfLines={1}>
          {serviceName}
        </Text>
      </View>

      {/* --- BODY: Precio y Fecha --- */}
      <View style={styles.body}>
        {/* Precio Gigante */}
        <Text style={styles.price}>
          {currency}{" "}
          <Text style={styles.priceValue}>{price.toLocaleString()}</Text>
        </Text>

        {/* Fila de Fecha */}
        <View style={styles.row}>
          <MaterialCommunityIcons
            name="calendar-clock"
            size={16}
            color={COLORS.textSecondary}
          />
          <Text style={styles.dateText}>
            {formattedDate} • {formattedTime} hs
          </Text>
        </View>

        {/* Notas (Si existen) - Limitado a 2 lineas */}
        {notes && (
          <Text style={styles.notes} numberOfLines={2}>
            "{notes}"
          </Text>
        )}
      </View>

      {/* --- FOOTER: Botón de Acción --- */}
      <Pressable
        style={styles.footer}
        onPress={onPress}
        android_ripple={{ color: "#EEE" }}>
        <Text style={styles.footerText}>Ver Detalles del Presupuesto</Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={COLORS.primary}
        />
      </Pressable>

      {/* Timestamp del mensaje (afuera de la tarjeta) */}
      <Text style={styles.msgTime}>
        {new Date(createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "80%", // Un poco más ancho para que quepa la info
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: "white",
    elevation: 2, // Sombra Android
    shadowColor: "#000", // Sombra iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: "hidden",
  },
  wrapperMine: { alignSelf: "flex-end", marginRight: 4 },
  wrapperOther: { alignSelf: "flex-start", marginLeft: 4 },

  header: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    borderLeftWidth: 4, // Borde de color lateral indicador de estado
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937", // Gray 800
  },

  body: {
    padding: 12,
  },
  price: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontWeight: "600",
  },
  priceValue: {
    fontSize: 24,
    color: "#1F2937",
    fontWeight: "800",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  dateText: {
    fontSize: 14,
    color: "#4B5563", // Gray 600
  },
  notes: {
    fontSize: 12,
    color: "#6B7280", // Gray 500
    fontStyle: "italic",
    marginTop: 4,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F9FAFB", // Gray 50
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  footerText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },

  msgTime: {
    fontSize: 10,
    color: "#9CA3AF",
    position: "absolute",
    bottom: -18,
    right: 0,
  },
});
