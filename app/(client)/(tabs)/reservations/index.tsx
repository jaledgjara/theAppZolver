import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";

// Componentes UI
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import {
  TabbedReservationFilters,
  ReservationFilterType,
} from "@/appSRC/reservations/Screens/Client/MenuFilterReservation";
import { ReservationCard } from "@/appSRC/reservations/Screens/Client/ReservationCard";

// Lógica de Negocio y Datos

import { Reservation } from "@/appSRC/reservations/Type/ReservationType";
import { useClientReservations } from "@/appSRC/reservations/Hooks/useClientFetchingReservations";
import { mapReservationToCard } from "@/appSRC/reservations/Helper/MapStatusToUIClient";

const Reservations = () => {
  const router = useRouter();
  const [currentFilter, setCurrentFilter] =
    useState<ReservationFilterType>("active");

  // 1. Hook de Datos (React Query)
  const {
    activeReservations,
    pendingReservations,
    historyReservations,
    isLoadingActive,
    isLoadingPending,
    isLoadingHistory,
    fetchNextHistory,
    hasNextHistory,
    isFetchingNextHistory,
    refreshAll,
  } = useClientReservations();

  // 2. Selector de Datos según Filtro
  let currentData: Reservation[] = [];
  let isLoading = false;

  switch (currentFilter) {
    case "active":
      currentData = activeReservations;
      isLoading = isLoadingActive;
      break;
    case "pending":
      currentData = pendingReservations;
      isLoading = isLoadingPending;
      break;
    case "historical":
      currentData = historyReservations;
      isLoading = isLoadingHistory;
      break;
  }

  const handleFilterChange = (filter: ReservationFilterType) => {
    setCurrentFilter(filter);
  };

  const handleEndReached = () => {
    if (
      currentFilter === "historical" &&
      hasNextHistory &&
      !isFetchingNextHistory
    ) {
      fetchNextHistory();
    }
  };

  const handleCardPress = (id: string) => {
    router.push(`/(client)/(tabs)/reservations/ReservationDetailsScreen/${id}`);
  };

  // Flag para mostrar loader inicial (pantalla vacía + cargando)
  const showInitialLoader = isLoading && currentData.length === 0;

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Mis Reservas" />

      <TabbedReservationFilters
        currentFilter={currentFilter}
        onFilterChange={handleFilterChange}
      />

      {showInitialLoader ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={currentData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReservationCard
              {...mapReservationToCard(item)}
              onPress={() => handleCardPress(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          // Pull to Refresh
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refreshAll} />
          }
          // Infinite Scroll (Historial)
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          // Loader al pie de página
          ListFooterComponent={
            currentFilter === "historical" && isFetchingNextHistory ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#9CA3AF" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>
                No hay reservas en esta sección.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default Reservations;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 16,
  },
});
