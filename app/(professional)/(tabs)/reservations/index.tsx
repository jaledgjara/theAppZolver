import React from "react";
import { FlatList, StyleSheet, View, Text } from "react-native";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { router } from "expo-router";
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";
import { useProHistoryReservations } from "@/appSRC/reservations/Hooks/useProHistoryReservations";
import { mapReservationToCard } from "@/appSRC/reservations/Helper/MapStatusToUIClient";
import { ReservationCard } from "@/appCOMP/cards/ReservationCard";
import StatusPlaceholder from "@/appCOMP/contentStates/StatusPlaceholder";

const ReservationsProfessional = () => {
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
              {...mapReservationToCard(item, "professional")}
              onPress={() =>
                router.push(
                  `/(professional)/(tabs)/reservations/ReservationsDetails/${item.id}`
                )
              }
            />
          )}
          // --- OPTIMIZACIÓN DE MEMORIA (100k READY) ---
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          // --------------------------------------------
          contentContainerStyle={styles.listContent}
          onRefresh={refresh}
          refreshing={isLoading}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingMore ? (
              <View style={{ paddingVertical: 20 }}>
                <MiniLoaderScreen />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !isLoading ? (
              <StatusPlaceholder
                title="Sin actividad"
                subtitle="Aún no tienes reservas en tu historial."
                icon="calendar"
              />
            ) : null
          }
        />
      </View>
    </View>
  );
};

export default ReservationsProfessional;

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
