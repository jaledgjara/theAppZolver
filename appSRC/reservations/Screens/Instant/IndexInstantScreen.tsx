import React, { useCallback } from "react";
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
import StatusPlaceholder from "@/appCOMP/contentStates/StatusPlaceholder";

// --- HOOKS ---
import { useIsActive } from "@/appSRC/users/Professional/Hooks/useIsActive";
import { useConfirmInstantReservation } from "../../Hooks/useConfirmInstantReservation";
import { useProIncomingRequests } from "../../Hooks/useProIncomingRequests";
import { useCurrentActiveJob } from "../../Hooks/useCurrentActiveJob";
import { useRejectByProfessional } from "../../Hooks/useRejectByProfessional";

// --- CARDS & UTILS ---
import { ServiceRequestCard } from "@/appCOMP/cards/ServiceRequestCard";
import { ActiveJobControlCard } from "@/appCOMP/cards/ActiveJobControlCard";
import { formatForUI } from "@/appSRC/timeAndData/Builder/TimeBuilder";
import { openMapMenu } from "@/appSRC/maps/Hooks/openMapMenu";

const IndexInstantScreen = () => {
  // 1. Trabajo Activo
  const {
    currentJob,
    isLoading: loadingJob,
    refresh: refreshActiveJob,
  } = useCurrentActiveJob();

  const { rejectReservation } = useRejectByProfessional();

  // 2. Radar y Solicitudes
  const { isActive, toggleStatus, isLoading: switchingStatus } = useIsActive();

  // Solo buscamos requests si estamos activos y NO estamos trabajando
  const shouldFetchRequests = isActive && !currentJob;

  const {
    requests,
    loading: loadingData,
    refresh: refreshRequests,
  } = useProIncomingRequests(shouldFetchRequests);

  // 3. Acciones
  const { confirmRequest } = useConfirmInstantReservation();

  const handleManualRefresh = useCallback(() => {
    console.log("🔄 Refrescando tablero...");
    refreshActiveJob();
    if (shouldFetchRequests) refreshRequests();
  }, [refreshActiveJob, refreshRequests, shouldFetchRequests]);

  const handleAccept = async (reservationId: string) => {
    await confirmRequest(reservationId, () => {
      refreshActiveJob();
    });
  };

  const handleReject = async (reservationId: string) => {
    rejectReservation(reservationId, () => {
      console.log("🗑️ Rechazado. Actualizando lista...");
      refreshRequests();
    });
  };

  // --- VISTA ---
  if (loadingJob) return <MiniLoaderScreen />;

  // MODO TRABAJO (Job Activo)
  if (currentJob) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.centerContentScroll}
          refreshControl={
            <RefreshControl
              refreshing={loadingJob}
              onRefresh={handleManualRefresh}
              colors={[COLORS.primary]}
            />
          }>
          <ActiveJobControlCard
            job={currentJob}
            onJobCompleted={refreshActiveJob}
          />
          <Text style={styles.hintText}>Desliza para actualizar</Text>

          {/* --- NUEVO BOTÓN PARA MAPAS --- */}
          <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
            <LargeButton
              title="Ver dirección en Mapa"
              onPress={() => openMapMenu(currentJob.address)}
              iconName="map-outline"
              backgroundColor={COLORS.tertiary}
            />
          </View>
          {/* ----------------------------- */}
        </ScrollView>
      </View>
    );
  }

  // HEADER DEL RADAR
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

  // MODO RADAR (Lista)
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
            />
          }
          renderItem={({ item }) => {
            // ✅ FIX: Usar TimeEngine para la hora
            // Si es instantánea, usamos createdAt. Si no, scheduledStart.
            const targetDate =
              item.modality === "instant"
                ? item.createdAt
                : item.scheduledStart;
            const { time } = formatForUI(targetDate);

            return (
              <ServiceRequestCard
                category={item.serviceTitle} // Usamos serviceTitle mapeado
                price={`$${item.financials.price.toLocaleString()}`} // Usamos financials mapeado
                distance="📍 Cerca"
                location={item.address} // ✅ Usamos la nueva prop address
                title={item.roleName} // El nombre del cliente
                timeAgo={time} // Hora formateada limpia
                onAccept={() => handleAccept(item.id)}
                onDecline={() => handleReject(item.id)}
              />
            );
          }}
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
  centerContentScroll: { flexGrow: 1, justifyContent: "center", padding: 20 },
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
  hintText: { textAlign: "center", color: "#999", fontSize: 12, marginTop: 20 },
});
