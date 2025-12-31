import React, { useCallback } from "react";
import { StyleSheet, Text, View, FlatList, RefreshControl } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { COLORS, FONTS } from "@/appASSETS/theme";

// Hook de Datos
import { useProConfirmedWorks } from "@/appSRC/reservations/Hooks/useProConfirmedWorks";

// UI Components
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";
import StatusPlaceholder from "@/appCOMP/contentStates/StatusPlaceholder";
import { formatForUI } from "@/appSRC/timeAndData/Builder/TimeBuilder";
import { ReservationCard } from "@/appCOMP/cards/ReservationCard";

// Utils

const IndexQuoteScreen = () => {
  const router = useRouter();
  const { works, loading, refreshing, onRefresh } = useProConfirmedWorks();

  // Refrescar al entrar para asegurar datos frescos
  useFocusEffect(
    useCallback(() => {
      onRefresh();
    }, [])
  );

  const handlePressWork = (reservationId: string) => {
    router.push(
      `/(professional)/(tabs)/reservations/ReservationsDetails/${reservationId}`
    );
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
            // ================================================================
            // 🛡️ LÓGICA DE FECHA BLINDADA (Fix Date { NaN })
            // ================================================================

            // 1. Elegir la fuente preferida
            let rawDate =
              item.modality === "instant"
                ? item.createdAt
                : item.scheduledStart;

            // 2. Verificar si es válida
            const isValidDate =
              rawDate instanceof Date && !isNaN(rawDate.getTime());

            // 3. Fallback: Si está rota, usar createdAt. Si también falla, usar AHORA.
            if (!isValidDate) {
              // console.warn(`⚠️ [UI] Fecha inválida en ID ${item.id}. Usando fallback.`);
              rawDate = item.createdAt || new Date();
            }

            // 4. Formatear
            const { date, time } = formatForUI(rawDate);

            // ================================================================

            const price =
              item.financials.price > 0
                ? `$${item.financials.price.toLocaleString("es-AR")}`
                : "A cotizar";

            return (
              <ReservationCard
                id={item.id}
                // Usamos propiedades planas de la nueva entidad
                serviceName={item.serviceTitle || "Servicio"}
                counterpartName={item.roleName || "Cliente"}
                status={item.statusUI} // Estado Visual
                avatar={item.roleAvatar}
                date={date}
                time={time}
                price={price}
                onPress={() => handlePressWork(item.id)}
              />
            );
          }}
          ListEmptyComponent={
            <StatusPlaceholder
              icon="calendar"
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
