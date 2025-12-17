import React, { useState } from "react";
import { View, StyleSheet, Text, FlatList, Dimensions } from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { COLORS, FONTS } from "@/appASSETS/theme";
import { useIsActive } from "@/appSRC/users/Professional/Hooks/useIsActive";
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";
import { useProIncomingRequests } from "../../Hooks/useProIncomingRequests";
import { ServiceRequestCard } from "@/appCOMP/cards/ServiceRequestCard";

const IndexInstantScreen = () => {
  // 1. Estado de Disponibilidad (Existente)
  const { isActive, toggleStatus, isLoading: switchingStatus } = useIsActive();

  // 2. Fetching de Datos Reales (Nuevo)
  const {
    requests,
    loading: loadingData,
    refresh,
  } = useProIncomingRequests(isActive);

  // Helper para manejar acciones (Placeholder por ahora)
  const handleAccept = (id: string) => console.log("Aceptar:", id);
  const handleDecline = (id: string) => console.log("Rechazar:", id);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Botón de Estado */}
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
          // Cambiar color según estado si tu componente lo soporta
        />
      </View>

      {/* Radar Visual */}
      <View style={styles.radarContainer}>
        <View style={[styles.radarCircle, !isActive && styles.radarInactive]}>
          {switchingStatus ? (
            <MiniLoaderScreen />
          ) : (
            <FontAwesome5
              name="satellite-dish"
              size={80}
              color={
                isActive ? COLORS.success || "#4CAF50" : COLORS.textSecondary
              }
            />
          )}
        </View>

        <View style={styles.statusTextContainer}>
          <Text style={styles.statusTitle}>
            {isActive ? "Tu ubicación está activa" : "Estás invisible"}
          </Text>
          <Text style={styles.statusSubtitle}>
            {isActive
              ? loadingData
                ? "Buscando servicios..."
                : "Escaneando zona..."
              : "Conéctate para recibir trabajos"}
          </Text>
        </View>
      </View>

      {/* Título de lista */}
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
          onRefresh={refresh}
          refreshing={loadingData}
          renderItem={({ item }) => (
            // AQUI MAPEAR DATOS REALES A TU COMPONENTE VISUAL
            <ServiceRequestCard
              // Datos de UI
              category={item.serviceCategory}
              price={`$${
                item.financials.priceEstimated?.toLocaleString() || "-"
              }`}
              // Lógica de distancia (si tienes lat/lng del pro, calcúlala aquí o en el componente)
              distance="-- km"
              // Dirección real (protegida o completa según lógica de negocio)
              location={item.location.street}
              // Datos extra útiles
              title={item.title}
              timeAgo={item.createdAt.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
              onAccept={() => handleAccept(item.id)}
              onDecline={() => handleDecline(item.id)}
            />
          )}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loadingData ? (
              <Text style={styles.emptyText}>
                No hay solicitudes nuevas en tu zona.
              </Text>
            ) : null
          }
        />
      ) : (
        /* Vista Inactiva: Solo Header */
        <View style={styles.listContent}>{renderHeader()}</View>
      )}
    </View>
  );
};

export default IndexInstantScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" }, // Ajustar a tu theme
  headerContainer: { padding: 20, alignItems: "center" },
  statusSection: { width: "100%", marginBottom: 20 },
  radarContainer: { alignItems: "center", marginVertical: 20 },
  radarCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#E8F5E9", // Light Green
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  radarInactive: { backgroundColor: "#ECEFF1" }, // Light Grey
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
});
