import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Pressable,
} from "react-native";
import {
  MapView,
  Circle,
  Marker,
} from "@/appCOMP/maps/extensions/NativeMapView";
import * as Location from "expo-location";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { COLORS, SIZES } from "@/appASSETS/theme";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { useProfessionalForm } from "@/appSRC/auth/Hooks/useProfessionalForm";

const FormProfessionalThree = () => {
  const router = useRouter();
  const { location, coverageRadius, updateField } = useProfessionalForm();

  const [loadingLocation, setLoadingLocation] = useState(false);
  const [region, setRegion] = useState({
    latitude: -32.8894,
    longitude: -68.8441,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const handleGetCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Habilita la ubicación en configuración."
        );
        setLoadingLocation(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const newRegion = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setRegion(newRegion);
      updateField("location", {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch (error) {
      Alert.alert("Error", "No pudimos obtener tu ubicación.");
    } finally {
      setLoadingLocation(false);
    }
  };

  useEffect(() => {
    handleGetCurrentLocation();
  }, []);

  const handleZoom = (type: "in" | "out") => {
    const multiplier = type === "in" ? 0.7 : 1.5;
    setRegion({
      ...region,
      latitudeDelta: region.latitudeDelta * multiplier,
      longitudeDelta: region.longitudeDelta * multiplier,
    });
  };

  const handleContinue = () => {
    router.push("/(auth)/FormProfessionalFour");
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
          <MapView
            style={styles.map}
            region={region}
            onRegionChangeComplete={(reg: typeof region) => {
              setRegion(reg);
              updateField("location", {
                latitude: reg.latitude,
                longitude: reg.longitude,
              });
            }}>
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
              fillColor="rgba(255, 193, 7, 0.2)"
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
              onPress={handleGetCurrentLocation}>
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
              <Text style={styles.cardSubtitle}>
                Distancia máxima de viaje
              </Text>
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
            onValueChange={(val) => updateField("coverageRadius", val)}
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

        <View style={styles.buttonWrapper}>
          <LargeButton
            title="CONTINUAR"
            onPress={handleContinue}
            iconName="arrow-forward-circle-outline"
            disabled={!location}
          />
        </View>
      </View>
    </View>
  );
};

export default FormProfessionalThree;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FBFBFB" },
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
    backgroundColor: "#EEE",
  },
  map: { width: "100%", height: "100%" },
  mapControls: {
    position: "absolute",
    right: 12,
    top: 12,
    gap: 10,
  },
  zoomBtn: {
    backgroundColor: "white",
    width: 38,
    height: 38,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  locationBtn: { marginTop: 4 },
  layerCard: {
    marginTop: 30,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
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
  buttonWrapper: { marginTop: 30 },
});
