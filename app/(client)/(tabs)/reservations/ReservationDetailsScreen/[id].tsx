import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { BaseCard } from "@/appCOMP/cards/BaseCard";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import ReservationDetailsCard from "@/appSRC/reservations/Screens/Client/ReservationDetailsCard";

export type ReservationStatus = "confirmed" | "on_route" | "finalized";

export interface ReservationCardProps {
  id: string;
  name: string;
  date: string;
  time?: string;
  service: string;
  status: ReservationStatus;
  avatar: any;
}

const MOCK_RESERVATIONS: ReservationCardProps[] = [
  {
    id: "1",
    name: "Juan Perez",
    date: "15 Diciembre, 2024",
    service: "Servicio de Pintura",
    status: "confirmed",
    avatar: { uri: "https://randomuser.me/api/portraits/men/1.jpg" },
  },
  {
    id: "2",
    name: "María García",
    date: "15 Diciembre, 2024",
    time: "10:00 AM",
    service: "Instalación Eléctrica",
    status: "on_route",
    avatar: { uri: "https://randomuser.me/api/portraits/women/2.jpg" },
  },
  {
    id: "3",
    name: "Ricardo López",
    date: "01 Noviembre, 2024",
    service: "Reparación de Cañerías",
    status: "finalized",
    avatar: { uri: "https://randomuser.me/api/portraits/men/3.jpg" },
  },
];

const getStatusColors = (status: ReservationStatus) => {
  switch (status) {
    case "confirmed":
      return { text: "Confirmada", bg: "#D4EDDA", color: "#155724" };
    case "on_route":
      return { text: "En Camino", bg: "#007AFF", color: "#FFF" };
    case "finalized":
      return { text: "Finalizada", bg: "#D1ECF1", color: "#0C5460" };
    default:
      return { text: "Estado", bg: "#EEE", color: "#333" };
  }
};

const ReservationDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const reservationId = Array.isArray(id) ? id[0] : id;

  const [reservation, setReservation] = useState<ReservationCardProps | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    setTimeout(() => {
      const found = MOCK_RESERVATIONS.find((r) => r.id === reservationId);
      setReservation(found || null);
      setIsLoading(false);
    }, 500);
  }, [reservationId]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.text}>Cargando detalle...</Text>
      </View>
    );
  }

  if (!reservation) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.title}>Error</Text>
        <Text style={styles.text}>
          Reserva no encontrada ({reservationId}).
        </Text>
      </View>
    );
  }
  const res = reservation;
  const status = getStatusColors(res.status);

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Detalle de la Reserva" showBackButton={true} />

      {/* ✦ Professional + Status */}
      <View style={styles.contentContainer}>
        <ReservationDetailsCard
          type="professional"
          name={reservation.name}
          service={reservation.service}
          avatar={reservation.avatar}
          statusText={status.text}
          statusBg={status.bg}
          statusColor={status.color}
        />

        <ReservationDetailsCard
          type="date"
          date={reservation.date}
          time={reservation.time}
        />

        <ReservationDetailsCard
          type="location"
          location="Juan B Justo 1234, Mendoza"
        />

        <ReservationDetailsCard
          type="payment"
          priceService="$5000"
          platformFee="$500"
          totalAmount="$5500"
        />
        <View style={styles.buttonContainer}>
          <LargeButton
            title="Completado"
            iconName="checkmark-circle"
            onPress={() => console.log("Completado")}
          />
        </View>
      </View>
    </View>
  );
};

export default ReservationDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F2F5",
  },
  contentContainer: {
    marginTop: 20,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F2F5",
  },

  // Avatar
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E0E0E0",
  },

  // Nombre del profesional
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },

  // Nombre del servicio
  service: {
    fontSize: 14,
    color: "#666",
  },

  // Badge del estado
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: "flex-start",
  },

  // Textos generales de filas (día, hora, ubicación)
  rowText: {
    fontSize: 15,
    color: "#333",
    marginBottom: 4,
  },

  // Pago – título principal
  paymentTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
  },

  // Pago – filas
  paymentRow: {
    fontSize: 15,
    color: "#555",
    marginBottom: 6,
  },

  // Pago – Total destacado
  paymentTotal: {
    fontSize: 17,
    color: "#000",
    fontWeight: "800",
    marginTop: 10,
  },

  // General
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },

  text: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
  },
  buttonContainer: {
    paddingHorizontal: 15,
  },
});
