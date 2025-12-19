import React from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { COLORS, FONTS } from "@/appASSETS/theme";
import QuoteRequestCard from "@/appCOMP/cards/QuoteRequestCard"; // O usar ReservationCard si prefieres
import { useProConfirmedWorks } from "@/appSRC/reservations/Hooks/useProConfirmedWorks"; // Importar el Hook nuevo
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";
import StatusPlaceholder from "@/appCOMP/contentStates/StatusPlaceholder";

const IndexQuoteScreen = () => {
  const router = useRouter();

  // 1. INYECCIÓN DEL HOOK (Lógica de Negocio)
  const { works, loading, refreshing, onRefresh } = useProConfirmedWorks();

  // 2. Handler de Navegación
  const handlePressWork = (workId: string) => {
    console.log("[ZOLVER-DEBUG] Navigating to Work Detail:", workId);
    // Navegar al detalle de la reserva confirmada
    router.push({
      pathname:
        "/(professional)/(tabs)/reservations/ReservationDetailsScreen/[id]", // Ajustar ruta real
      params: { id: workId },
    });
  };

  // Header dinámico
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
          // En IndexQuoteScreen.tsx dentro del FlatList renderItem

          renderItem={({ item }) => (
            <QuoteRequestCard
              // 1. Desestructuración de props (Flat Props)
              category={item.serviceCategory || "Servicio"}
              description={item.title}
              clientName="Cliente Zolver" // O item.client?.full_name si ya hiciste el join
              date={
                item.schedule?.startDate
                  ? new Date(item.schedule.startDate).toLocaleString()
                  : "Fecha por definir"
              }
              status="Confirmado" // Ahora es válido gracias al paso 1
              // 2. Nombre correcto de la función
              onViewDetails={() => handlePressWork(item.id)}
            />
          )}
          ListEmptyComponent={
            <StatusPlaceholder
              icon="inbox"
              title="Sin trabajos confirmados"
              subtitle="Tus reservas aceptadas aparecerán aquí para gestionar la ejecución."
            />
          }
        />
      )}
    </View>
  );
};

export default IndexQuoteScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "WHITE" },
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
  emptyContainer: { alignItems: "center", marginTop: 40, padding: 20 },
  emptyText: { ...FONTS.h3, color: COLORS.textSecondary, marginBottom: 8 },
  emptySubText: {
    ...FONTS.body4,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});
