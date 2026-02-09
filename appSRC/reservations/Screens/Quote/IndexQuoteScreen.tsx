import React, { useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  SectionList,
  RefreshControl,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { COLORS, FONTS } from "@/appASSETS/theme";

// Hooks
import { useProQuoteRequests } from "@/appSRC/reservations/Hooks/useProQuoteRequests";
import { useProConfirmedWorks } from "@/appSRC/reservations/Hooks/useProConfirmedWorks";
import { useConfirmQuoteReservation } from "@/appSRC/reservations/Hooks/useConfirmQuoteReservation";
import { useRejectByProfessional } from "@/appSRC/reservations/Hooks/useRejectByProfessional";

// UI Components
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";
import StatusPlaceholder from "@/appCOMP/contentStates/StatusPlaceholder";
import { ServiceRequestCard } from "@/appCOMP/cards/ServiceRequestCard";
import { ReservationCard } from "@/appCOMP/cards/ReservationCard";
import { formatForUI } from "@/appSRC/timeAndData/Builder/TimeBuilder";
import { Reservation } from "../../Type/ReservationType";

// ============================================================================
// TIPOS INTERNOS
// ============================================================================

interface SectionData {
  title: string;
  type: "pending" | "confirmed";
  data: Reservation[];
}

// ============================================================================
// PANTALLA PRINCIPAL
// ============================================================================

const IndexQuoteScreen = () => {
  const router = useRouter();

  // --- HOOKS ---
  const {
    requests: pendingRequests,
    loading: loadingPending,
    refresh: refreshPending,
  } = useProQuoteRequests();

  const {
    works: confirmedWorks,
    loading: loadingConfirmed,
    onRefresh: refreshConfirmed,
  } = useProConfirmedWorks();

  const { confirmQuoteRequest } = useConfirmQuoteReservation();
  const { rejectReservation } = useRejectByProfessional();

  // --- ACCIONES ---
  const handleAcceptQuote = async (reservationId: string) => {
    await confirmQuoteRequest(reservationId, () => {
      refreshPending();
      refreshConfirmed();
    });
  };

  const handleRejectQuote = (reservationId: string) => {
    rejectReservation(reservationId, () => {
      refreshPending();
    });
  };

  const handlePressWork = (reservationId: string) => {
    router.push(
      `/(professional)/(tabs)/home/ReservationsDetails/${reservationId}`
    );
  };

  const handleRefreshAll = useCallback(() => {
    refreshPending();
    refreshConfirmed();
  }, [refreshPending, refreshConfirmed]);

  // Refrescar al entrar
  useFocusEffect(
    useCallback(() => {
      handleRefreshAll();
    }, [])
  );

  // --- LOADING ---
  const isInitialLoad =
    loadingPending &&
    loadingConfirmed &&
    pendingRequests.length === 0 &&
    confirmedWorks.length === 0;

  if (isInitialLoad) {
    return (
      <View style={styles.centerContainer}>
        <MiniLoaderScreen />
      </View>
    );
  }

  // --- SECCIONES ---
  const sections: SectionData[] = [];

  // Sección 1: Solicitudes Pendientes (solo si hay)
  if (pendingRequests.length > 0) {
    sections.push({
      title: `Nuevas Solicitudes (${pendingRequests.length})`,
      type: "pending",
      data: pendingRequests,
    });
  }

  // Sección 2: Trabajos Confirmados
  sections.push({
    title: `Agenda de Trabajo (${confirmedWorks.length})`,
    type: "confirmed",
    data: confirmedWorks,
  });

  // --- RENDER ---
  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={loadingPending || loadingConfirmed}
            onRefresh={handleRefreshAll}
          />
        }
        ListHeaderComponent={
          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Presupuestos</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statsNumber}>{pendingRequests.length}</Text>
                <Text style={styles.statsSubLabel}>Pendientes</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statsNumber}>{confirmedWorks.length}</Text>
                <Text style={styles.statsSubLabel}>Confirmados</Text>
              </View>
            </View>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderItem={({ item, section }) => {
          if (section.type === "pending") {
            return renderPendingItem(item, handleAcceptQuote, handleRejectQuote);
          }
          return renderConfirmedItem(item, handlePressWork);
        }}
        ListEmptyComponent={
          <StatusPlaceholder
            icon="calendar"
            title="Sin actividad"
            subtitle="Tus presupuestos aceptados y trabajos agendados aparecerán aquí."
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

// ============================================================================
// RENDER HELPERS
// ============================================================================

/**
 * Renderiza una solicitud de presupuesto pendiente (con botones Aceptar/Rechazar).
 */
const renderPendingItem = (
  item: Reservation,
  onAccept: (id: string) => void,
  onReject: (id: string) => void
) => {
  const targetDate = item.scheduledStart || item.createdAt;
  const { time } = formatForUI(targetDate);

  return (
    <ServiceRequestCard
      category={item.serviceTitle}
      price={
        item.financials.price > 0
          ? `$${item.financials.price.toLocaleString("es-AR")}`
          : "A cotizar"
      }
      distance="📋 Presupuesto"
      location={item.address}
      title={item.roleName}
      timeAgo={time}
      onAccept={() => onAccept(item.id)}
      onDecline={() => onReject(item.id)}
    />
  );
};

/**
 * Renderiza un trabajo confirmado de la agenda (tap para ver detalles).
 */
const renderConfirmedItem = (
  item: Reservation,
  onPress: (id: string) => void
) => {
  const rawDate = item.scheduledStart || item.createdAt || new Date();
  const isValidDate = rawDate instanceof Date && !isNaN(rawDate.getTime());
  const safeDate = isValidDate ? rawDate : new Date();
  const { date, time } = formatForUI(safeDate);

  const price =
    item.financials.price > 0
      ? `$${item.financials.price.toLocaleString("es-AR")}`
      : "A cotizar";

  return (
    <ReservationCard
      id={item.id}
      serviceName={item.serviceTitle || "Servicio"}
      counterpartName={item.roleName || "Cliente"}
      status={item.statusUI}
      avatar={item.roleAvatar}
      date={date}
      time={time}
      price={price}
      onPress={() => onPress(item.id)}
      viewRole="professional"
    />
  );
};

export default IndexQuoteScreen;

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  statsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: 30,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E5E7EB",
  },
  statsNumber: {
    fontSize: 36,
    color: COLORS.primary,
    fontWeight: "800",
  },
  statsLabel: { ...FONTS.h3, color: COLORS.textPrimary, fontWeight: "700" },
  statsSubLabel: { ...FONTS.body4, color: COLORS.textSecondary, marginTop: 4 },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 10,
  },
});
