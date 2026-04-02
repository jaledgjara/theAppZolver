import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { MapView, Circle, Marker } from "@/appCOMP/maps/extensions/NativeMapView";
import * as Location from "expo-location";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { COLORS, FONTS, SIZES } from "@/appASSETS/theme";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { Pressable } from "react-native";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { useProfessionalLocation } from "@/appSRC/users/Professional/General/Hooks/useProfessionalLocation";
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";

const ProfessionalMapAreaScreen = () => {
  const { user } = useAuthStore();
  const {
    saveLocation,
    getCurrentLocation,
    fetchSavedLocation,
    isSaving,
    loadingLocation,
    loading,
  } = useProfessionalLocation(user?.uid || "");

  const [coverageRadius, setCoverageRadius] = useState(10);
  const [region, setRegion] = useState({
    latitude: -32.8894,
    longitude: -68.8441,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    const loadData = async () => {
      console.log("📱 [SCREEN] useEffect [loadData] iniciado");
      const saved = await fetchSavedLocation();
      if (saved) {
        console.log("📱 [SCREEN] Sobreescribiendo region con datos guardados");
        setRegion({
          latitude: saved.coords.latitude,
          longitude: saved.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
        setCoverageRadius(saved.radius);
      } else {
        console.log("📱 [SCREEN] Manteniendo region por defecto");
      }
    };
    if (user?.uid) loadData();
  }, [user?.uid]);

  const handleGetCurrentLocation = async () => {
    console.log("📱 [SCREEN] Botón GPS presionado");
    const newRegion = await getCurrentLocation();
    if (newRegion) {
      console.log("📱 [SCREEN] Actualizando mapa a ubicación GPS");
      setRegion(newRegion);
    }
  };

  // Log cada vez que la region cambia por el drag del usuario
  const onRegionChange = (newRegion: any) => {
    // console.log("📱 [SCREEN] Region cambiada (Drag):", newRegion.latitude, newRegion.longitude);
    setRegion(newRegion);
  };

  if (loading) return <MiniLoaderScreen />;
  // --- Lógica de Zoom Refinada (Pasos más cortos) ---
  const handleZoom = (type: "in" | "out") => {
    const multiplier = type === "in" ? 0.7 : 1.5; // Zoom más suave
    setRegion({
      ...region,
      latitudeDelta: region.latitudeDelta * multiplier,
      longitudeDelta: region.longitudeDelta * multiplier,
    });
  };

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Área de Servicio" showBackButton={true} />

      <View style={styles.content}>
        <View style={styles.headerText}>
          <Text style={styles.sectionTitle}>Zona de Cobertura</Text>
          <Text style={styles.sectionSubtitle}>
            Ubica el centro de tu actividad y define el radio de alcance.
          </Text>
        </View>

        <View style={styles.mapWrapper}>
          <MapView style={styles.map} region={region} onRegionChangeComplete={setRegion}>
            <Marker
              coordinate={{
                latitude: region.latitude,
                longitude: region.longitude,
              }}
            />
            <Circle
              center={{
                latitude: region.latitude,
                longitude: region.longitude,
              }}
              radius={coverageRadius * 1000}
              fillColor={`${COLORS.accent}33`}
              strokeColor={COLORS.primary}
            />
          </MapView>

          <View style={styles.mapControls}>
            <Pressable style={styles.zoomBtn} onPress={() => handleZoom("in")}>
              <Ionicons name="add" size={18} color={COLORS.textPrimary} />
            </Pressable>
            <Pressable style={styles.zoomBtn} onPress={() => handleZoom("out")}>
              <Ionicons name="remove" size={18} color={COLORS.textPrimary} />
            </Pressable>
            <Pressable
              style={[styles.zoomBtn, styles.locationBtn]}
              onPress={handleGetCurrentLocation}
            >
              {loadingLocation ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Ionicons name="locate" size={20} color={COLORS.primary} />
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.layerCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardLabel}>Radio de Trabajo</Text>
              <Text style={styles.cardSubtitle}>Distancia máxima de viaje</Text>
            </View>
            <View style={styles.radiusBadge}>
              <Text style={styles.radiusText}>{coverageRadius} km</Text>
            </View>
          </View>

          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={50}
            step={1}
            value={coverageRadius}
            onValueChange={setCoverageRadius}
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor="#F0F0F0"
            thumbTintColor={COLORS.primary}
          />

          <View style={styles.cardFooterInfo}>
            <Ionicons name="location" size={18} color={COLORS.tertiary} />
            <Text style={styles.footerText}>
              Los clientes te verán si están dentro de este radio.
            </Text>
          </View>
        </View>

        <View>
          <LargeButton
            title={isSaving ? "Guardando..." : "Guardar Zona"}
            iconName="location-outline"
            disabled={isSaving}
            onPress={() => saveLocation(region, coverageRadius)}
          />
        </View>
      </View>
    </View>
  );
};

export default ProfessionalMapAreaScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  headerText: { marginBottom: 20 },
  sectionTitle: {
    fontSize: SIZES.h3,
    color: COLORS.textPrimary,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: SIZES.h4,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  mapWrapper: {
    height: "40%",
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    backgroundColor: COLORS.border,
  },
  map: { width: "100%", height: "100%" },

  // Controles de Zoom (Small design)
  mapControls: {
    position: "absolute",
    right: 12,
    top: 12,
    gap: 10,
  },
  zoomBtn: {
    backgroundColor: COLORS.bgCard,
    width: 38,
    height: 38,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: COLORS.brandDeep,
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  locationBtn: { marginTop: 4 },

  // Layer Card Slider
  layerCard: {
    marginTop: 30,
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    padding: 20,
    // Sombra suave para efecto de capa
    shadowColor: COLORS.brandDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  cardLabel: {
    fontSize: SIZES.h3,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  cardSubtitle: {
    fontSize: SIZES.h4,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  radiusBadge: {
    backgroundColor: COLORS.backgroundLight,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
  },
  radiusText: { fontSize: 15, fontWeight: "600", color: COLORS.primary },
  slider: { width: "100%", height: 50 },
  cardFooterInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 12,
  },
  footerText: { fontSize: SIZES.radius, color: COLORS.textSecondary },

  footer: {
    padding: 20,
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});
