import React, { useState, useCallback } from "react"; // Agregamos useCallback
import { FlatList, StyleSheet, View, ActivityIndicator, RefreshControl, Text } from "react-native";
import { useRouter, useFocusEffect } from "expo-router"; // Agregamos useFocusEffect

// Componentes UI
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import {
  TabbedReservationFilters,
  ReservationFilterType,
} from "@/appSRC/reservations/Screens/Client/MenuFilterReservation";

// Lógica de Negocio y Datos
import { Reservation } from "@/appSRC/reservations/Type/ReservationType";
import { useClientReservations } from "@/appSRC/reservations/Hooks/useClientFetchingReservations";
import { mapReservationToCard } from "@/appSRC/reservations/Helper/MapStatusToUIClient";
import StatusPlaceholder from "@/appCOMP/contentStates/StatusPlaceholder";
import { ReservationCard } from "@/appCOMP/cards/ReservationCard";
import { COLORS } from "@/appASSETS/theme";

const Reservations = () => {
  const router = useRouter();
  const [currentFilter, setCurrentFilter] = useState<ReservationFilterType>("active");

  // 1. Hook de Datos
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

  // ✅ FIX: REFRESH AUTOMÁTICO AL ENTRAR A LA PESTAÑA
  // Esto soluciona que la reserva recién creada no aparezca.
  useFocusEffect(
    useCallback(() => {
      // console.log("🔄 [CLIENT UI] Refrescando reservas al enfocar...");
      refreshAll();
    }, []),
  );

  // 2. Selector de Datos
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
    if (currentFilter === "historical" && hasNextHistory && !isFetchingNextHistory) {
      fetchNextHistory();
    }
  };

  const handleCardPress = (id: string) => {
    router.push(`/(client)/(tabs)/reservations/ReservationDetailsScreen/${id}`);
  };

  // Loader inicial solo si no hay data
  const showInitialLoader = isLoading && currentData.length === 0;

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Mis Reservas" />

      <TabbedReservationFilters currentFilter={currentFilter} onFilterChange={handleFilterChange} />

      {showInitialLoader ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.brandDeep} />
        </View>
      ) : (
        <FlatList
          data={currentData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReservationCard
              // ✅ El mapper ahora funciona perfecto gracias a los cambios previos
              {...mapReservationToCard(item, "client")}
              onPress={() => handleCardPress(item.id)}
            />
          )}
          // Optimizaciones de lista
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshAll} />}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            currentFilter === "historical" && isFetchingNextHistory ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={COLORS.textTertiary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !isLoading ? (
              <StatusPlaceholder
                icon="calendar" // Icono corregido si no tienes 'calendar-blank-outline'
                title="Sin reservas aún"
                subtitle="Aquí aparecerán tus citas programadas."
              />
            ) : null
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
    backgroundColor: COLORS.backgroundLight,
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
});
