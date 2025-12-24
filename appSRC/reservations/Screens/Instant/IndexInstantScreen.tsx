import React, { useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  RefreshControl,
  ScrollView,
} from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { COLORS } from "@/appASSETS/theme";
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";

// --- HOOKS ---
import { useIsActive } from "@/appSRC/users/Professional/Hooks/useIsActive";
import { useConfirmInstantReservation } from "../../Hooks/useConfirmInstantReservation";
import { useProIncomingRequests } from "../../Hooks/useProIncomingRequests";

// --- CARDS ---
import { ServiceRequestCard } from "@/appCOMP/cards/ServiceRequestCard";
import { ActiveJobControlCard } from "@/appCOMP/cards/ActiveJobControlCard";
import { useCurrentActiveJob } from "../../Hooks/useCurrentActiveJob";
import { useRejectByProfessional } from "../../Hooks/useRejectByProfessional";
import { rejectReservationByPro } from "../../Service/ReservationService";
import { ref } from "process";
import StatusPlaceholder from "@/appCOMP/contentStates/StatusPlaceholder";

const IndexInstantScreen = () => {
  // [LOGIC FLOW] 1. Trabajo Activo
  const {
    currentJob,
    isLoading: loadingJob,
    refresh: refreshActiveJob,
  } = useCurrentActiveJob();

  const { rejectReservation, isRejecting } = useRejectByProfessional();

  // [LOGIC FLOW] 2. Radar y Solicitudes
  const { isActive, toggleStatus, isLoading: switchingStatus } = useIsActive();
  const shouldFetchRequests = isActive && !currentJob;
  const {
    requests,
    loading: loadingData,
    refresh: refreshRequests,
  } = useProIncomingRequests(shouldFetchRequests);

  // [LOGIC FLOW] 3. Acciones
  const { confirmRequest } = useConfirmInstantReservation();

  const handleManualRefresh = useCallback(() => {
    // Refrescamos TODO lo importante
    console.log("🔄 Refrescando manualmente...");
    refreshActiveJob();
    if (shouldFetchRequests) refreshRequests();
  }, [refreshActiveJob, refreshRequests, shouldFetchRequests]);

  const handleAccept = async (reservationId: string) => {
    await confirmRequest(reservationId, () => {
      refreshActiveJob();
    });
  };

  const handleReject = async (reservationId: string) => {
    // CORRECCIÓN ARQUITECTÓNICA:
    // Al rechazar, necesitamos actualizar la "Lista de Espera" (Requests),
    // no el "Trabajo Activo" (Job).
    rejectReservation(reservationId, () => {
      console.log("🗑️ Solicitud rechazada. Actualizando lista...");
      refreshRequests(); // <--- ESTA ES LA CLAVE
    });
  };

  // --- VISTA ---
  if (loadingJob) return <MiniLoaderScreen />;

  // ==========================================================================
  // [VIEW] MODO TRABAJO (COCKPIT) - AHORA CON REFRESH
  // ==========================================================================
  if (currentJob) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.centerContentScroll}
          refreshControl={
            <RefreshControl
              refreshing={loadingJob} // Usa loadingJob para mostrar el spinner nativo
              onRefresh={handleManualRefresh}
              colors={[COLORS.primary]} // Color del spinner en Android
              tintColor={COLORS.primary} // Color del spinner en iOS
            />
          }>
          <ActiveJobControlCard
            job={currentJob}
            // Pasamos el refresh para que la tarjeta lo llame al cambiar de estado
            onJobCompleted={refreshActiveJob}
          />

          {/* Texto auxiliar discreto para que el usuario sepa que puede deslizar */}
          <Text style={styles.hintText}>
            Desliza hacia abajo para actualizar
          </Text>
        </ScrollView>
      </View>
    );
  }

  // ==========================================================================
  // [VIEW] MODO RADAR (LISTA DE ESPERA)
  // ==========================================================================
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.statusSection}>
        <LargeButton
          title={
            switchingStatus
              ? "CARGANDO..."
              : isActive
              ? "ESTOY ACTIVO"
              : "DESCONECTADO"
          }
          onPress={toggleStatus}
          style={{
            backgroundColor: isActive ? COLORS.primary : COLORS.textSecondary,
          }}
        />
      </View>

      <View style={styles.radarContainer}>
        <View style={[styles.radarCircle, !isActive && styles.radarInactive]}>
          {switchingStatus ? (
            <MiniLoaderScreen />
          ) : (
            <FontAwesome5
              name="satellite-dish"
              size={80}
              color={isActive ? COLORS.success : COLORS.textSecondary}
            />
          )}
        </View>
        <View style={styles.statusTextContainer}>
          <Text style={styles.statusTitle}>
            {isActive ? "Escaneando zona..." : "Estás invisible"}
          </Text>
          <Text style={styles.statusSubtitle}>
            {isActive
              ? loadingData
                ? "Sincronizando..."
                : "Esperando solicitudes cercanas"
              : "Conéctate para recibir trabajos"}
          </Text>
        </View>
      </View>

      {isActive && (
        <Text style={styles.sectionTitle}>
          Solicitudes Entrantes ({requests.length})
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {isActive ? (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={loadingData}
              onRefresh={handleManualRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          renderItem={({ item }) => (
            <ServiceRequestCard
              category={item.serviceCategory}
              price={`$${
                item.financials.priceEstimated?.toLocaleString() || "-"
              }`}
              distance="📍 Cerca"
              location={item.location.street}
              title={item.title}
              timeAgo={item.schedule.startDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
              onAccept={() => handleAccept(item.id)}
              onDecline={() => handleReject(item.id)}
            />
          )}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loadingData ? (
              <StatusPlaceholder
                title="Sin solicitudes"
                subtitle="No hay nuevas solicitudes para ti."
                icon="inbox"
              />
            ) : null
          }
        />
      ) : (
        /* Vista Inactiva: También permitimos refresh aquí por si acaso */
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={handleManualRefresh}
            />
          }>
          {renderHeader()}
        </ScrollView>
      )}
    </View>
  );
};

export default IndexInstantScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  centerContentScroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  centerContent: { flex: 1, justifyContent: "center", padding: 20 },
  headerContainer: { padding: 20, alignItems: "center" },
  statusSection: { width: "100%", marginBottom: 20 },
  radarContainer: { alignItems: "center", marginVertical: 20 },
  radarCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  radarInactive: { backgroundColor: "#ECEFF1" },
  statusTextContainer: { alignItems: "center" },
  statusTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  statusSubtitle: { fontSize: 14, color: "#666" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    alignSelf: "flex-start",
    marginTop: 20,
    marginBottom: 10,
    color: "#444",
  },
  listContent: { paddingBottom: 40 },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#999",
    fontStyle: "italic",
  },
  hintText: {
    textAlign: "center",
    color: "#999",
    fontSize: 12,
    marginTop: 20,
  },
});
