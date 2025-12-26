import React from "react";
import { StyleSheet, Text, View, FlatList, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { COLORS, FONTS } from "@/appASSETS/theme";

// Hook
import { useProConfirmedWorks } from "@/appSRC/reservations/Hooks/useProConfirmedWorks";

// UI Components
import { ReservationCard } from "@/appCOMP/cards/ReservationCard";
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";
import StatusPlaceholder from "@/appCOMP/contentStates/StatusPlaceholder";

const IndexQuoteScreen = () => {
  const router = useRouter();
  const { works, loading, refreshing, onRefresh } = useProConfirmedWorks();

  const handlePressWork = (reservationId: string) => {
    router.push({
      pathname:
        "/(professional)/(tabs)/reservations/ReservationDetailsScreen/[id]",
      params: { id: reservationId },
    });
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.statsCard}>
        <Text style={styles.statsLabel}>Trabajos Confirmados</Text>
        <Text style={styles.statsNumber}>{works.length}</Text>
        <Text style={styles.statsSubLabel}>Tareas pendientes de ejecución</Text>
      </View>
      <Text style={styles.sectionTitle}>Agenda de Trabajo</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.centerContainer}>
          <MiniLoaderScreen />
        </View>
      ) : (
        <FlatList
          data={works}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => {
            // --- [DEBUG-UI] TRAZA DE RENDERIZADO ---
            // console.log(`[DEBUG-UI] Rendering Item ${item.id}`);
            // console.log(`[DEBUG-UI] StartDate Type:`, typeof item.schedule.startDate);
            // console.log(`[DEBUG-UI] StartDate Value:`, item.schedule.startDate);

            // A. Lógica de Fecha Segura
            let dateStr = "A coordinar";
            let timeStr = "";
            const dateObj = item.schedule.startDate;

            if (dateObj && !isNaN(dateObj.getTime())) {
              dateStr = dateObj.toLocaleDateString("es-AR", {
                day: "numeric",
                month: "long",
              });
              timeStr = dateObj.toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
              });
            } else {
              // Logueamos solo si falla la fecha para no saturar consola
              console.warn(
                `[DEBUG-UI] ⚠️ Item ${item.id} tiene fecha nula o inválida.`
              );
            }

            const price =
              item.financials.priceFinal > 0
                ? `$${item.financials.priceFinal.toLocaleString("es-AR")}`
                : "A cotizar";

            return (
              <ReservationCard
                id={item.id}
                serviceName={item.title || "Servicio"}
                counterpartName={item.client?.name || "Cliente Zolver"}
                status={item.status}
                date={dateStr}
                time={timeStr}
                price={price}
                onPress={() => handlePressWork(item.id)}
              />
            );
          }}
          ListEmptyComponent={
            <StatusPlaceholder
              icon="calendar-outline"
              title="Sin trabajos confirmados"
              subtitle="Tus reservas aceptadas aparecerán aquí."
            />
          }
        />
      )}
    </View>
  );
};

export default IndexQuoteScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  headerContainer: { marginTop: 20, marginBottom: 10 },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 10,
  },
  statsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  statsNumber: {
    fontSize: 48,
    color: COLORS.primary,
    fontWeight: "800",
    paddingVertical: 10,
  },
  statsLabel: { ...FONTS.h3, color: COLORS.textPrimary, fontWeight: "700" },
  statsSubLabel: { ...FONTS.body4, color: COLORS.textSecondary },
});
