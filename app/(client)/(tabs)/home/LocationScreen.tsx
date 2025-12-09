import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { COLORS, FONTS } from "@/appASSETS/theme";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import LocationCard from "@/appCOMP/cards/LocationCard";
import MyLocation from "@/appSRC/location/Screens/MyLocation";

// Un solo import de lógica
import { useLocation } from "@/appSRC/location/Hooks/useLocation";
import StatusPlaceholder from "@/appCOMP/contentStates/StatusPlaceholder";
import { Address } from "@/appSRC/location/Type/LocationType";

const LocationScreen = () => {
  const router = useRouter();

  // 🟢 HOOK
  const {
    addresses,
    activeAddress,
    loading,
    refreshAddresses,
    selectAddress,
    useCurrentLocation,
    removeAddress,
  } = useLocation();

  const handleDelete = (item: Address) => {
    Alert.alert(
      "Eliminar dirección",
      "¿Estás seguro de que quieres eliminar esta ubicación?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => removeAddress(item.id),
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      refreshAddresses();
    }, [refreshAddresses])
  );

  // 🟢 Handler para el botón GPS
  const handleGPSPress = async () => {
    // 1. Llamamos a la lógica del hook
    const success = await useCurrentLocation();

    // 2. Si tuvo éxito (consiguió coords y actualizó el store), volvemos
    if (success) {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Ubicación" showBackButton={true} />

      <View style={styles.contentContainer}>
        {/* Botón GPS */}
        <MyLocation
          isSelected={activeAddress?.id === "gps_current"}
          onPress={handleGPSPress}
        />

        <Text style={styles.sectionHeader}>Mis Direcciones</Text>

        {/* Lista de Direcciones */}
        {loading && addresses.length === 0 ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={{ marginTop: 20 }}
          />
        ) : (
          <FlatList
            data={addresses}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <LocationCard
                item={item}
                isSelected={activeAddress?.id === item.id}
                onPress={() => {
                  selectAddress(item);
                  router.back();
                }}
                // 🔥 Pass the delete handler
                onDelete={() => handleDelete(item)}
              />
            )}
            ListEmptyComponent={
              <View style={{ marginTop: 20 }}>
                <StatusPlaceholder
                  icon="map-marker-off-outline"
                  title="Sin direcciones"
                  subtitle="Aún no has guardado ninguna ubicación. Agrega una para comenzar."
                  // Opcional: Agregar botón aquí si quieres, o dejar solo el flotante
                />
              </View>
            }
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}

        <View style={styles.floatingButton}>
          <LargeButton
            title={"Agregar Nueva"}
            onPress={() => router.push("/(client)/home/AddLocationScreen")}
            iconName="add-circle-outline"
          />
        </View>
      </View>
    </View>
  );
};

export default LocationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  // Estilos para el bloque de GPS
  gpsContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  gpsSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#FFFBF0",
  },
  gpsIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  gpsTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
  gpsSubtitle: {
    ...FONTS.body4,
    color: COLORS.textSecondary,
  },

  sectionHeader: {
    ...FONTS.h3,
    fontWeight: "bold",
    color: COLORS.textSecondary,
    marginBottom: 15,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
    fontSize: 16,
  },
  floatingButton: {},
});
