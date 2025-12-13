import { FlatList, StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { TabbedReservationFilters } from "@/appSRC/reservations/Screens/Client/MenuFilterReservation";
import {
  ReservationCard,
  ReservationCardProps,
} from "@/appSRC/reservations/Screens/Client/ReservationCard";
import { useRouter } from "expo-router";

type ReservationFilter = "upcoming" | "completed" | "canceled";

const MOCK_RESERVATIONS: ReservationCardProps[] = [
  {
    id: "1",
    name: "Juan Perez",
    date: "15 Diciembre, 2024",
    service: "Servicio de Pintura",
    status: "confirmed",
    avatar: require("appASSETS/RawImages/avatar-1.jpg"),
  },
  {
    id: "2",
    name: "María García",
    date: "15 Diciembre, 2024",
    time: "10:00 AM",
    service: "Instalación Eléctrica",
    status: "on_route",
    avatar: require("appASSETS/RawImages/avatar-0.jpg"),
  },
  {
    id: "3",
    name: "Ricardo López",
    date: "01 Noviembre, 2024",
    service: "Reparación de Cañerías",
    status: "finalized",
    avatar: require("appASSETS/RawImages/avatar-1.jpg"),
  },
];

const Reservations = () => {
  const router = useRouter();

  const [currentFilter, setCurrentFilter] =
    useState<ReservationFilter>("upcoming");

  const handleFilterChange = (filter: ReservationFilter) => {
    setCurrentFilter(filter);
    console.log(`Filtro cambiado a: ${filter}`);
  };

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Reservas" />

      <TabbedReservationFilters
        currentFilter={currentFilter}
        onFilterChange={handleFilterChange}
      />

      <FlatList
        data={MOCK_RESERVATIONS}
        keyExtractor={(item, index) => item.name + index}
        renderItem={({ item }) => (
          <ReservationCard
            {...item}
            onPress={() =>
              router.push(
                `(client)/(tabs)/reservations/ReservationDetailsScreen/${item.id}`
              )
            }
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default Reservations;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  listContent: {
    paddingVertical: 20,
  },
});
