import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  ActivityIndicator,
  Switch,
  Platform,
  TouchableOpacity,
  Modal,
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
import DateTimePicker from "@react-native-community/datetimepicker";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { COLORS, FONTS, SIZES } from "@/appASSETS/theme";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { Pressable } from "react-native";
import { useProfessionalForm } from "@/appSRC/auth/Hooks/useProfessionalForm";

// Helper para mostrar nombres completos
const getFullDayName = (shortDay: string) => {
  const map: Record<string, string> = {
    Lun: "Lunes",
    Mar: "Martes",
    Mié: "Miércoles",
    Jue: "Jueves",
    Vie: "Viernes",
    Sáb: "Sábado",
    Dom: "Domingo",
  };
  return map[shortDay] || shortDay;
};

// Helper para convertir string "HH:mm" a Date
const parseTime = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const FormProfessionalLocationTime = () => {
  const router = useRouter();

  const { location, coverageRadius, schedule, updateField, toggleDay } =
    useProfessionalForm();

  const [region, setRegion] = useState({
    latitude: -34.6037,
    longitude: -58.3816,
    latitudeDelta: 0.2,
    longitudeDelta: 0.2,
  });

  const [loadingLocation, setLoadingLocation] = useState(false);

  // --- Lógica del TimePicker ---
  const [showPicker, setShowPicker] = useState(false);
  const [pickerConfig, setPickerConfig] = useState<{
    day: string;
    type: "from" | "to";
    value: Date;
  } | null>(null);

  // Abrir el picker
  const openTimePicker = (
    day: string,
    type: "from" | "to",
    currentTime: string,
  ) => {
    setPickerConfig({
      day,
      type,
      value: parseTime(currentTime),
    });
    setShowPicker(true);
  };

  // Confirmar cambio de hora
  const handleTimeChange = (event: any, selectedDate?: Date) => {
    // En Android el picker se cierra solo al seleccionar
    if (Platform.OS === "android") setShowPicker(false);

    if (selectedDate && pickerConfig) {
      // Formato HH:mm
      const hours = selectedDate.getHours().toString().padStart(2, "0");
      const minutes = selectedDate.getMinutes().toString().padStart(2, "0");
      const newTimeStr = `${hours}:${minutes}`;

      // Actualizar el estado global
      const newSchedule = schedule.map((item) => {
        if (item.day === pickerConfig.day) {
          return { ...item, [pickerConfig.type]: newTimeStr };
        }
        return item;
      });

      updateField("schedule", newSchedule);

      // Actualizar valor local temporal (para iOS UX)
      if (Platform.OS === "ios") {
        setPickerConfig({ ...pickerConfig, value: selectedDate });
      }
    } else if (!selectedDate && Platform.OS === "android") {
      // Cancelado en Android
      setShowPicker(false);
    }
  };

  // Cerrar modal (iOS)
  const closePicker = () => {
    setShowPicker(false);
    setPickerConfig(null);
  };

  // --- Geolocalización ---
  const handleGetCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Habilita la ubicación en configuración.",
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
        latitudeDelta: 0.25,
        longitudeDelta: 0.25,
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

  const handleContinue = () => {
    router.push("/(auth)/FormProfessionalFour");
  };

  const circleCenter = location
    ? { latitude: location.latitude, longitude: location.longitude }
    : { latitude: region.latitude, longitude: region.longitude };

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Horario y Cobertura" showBackButton />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}>
        {/* --- MAPA --- */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Zona de Cobertura</Text>
          <Text style={styles.sectionSubtitle}>
            Define el radio máximo (en km) donde ofreces tus servicios.
          </Text>

          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              region={region}
              onRegionChange={(reg) => setRegion(reg)}
              onRegionChangeComplete={(reg) => {
                setRegion(reg);
                updateField("location", {
                  latitude: reg.latitude,
                  longitude: reg.longitude,
                });
              }}>
              <Marker coordinate={circleCenter} />
              <Circle
                key={(circleCenter.latitude + coverageRadius).toString()}
                center={circleCenter}
                radius={coverageRadius * 1000}
                fillColor="rgba(255, 193, 7, 0.3)"
                strokeColor={COLORS.primary}
                strokeWidth={2}
              />
            </MapView>

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

            <View style={styles.floatingSliderCard}>
              <Text style={styles.sliderLabel}>Radio: {coverageRadius} km</Text>
              <Slider
                style={{ width: "100%", height: 30 }}
                minimumValue={1}
                maximumValue={50}
                step={1}
                value={coverageRadius}
                onValueChange={(val) => updateField("coverageRadius", val)}
                minimumTrackTintColor={COLORS.primary}
                maximumTrackTintColor="#E0E0E0"
                thumbTintColor={COLORS.primary}
              />
            </View>
          </View>
        </View>

        {/* --- HORARIOS --- */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Disponibilidad Horaria</Text>
          <Text style={styles.sectionSubtitle}>
            Selecciona los días y el rango horario en que trabajas.
          </Text>

          <View style={styles.scheduleList}>
            {schedule.map((item, index) => (
              <View
                key={item.day}
                style={[
                  styles.scheduleRow,
                  index !== schedule.length - 1 && styles.borderBottom,
                ]}>
                {/* Nombre del día */}
                <Text style={styles.dayNameLabel}>
                  {getFullDayName(item.day)}
                </Text>

                <View style={styles.rightRow}>
                  {/* Selector de Horas (Clickeable solo si está activo) */}
                  <View style={styles.timeWrapper}>
                    <TouchableOpacity
                      onPress={() =>
                        item.active &&
                        openTimePicker(item.day, "from", item.from)
                      }
                      disabled={!item.active}>
                      <Text
                        style={[
                          styles.timeLabel,
                          !item.active && { color: "#ccc" },
                        ]}>
                        {item.from}
                      </Text>
                    </TouchableOpacity>

                    <Text
                      style={[
                        styles.timeSeparator,
                        !item.active && { color: "#ccc" },
                      ]}>
                      {" "}
                      -{" "}
                    </Text>

                    <TouchableOpacity
                      onPress={() =>
                        item.active && openTimePicker(item.day, "to", item.to)
                      }
                      disabled={!item.active}>
                      <Text
                        style={[
                          styles.timeLabel,
                          !item.active && { color: "#ccc" },
                        ]}>
                        {item.to}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Switch */}
                  <Switch
                    trackColor={{ false: "white", true: COLORS.tertiary }}
                    thumbColor={"white"}
                    ios_backgroundColor="#E0E0E0"
                    onValueChange={() => toggleDay(item.day)}
                    value={item.active}
                    style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
                  />
                </View>
              </View>
            ))}
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
      </ScrollView>

      {/* --- TIME PICKER MODAL (Cross Platform) --- */}
      {/* --- TIME PICKER MODAL (Cross Platform) --- */}
      {showPicker &&
        pickerConfig &&
        (Platform.OS === "ios" ? (
          <Modal transparent animationType="fade" visible={showPicker}>
            <View style={styles.modalOverlay}>
              <View style={styles.iosPickerContainer}>
                <View style={styles.iosPickerHeader}>
                  <Text style={styles.iosPickerTitle}>
                    {pickerConfig.type === "from"
                      ? "Hora de inicio"
                      : "Hora de fin"}{" "}
                    - {getFullDayName(pickerConfig.day)}
                  </Text>
                </View>

                {/* 👇 CAMBIO CLAVE: Estilo explícito para forzar renderizado en iOS */}
                <DateTimePicker
                  value={pickerConfig.value}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                  textColor="black"
                  locale="es-ES"
                  is24Hour={true}
                  style={styles.iosPicker} // <--- AÑADIDO
                />

                <TouchableOpacity
                  onPress={closePicker}
                  style={styles.iosConfirmButton}>
                  <Text style={styles.iosConfirmText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={pickerConfig.value}
            mode="time"
            display="default"
            onChange={handleTimeChange}
            is24Hour={true}
          />
        ))}
    </View>
  );
};

export default FormProfessionalLocationTime;

const styles = StyleSheet.create({
  // ... (tus otros estilos anteriores se mantienen igual) ...
  container: { flex: 1, backgroundColor: "#F9F9F9" },
  sectionContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    ...FONTS.h3,
    fontSize: SIZES.h3,
    color: COLORS.textPrimary,
    marginBottom: 7,
    fontWeight: "600",
  },
  sectionSubtitle: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
    marginBottom: 12,
    fontSize: SIZES.body3,
  },
  mapContainer: {
    height: 350,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  map: { width: "100%", height: "100%" },
  myLocationBtn: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 25,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  floatingSliderCard: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  sliderLabel: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  scheduleList: {
    backgroundColor: "white",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  dayNameLabel: { fontSize: 16, fontWeight: "500", color: "#333" },
  rightRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  timeWrapper: { flexDirection: "row", alignItems: "center" },
  timeLabel: {
    fontSize: 15,
    color: "#333",
    fontWeight: "600",
    paddingHorizontal: 4,
  },
  timeSeparator: { fontSize: 15, color: "#333", fontWeight: "600" },
  buttonWrapper: { paddingHorizontal: 20, marginTop: 30 },

  // --- MODAL STYLES ---
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  iosPickerContainer: {
    backgroundColor: "white",
    paddingBottom: 30, // Un poco más de padding abajo
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: "center", // Centrar hijos
  },
  iosPickerHeader: {
    width: "100%",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "center",
    marginBottom: 10,
  },
  iosPickerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  // 👇 ESTILO NUEVO PARA EL PICKER
  iosPicker: {
    width: "100%",
    height: 200, // Altura explícita necesaria en iOS
    backgroundColor: "white",
  },
  iosConfirmButton: {
    backgroundColor: COLORS.primary,
    width: "90%", // Botón ancho
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 15,
  },
  iosConfirmText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
