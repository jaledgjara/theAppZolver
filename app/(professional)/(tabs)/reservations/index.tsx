import React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { COLORS, SIZES } from "@/appASSETS/theme";
import { router } from "expo-router";
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";
import { useProHistoryReservations } from "@/appSRC/reservations/Hooks/useProHistoryReservations";
import { mapReservationToCard } from "@/appSRC/reservations/Helper/MapStatusToUIClient";
import { ReservationCard } from "@/appCOMP/cards/ReservationCard";
import StatusPlaceholder from "@/appCOMP/contentStates/StatusPlaceholder";

const HistoryScreen = () => {
  const { history, isLoading, isFetchingMore, refresh, loadMore } =
    useProHistoryReservations();

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Historial" />
      <View style={styles.divider} />

      <View style={styles.contentContainer}>
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReservationCard
              // Pasamos 'professional' para que el helper sepa extraer los datos del Cliente
              {...mapReservationToCard(item, "professional")}
              onPress={() =>
                router.push(
                  `/(professional)/(tabs)/history/HistoryDetails/${item.id}`
                )
              }
            />
          )}
          contentContainerStyle={styles.listContent}
          onRefresh={refresh}
          refreshing={false} // Managed by MiniLoader for initial, pull-to-refresh internal logic
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isFetchingMore ? <MiniLoaderScreen /> : null}
          ListEmptyComponent={
            <StatusPlaceholder
              title="Sin actividad"
              subtitle="Aún no tienes reservas en tu historial."
              icon="calendar"
            />
          }
        />
      </View>
    </View>
  );
};

export default HistoryScreen;

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
  },
  listContent: {
    paddingBottom: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    flexGrow: 1,
  },
});
