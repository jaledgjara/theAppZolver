import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";


export interface ReservationDetailCardProps {
  type: 'professional' | 'date' | 'location' | 'payment';

  // Professional card
  name?: string;
  service?: string;
  avatar?: any;
  statusText?: string;
  statusBg?: string;
  statusColor?: string;

  // Date card
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
      
      {/* PROFESSIONAL */}
      {type === "professional" && (
        <View style={styles.row}>
          <Image source={avatar} style={styles.avatar} />
          <View>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.service}>{service}</Text>
          </View>

          {statusText && (
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <Text style={{ color: statusColor, fontWeight: "600" }}>
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

          <Text style={styles.paymentRow}>Costo del servicio: {priceService}</Text>
          <Text style={styles.paymentRow}>Comisión: {platformFee}</Text>

          <Text style={styles.paymentTotal}>Total: {totalAmount}</Text>
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
    marginHorizontal: 18,
    marginTop: 12,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  service: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  rowText: {
    marginLeft: 12,
    fontSize: 15,
    color: "#333",
  },
  statusBadge: {
    marginLeft: "auto",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  paymentTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10,
    color: "#333",
  },
  paymentRow: {
    fontSize: 15,
    color: "#555",
    marginBottom: 4,
  },
  paymentTotal: {
    fontSize: 17,
    fontWeight: "800",
    color: "#000",
    marginTop: 12,
  },
});
