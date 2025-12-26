import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "@/appASSETS/theme";
import { BudgetMessage } from "../Type/MessageType";
import { mapStatusToUI } from "@/appSRC/reservations/Helper/MapStatusToUIClient";

export interface Props {
  message: BudgetMessage;
  onPress?: () => void;
}

export const ChatBudgetCard = ({ message, onPress }: Props) => {
  const { data, isMine } = message;

  if (!data) return null;
  const { serviceName, price, currency, proposedDate, status, notes } = data;

  // Helper visual
  const uiState = mapStatusToUI(status);
  const dateObj = new Date(proposedDate);

  // ✅ CRÍTICO: El botón solo aparece si el estado es EXACTAMENTE 'pending_approval'
  // Si el backend actualizó a 'confirmed', esto será false y el botón desaparecerá.
  const showActionButtons = status === "pending_approval";

  return (
    <View
      style={[
        styles.wrapper,
        isMine ? styles.wrapperMine : styles.wrapperOther,
      ]}>
      {/* Header con color dinámico */}
      <View style={[styles.header, { borderLeftColor: uiState.color }]}>
        <View style={styles.headerTopRow}>
          <Text style={[styles.statusText, { color: uiState.color }]}>
            {/* Asegúrate de usar .label o .text según tu helper */}
            {uiState.label?.toUpperCase() || uiState.text?.toUpperCase()}
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

      {/* Footer Accionable - Desaparece al confirmar */}
      {showActionButtons && onPress && (
        <Pressable
          style={styles.footer}
          onPress={onPress}
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
