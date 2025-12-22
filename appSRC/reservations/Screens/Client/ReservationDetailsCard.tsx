import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { BaseCard } from "@/appCOMP/cards/BaseCard";

export interface ReservationDetailCardProps {
  type: "professional" | "date" | "location" | "payment";
  name?: string;
  service?: string;
  avatar?: any;
  statusText?: string;
  statusBg?: string;
  statusColor?: string;
  date?: string;
  time?: string;
  location?: string;
  priceService?: string;
  platformFee?: string;
  totalAmount?: string;
  onPress?: () => void;
}

export const ReservationDetailsCard: React.FC<ReservationDetailCardProps> = ({
  type,
  name,
  service,
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
      {/* PROFESSIONAL: Layout Refactorizado -> Avatar | Columna(Info + Badge) */}
      {type === "professional" && (
        <View style={styles.professionalRow}>
          <Image source={avatar} style={styles.avatar} />

          <View style={styles.infoColumn}>
            {/* Bloque de Texto */}
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.service} numberOfLines={1}>
              {service}
            </Text>

            {/* Status Badge: Ahora debajo del texto, alineado al inicio */}
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
    flex: 1, // Toma todo el ancho restante
    justifyContent: "center",
    paddingTop: 2, // Ajuste fino visual para alinear con el top del avatar
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
    marginRight: 4,
  },
  service: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8, // Espacio entre el servicio y el badge
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: "flex-start", // CLAVE: Se ajusta al contenido a la izquierda
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
