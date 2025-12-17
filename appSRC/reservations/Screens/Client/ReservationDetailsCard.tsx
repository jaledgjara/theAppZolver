import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

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
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
      {/* PROFESSIONAL: Layout Row [Avatar | Textos (Flex) | Badge] */}
      {type === "professional" && (
        <View style={styles.row}>
          <Image source={avatar} style={styles.avatar} />

          {/* Contenedor de texto con flex: 1 para ocupar espacio central */}
          <View style={styles.textContainer}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.service} numberOfLines={1}>
              {service}
            </Text>
          </View>

          {/* Badge fuera del contenedor de texto, alineado a la derecha */}
          {statusText && (
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusText}
              </Text>
            </View>
          )}
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
          <Text style={styles.rowText}>{location}</Text>
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
    </TouchableOpacity>
  );
};

export default ReservationDetailsCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    marginTop: 12,
    padding: 18,
    // Sombras suaves
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center", // Alineación vertical centrada
  },
  textContainer: {
    flex: 1, // CLAVE: Ocupa todo el espacio disponible entre Avatar y Badge
    marginRight: 8,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: "#F3F4F6",
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  service: {
    fontSize: 14,
    color: "#6B7280",
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
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
  // Estilos de Pago Mejorados
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
