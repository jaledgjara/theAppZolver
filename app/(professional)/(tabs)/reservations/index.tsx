import { FlatList, StyleSheet, Text, View } from "react-native";
import React from "react";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { COLORS, FONTS, SIZES } from "@/appASSETS/theme";
import { CalendarReservationCard } from "@/appCOMP/cards/CalendarReservationCard";
import { router } from "expo-router";

export const MOCK_RESERVATIONS = [
  {
    id: "1",
    time: "9:00",
    name: "María Gómez",
    service: "Corte de cabello",
    status: "Confirmada",
  },
  {
    id: "2",
    time: "11:00",
    name: "Instalación de luminaria",
    service: "—",
    status: "Cancelada",
  },
  {
    id: "3",
    time: "13:00",
    name: "Carlos Reyes",
    service: "Mantenimiento eléctrico",
    status: "Pendiente",
  },
  {
    id: "4",
    time: "15:30",
    name: "Ana Martínez",
    service: "Reparación de tubería",
    status: "Pendiente",
  },
];

const reservations = () => {
  return (
    <View style={styles.container}>
      <ToolBarTitle titleText={"Reservas"} />

      <View style={styles.divider}></View>

      <Text style={styles.title}> Próximas reservas</Text>

      <View style={styles.contentContainer}>
        <FlatList
          data={MOCK_RESERVATIONS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CalendarReservationCard
              time={item.time}
              name={item.name}
              service={item.service}
              status={"Confirmada"}
              onPress={() =>
                router.push(
                  `/(professional)/(tabs)/reservations/ReservationsDetailsScreen/${item.id}`
                )
              }
            />
          )}
        />
      </View>
    </View>
  );
};

export default reservations;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#E9E9E9",
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 20,
  },
  title: {
    fontSize: SIZES.h2,
    paddingHorizontal: 20,
    paddingTop: 10,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
});
