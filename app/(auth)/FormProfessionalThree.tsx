import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import MapView, { Circle, Marker } from "react-native-maps";
import * as Location from "expo-location";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { COLORS, FONTS } from "@/appASSETS/theme";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { Pressable } from "react-native";
import { useProfessionalForm } from "@/appSRC/auth/Hooks/useProfessionalForm";

const FormProfessionalLocationTime = () => {
  const router = useRouter();

  const {
    location,
    coverageRadius,
    serviceModes,
    schedule,
    updateField,
    toggleDay,
    // isLocationValid // Puedes usar esto si lo agregaste al hook
  } = useProfessionalForm();

  // Estado local para el mapa
  const [region, setRegion] = useState({
    latitude: -34.6037, // Buenos Aires default
    longitude: -58.3816,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const [loadingLocation, setLoadingLocation] = useState(false);

  // 1. Solicitar Permisos y Ubicación
  const handleGetCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      // Solicitar permiso
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Necesitamos acceder a tu ubicación para configurar tu zona de trabajo. Por favor, habilítalo en la configuración.",
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Abrir Configuración",
              onPress: () => Linking.openSettings(),
            },
          ]
        );
        setLoadingLocation(false);
        return;
      }

      // Obtener coordenadas
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const newRegion = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.05, // Zoom nivel barrio/ciudad
        longitudeDelta: 0.05,
      };

      setRegion(newRegion);
      updateField("location", {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch (error) {
      Alert.alert(
        "Error",
        "No pudimos obtener tu ubicación. Verifica que el GPS esté activo."
      );
    } finally {
      setLoadingLocation(false);
    }
  };

  useEffect(() => {
    handleGetCurrentLocation();
  }, []);

  const handleContinue = () => {
    if (!location) {
      Alert.alert(
        "Ubicación requerida",
        "Por favor confirma tu ubicación en el mapa."
      );
      return;
    }
    // Guardar y avanzar
    router.push("/(auth)/FormProfessionalPayment");
  };

  // Calculamos el centro del círculo:
  // Usamos 'location' (lo que se guardará) si existe, sino la 'region' del mapa.
  const circleCenter = location
    ? { latitude: location.latitude, longitude: location.longitude }
    : { latitude: region.latitude, longitude: region.longitude };

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Zona y Disponibilidad" showBackButton />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        {/* --- SECCIÓN 1: MAPA --- */}
        <View style={styles.mapSection}>
          <Text style={styles.sectionTitle}>Zona de cobertura</Text>
          <Text style={styles.sectionSubtitle}>
            Mueve el mapa para establecer tu centro de operaciones y usa el
            slider para el radio.
          </Text>

          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              region={region}
              // Al mover el mapa, actualizamos solo la vista, no guardamos todavía para no spammear updates
              onRegionChange={(reg) => setRegion(reg)}
              // Al soltar el mapa, guardamos la ubicación central
              onRegionChangeComplete={(reg) => {
                setRegion(reg);
                updateField("location", {
                  latitude: reg.latitude,
                  longitude: reg.longitude,
                });
              }}>
              {/* Marcador Central */}
              <Marker coordinate={circleCenter} />

              {/* Círculo de Cobertura Dinámico */}
              <Circle
                key={(circleCenter.latitude + coverageRadius).toString()} // Truco para forzar re-render si falla
                center={circleCenter}
                radius={coverageRadius * 1000} // Convertir km a metros
                fillColor="rgba(255, 193, 7, 0.3)" // Primary con transparencia
                strokeColor={COLORS.primary}
                strokeWidth={2}
              />
            </MapView>

            {/* Botón Ubicación Actual */}
            <Pressable
              style={styles.myLocationBtn}
              onPress={handleGetCurrentLocation}
              disabled={loadingLocation}>
              {loadingLocation ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Ionicons name="locate" size={24} color={COLORS.textPrimary} />
              )}
            </Pressable>
          </View>

          {/* Slider */}
          <View style={styles.sliderContainer}>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Radio: {coverageRadius} km</Text>
            </View>
            <Slider
              style={{ width: "100%", height: 40 }}
              minimumValue={1}
              maximumValue={50}
              step={1}
              value={coverageRadius}
              onValueChange={(val) => updateField("coverageRadius", val)} // Actualiza en tiempo real
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor="#E0E0E0"
              thumbTintColor={COLORS.primary}
            />
          </View>
        </View>

        {/* --- SECCIÓN 2: HORARIOS (Opcional) --- */}
        {serviceModes.includes("zolver_ya") && (
          <View style={styles.scheduleSection}>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Disponibilidad Inmediata</Text>

            <View style={styles.daysGrid}>
              {schedule.map((item) => (
                <Pressable
                  key={item.day}
                  style={[styles.dayItem, item.active && styles.dayItemActive]}
                  onPress={() => toggleDay(item.day)}>
                  <Text
                    style={[
                      styles.dayText,
                      item.active && styles.dayTextActive,
                    ]}>
                    {item.day.charAt(0)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={styles.buttonWrapper}>
          <LargeButton
            title="CONTINUAR"
            onPress={handleContinue}
            iconName="arrow-forward-circle-outline"
            disabled={!location}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default FormProfessionalLocationTime;

// ... (Mantén los estilos del paso anterior, están correctos) ...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  mapSection: { paddingHorizontal: 20, marginTop: 20 },
  scheduleSection: { paddingHorizontal: 20, marginTop: 10 },
  sectionTitle: { ...FONTS.h3, color: COLORS.textPrimary, marginBottom: 5 },
  sectionSubtitle: {
    ...FONTS.body4,
    color: COLORS.textSecondary,
    marginBottom: 15,
  },
  mapContainer: {
    height: 280,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#EEE",
    position: "relative",
  },
  map: { width: "100%", height: "100%" },
  myLocationBtn: {
    position: "absolute",
    bottom: 15,
    right: 15,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 30,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  sliderContainer: {
    backgroundColor: COLORS.backgroundLight,
    padding: 15,
    borderRadius: 15,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  label: { fontWeight: "700", color: COLORS.textPrimary, fontSize: 16 },
  divider: { height: 1, backgroundColor: "#EEE", marginVertical: 25 },
  daysGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 20,
  },
  dayItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  dayItemActive: { backgroundColor: COLORS.primary },
  dayText: { fontWeight: "600", color: COLORS.textSecondary },
  dayTextActive: { color: "white" },
  buttonWrapper: { paddingHorizontal: 20, marginTop: 10 },
});
