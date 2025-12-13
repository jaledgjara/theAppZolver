import React, { useState } from "react";
import { View, StyleSheet, Text, FlatList, Dimensions } from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { COLORS, FONTS } from "@/appASSETS/theme";
import ServiceRequestCard from "@/appCOMP/cards/ServiceRequestCard";

// Mock Data (Simulando respuesta de Supabase)
const MOCK_REQUESTS = [
  {
    id: "1",
    category: "Cerrajero",
    price: "$15.000",
    distance: "1.2 km",
    location: "Av. San Martín 1234, Ciudad",
  },
  {
    id: "2",
    category: "Plomería",
    price: "$22.500",
    distance: "3.5 km",
    location: "Calle Las Heras 450, Godoy Cruz",
  },
];

const IndexInstantScreen = () => {
  const [isActive, setIsActive] = useState(true);

  // Componente que contiene la parte superior estática
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.statusSection}>
        <LargeButton
          title={isActive ? "ESTOY ACTIVO" : "DESCONECTADO"}
          onPress={() => setIsActive(!isActive)}
          // Nota: Podrías añadir lógica en LargeButton para cambiar color según isActive
        />
      </View>

      <View style={styles.radarContainer}>
        <View style={[styles.radarCircle, !isActive && styles.radarInactive]}>
          <FontAwesome5
            name="satellite-dish"
            size={80}
            color={
              isActive ? COLORS.success || "#4CAF50" : COLORS.textSecondary
            }
          />
        </View>

        <View style={styles.statusTextContainer}>
          <Text style={styles.statusTitle}>
            {isActive ? "Tu ubicación está activa" : "Estás invisible"}
          </Text>
          <Text style={styles.statusSubtitle}>
            {isActive
              ? "Escaneando servicios cercanos..."
              : "Conéctate para recibir trabajos"}
          </Text>
        </View>
      </View>

      {isActive && (
        <Text style={styles.sectionTitle}>
          Solicitudes Entrantes ({MOCK_REQUESTS.length})
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {isActive ? (
        <FlatList
          data={MOCK_REQUESTS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ServiceRequestCard
              category={item.category}
              price={item.price}
              distance={item.distance}
              location={item.location}
              onAccept={() => console.log("Aceptar", item.id)}
              onDecline={() => console.log("Rechazar", item.id)}
            />
          )}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No hay solicitudes por el momento.
            </Text>
          }
        />
      ) : (
        /* Si está inactivo, solo mostramos el header sin lista */
        <View style={styles.listContent}>{renderHeader()}</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA", // Fondo ligeramente gris para resaltar tarjetas blancas
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  statusSection: {
    width: "100%",
    marginVertical: 20,
  },
  radarContainer: {
    alignItems: "center",
    marginVertical: 20,
    padding: 20,
  },
  radarCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: (COLORS.success || "#4CAF50") + "15", // Opacidad baja
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: (COLORS.success || "#4CAF50") + "30",
  },
  radarInactive: {
    backgroundColor: "#E0E0E0",
    borderColor: "#BDBDBD",
  },
  statusTextContainer: {
    alignItems: "center",
  },
  statusTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statusSubtitle: {
    ...FONTS.body4,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  sectionTitle: {
    ...FONTS.h3,
    alignSelf: "flex-start",
    marginTop: 10,
    marginBottom: 10,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.textSecondary,
    marginTop: 20,
    fontStyle: "italic",
  },
});

export default IndexInstantScreen;
