import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { BaseCard } from "@/appCOMP/cards/BaseCard";
import { COLORS } from "@/appASSETS/theme";

export interface ReservationDetailCardProps {
  type: "professional" | "date" | "location" | "payment" | "title";

  // Professional & Title
  name?: string;
  title?: string; // Prop para el título del servicio
  avatar?: any;
  statusText?: string;
  statusBg?: string;
  statusColor?: string;

  // Date
  date?: string;
  time?: string;

  // Location
  location?: string;

  // Payment
  priceService?: string;
  platformFee?: string;
  totalAmount?: string;

  // Actions
  onPress?: () => void;
}

export const ReservationDetailsCard: React.FC<ReservationDetailCardProps> = ({
  type,
  name,
  title,
  avatar,
  date,
  time,
  location,
  priceService,
  platformFee,
  totalAmount,
  statusText,
  statusBg,
  statusColor,
  onPress,
}) => {
  return (
    <BaseCard onPress={onPress}>
      {/* --- NUEVO: TITLE CARD --- */}
      {type === "title" && (
        <View>
          <Text style={styles.labelTitle}>Servicio solicitado</Text>
          <Text style={styles.mainTitle}>{title}</Text>
        </View>
      )}

      {/* PROFESSIONAL: Layout Refactorizado */}
      {type === "professional" && (
        <View style={styles.professionalRow}>
          <Image source={avatar} style={styles.avatar} />

          <View style={styles.infoColumn}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>

            {statusText && (
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusBg || "#F3F4F6" },
                ]}>
                <Text
                  style={[styles.statusText, { color: statusColor || "#333" }]}>
                  {statusText}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* DATE & TIME */}
      {type === "date" && (
        <View>
          <View style={styles.iconRow}>
            <FontAwesome name="calendar" size={20} color="#333" />
            <Text style={styles.rowText}>{date}</Text>
          </View>
          {time && (
            <View style={styles.iconRow}>
              <FontAwesome5 name="clock" size={20} color="#333" />
              <Text style={styles.rowText}>{time}</Text>
            </View>
          )}
        </View>
      )}

      {/* LOCATION */}
      {type === "location" && (
        <View style={styles.iconRow}>
          <Entypo name="location" size={22} color="#333" />
          <Text style={[styles.rowText, { flex: 1 }]} numberOfLines={2}>
            {location}
          </Text>
        </View>
      )}

      {/* PAYMENT */}
      {type === "payment" && (
        <View>
          <Text style={styles.paymentTitle}>Detalle del Pago</Text>
          <View style={styles.paymentRowContainer}>
            <Text style={styles.paymentLabel}>Costo del servicio</Text>
            <Text style={styles.paymentValue}>{priceService}</Text>
          </View>
          <View style={styles.paymentRowContainer}>
            <Text style={styles.paymentLabel}>Comisión</Text>
            <Text style={styles.paymentValue}>{platformFee}</Text>
          </View>
          <View style={[styles.paymentRowContainer, styles.totalRow]}>
            <Text style={styles.paymentTotalLabel}>Total</Text>
            <Text style={styles.paymentTotalValue}>{totalAmount}</Text>
          </View>
        </View>
      )}
    </BaseCard>
  );
};

export default ReservationDetailsCard;

const styles = StyleSheet.create({
  // --- Title Card Styles (Integrado) ---
  labelTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 2,
    marginRight: 4,
  },
  mainTitle: {
    fontSize: 14,
    color: "#666",
  },

  // --- Professional Layout ---
  professionalRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 14,
    backgroundColor: "#F3F4F6",
  },
  infoColumn: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 10,
    marginRight: 4,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  // --- Common & Other Types ---
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  rowText: {
    marginLeft: 12,
    fontSize: 15,
    color: "#374151",
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    color: "#111",
  },
  paymentRowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  paymentLabel: {
    fontSize: 14,
    color: "#666",
  },
  paymentValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  paymentTotalLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
  },
  paymentTotalValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
  },
});
