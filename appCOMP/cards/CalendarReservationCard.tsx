// CalendarReservationCard.tsx
import { COLORS } from "@/appASSETS/theme";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

interface CalendarReservationCardProps {
  time: string;
  name: string;
  service: string;
  status: "Confirmada" | "Cancelada" | "Pendiente";
  date?: string
  onPress?: () => void;
}

const statusStyles = {
  Confirmada: {
    backgroundColor: COLORS.success,
    color: 'white',
  },
  Cancelada: {
    backgroundColor: COLORS.error,
    color: 'white',
  },
  Pendiente: {
    backgroundColor: COLORS.warning,
    color: 'white',
  },
};

export const CalendarReservationCard: React.FC<CalendarReservationCardProps> = ({
  time,
  name,
  service,
  status,
  date,
  onPress,
}) => {
  const s = statusStyles[status];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View style={styles.card}>
        <Text style={styles.time}>{time}</Text>

        <View style={styles.center}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.service}>{service}</Text>
          {date && <Text style={styles.date}>{date}</Text>}
        </View>

        <View style={[styles.statusContainer, { backgroundColor: s.backgroundColor }]}>
          <Text style={[styles.statusText, { color: s.color }]}>{status}</Text>
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

    // --- Márgenes iguales a tu Home (ESTO ES LA CLAVE) ---
    marginHorizontal: 20,
    marginVertical: 10,
    // --- Tamaño & estilo del Home ---
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 20,

    // --- Sombra estilo Apple (muy suave) ---
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    height: 110

  },

  time: {
    width: 55,
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
  },

  center: {
    flex: 1,
    marginLeft: 10,
  },

  name: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
  },

  service: {
    fontSize: 14,
    color: "#6A6F78",
    marginTop: 3,
  },
  statusContainer: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    minWidth: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  date: {
    fontSize: 13,
    marginTop: 4,
    color: "#7E8289",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
});