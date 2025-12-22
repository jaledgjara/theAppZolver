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

// 1. Assets & Theme
import { COLORS, FONTS } from "@/appASSETS/theme";

// 2. Componentes UI Reutilizables (Architecture Consistency)
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import LocationCard from "@/appCOMP/cards/LocationCard"; // Usamos la Card estandarizada
import MyLocation from "@/appSRC/location/Screens/MyLocation"; // Usamos el componente GPS
import StatusPlaceholder from "@/appCOMP/contentStates/StatusPlaceholder";

// 3. Lógica de Negocio (Core Location)
import { useLocation } from "@/appSRC/location/Hooks/useLocation";
import { Address } from "@/appSRC/location/Type/LocationType";

export default function AddressesScreen() {
  const router = useRouter();

  // Hook Global
  const {
    addresses,
    activeAddress,
    loading,
    refreshAddresses,
    selectAddress,
    useCurrentLocation,
    removeAddress,
  } = useLocation();

  // Recargar datos cada vez que la pantalla gana foco (ej: al volver de "Agregar")
  useFocusEffect(
    useCallback(() => {
      refreshAddresses();
    }, [refreshAddresses])
  );

  // Lógica: Eliminar
  const handleDelete = (item: Address) => {
    Alert.alert(
      "Eliminar dirección",
      "¿Estás seguro de que quieres eliminar esta ubicación?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            // removeAddress ya maneja el estado de carga internamente si el hook está bien hecho,
            // pero aquí confiamos en el refresh automático o actualización optimista.
            await removeAddress(item.id);
          },
        },
      ]
    );
  };

  // Lógica: Usar GPS
  const handleGPSPress = async () => {
    const success = await useCurrentLocation();

    if (success) {
      Alert.alert(
        "Ubicación Actualizada",
        "Se ha establecido tu ubicación actual."
      );
    }
  };

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Mis Direcciones" showBackButton={true} />

      <View style={styles.contentContainer}>
        {/* 1. Opción de GPS / Ubicación Actual */}
        <MyLocation
          isSelected={activeAddress?.id === "gps_current"}
          onPress={handleGPSPress}
        />

        <Text style={styles.sectionHeader}>Mis Direcciones</Text>

        {/* 2. Lista de Direcciones */}
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
                // En Perfil: Click = Seleccionar como activa (sin salir)
                onPress={() => selectAddress(item)}
                // Habilitamos la eliminación
                onDelete={() => handleDelete(item)}
              />
            )}
            ListEmptyComponent={
              <View style={{ marginTop: 20 }}>
                <StatusPlaceholder
                  icon="map-marker-off-outline"
                  title="Sin direcciones"
                  subtitle="No tienes lugares guardados. Agrega Casa o Trabajo para agilizar."
                />
              </View>
            }
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}

        {/* 3. Botón de Acción Principal */}
        <View style={styles.footerContainer}>
          <LargeButton
            title="Agregar Nueva"
            onPress={() =>
              router.push("/(client)/(tabs)/profile/AddLocationScreen")
            }
            iconName="add-circle-outline"
          />
        </View>
      </View>
    </View>
  );
}

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
  sectionHeader: {
    ...FONTS.h3, // Usar tipografía de tema
    fontWeight: "bold",
    color: COLORS.textSecondary,
    marginBottom: 10,
    marginTop: 10,
  },
  footerContainer: {
    paddingVertical: 10,
  },
});
