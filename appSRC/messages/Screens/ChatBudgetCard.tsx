import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "@/appASSETS/theme";
import { BudgetMessage } from "../Type/MessageType";

export interface Props {
  message: BudgetMessage;
  onPress?: () => void; // El padre nos pasará la función de navegación
}

export const ChatBudgetCard = ({ message, onPress }: Props) => {
  const { data, isMine } = message;
  const { serviceName, price, currency, proposedDate, status, notes } = data;

  // 1. Helper para colores
  const getStatusColor = () => {
    switch (status) {
      case "accepted":
        return "#10B981";
      case "rejected":
        return "#EF4444";
      case "expired":
        return "#9CA3AF";
      default:
        return "#F59E0B";
    }
  };

  const statusColor = getStatusColor();
  const dateObj = new Date(proposedDate);

  return (
    <View
      style={[
        styles.wrapper,
        isMine ? styles.wrapperMine : styles.wrapperOther,
      ]}>
      {/* Header */}
      <View style={[styles.header, { borderLeftColor: statusColor }]}>
        <View style={styles.headerTopRow}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {status === "pending" ? "PROPUESTA" : status.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.serviceName}>{serviceName}</Text>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.price}>
          {currency} {price.toLocaleString("es-AR")}
        </Text>
        <Text style={styles.dateText}>📅 {dateObj.toLocaleDateString()}</Text>
        {notes && (
          <Text style={styles.notes} numberOfLines={2}>
            "{notes}"
          </Text>
        )}
      </View>

      {/* Footer Accionable */}
      {/* Solo mostramos el botón si está pendiente y tenemos un onPress */}
      {status === "pending" && onPress && (
        <Pressable
          style={styles.footer}
          onPress={onPress} // <--- AQUÍ SE EJECUTA LA MAGIA QUE VIENE DEL PADRE
          android_ripple={{ color: "#EEE" }}>
          <Text style={styles.footerText}>Ver y Aceptar Presupuesto</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={COLORS.primary}
          />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "80%",
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: "white",
    elevation: 2,
    overflow: "hidden",
  },
  wrapperMine: { alignSelf: "flex-end", marginRight: 4 },
  wrapperOther: { alignSelf: "flex-start", marginLeft: 4 },
  header: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
    borderLeftWidth: 4,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  statusText: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  serviceName: { fontSize: 16, fontWeight: "bold", color: "#1F2937" },
  body: { padding: 12 },
  price: { fontSize: 24, fontWeight: "800", color: "#1F2937" },
  dateText: { fontSize: 13, color: "#6B7280", marginVertical: 4 },
  notes: { fontSize: 12, fontStyle: "italic", color: "#6B7280" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderTopWidth: 1,
    borderColor: "#EEE",
  },
  footerText: { color: COLORS.primary, fontWeight: "600" },
});
