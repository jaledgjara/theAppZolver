// appCOMP/cards/CalendarReservationCard.tsx
import { getStatusConfig } from "@/appSRC/reservations/Helper/MapStatusToUIClient";
// Importamos el tipo UI (simplificado), no el DTO
import { ReservationStatus as ReservationStatusUI } from "@/appCOMP/cards/ReservationCard";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";

interface CalendarReservationCardProps {
  time: string;
  name: string;
  service: string;
  // Aceptamos el status de UI ("confirmed", "canceled", etc.)
  status: ReservationStatusUI | string;
  date?: string;
  onPress?: () => void;
  imageSource?: any; // Añadido para soportar avatar
}

export const CalendarReservationCard: React.FC<
  CalendarReservationCardProps
> = ({ time, name, service, date, onPress, status, imageSource }) => {
  // Obtenemos colores y texto en español
  const s = getStatusConfig(status as string);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      disabled={!onPress}>
      <View style={styles.card}>
        <Text style={styles.time}>{time}</Text>

        <View style={styles.center}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.service}>{service}</Text>
          {date && <Text style={styles.date}>{date}</Text>}
        </View>

        {/* CORRECCIÓN: Usar s.bg para el fondo, s.color para el texto */}
        <View style={[styles.statusContainer, { backgroundColor: s.bg }]}>
          <Text style={[styles.statusText, { color: s.color }]}>{s.text}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginHorizontal: 20, // Ojo con esto si el contenedor padre ya tiene padding
    marginBottom: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    // height: 110, // Mejor dejar que crezca según contenido
  },
  time: {
    width: 55,
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  center: {
    flex: 1,
    paddingHorizontal: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  service: {
    fontSize: 14,
    color: "#6A6F78",
    marginTop: 2,
  },
  statusContainer: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  date: {
    fontSize: 12,
    marginTop: 4,
    color: "#9CA3AF",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
