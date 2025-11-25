import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
} from "react-native";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { COLORS, SIZES } from "@/appASSETS/theme";
import { LargeButton } from "../button/LargeButton";

interface LocationActionsProps {
  address: string;
  latitude: number;
  longitude: number;
  onOnTheWay?: () => void;
  onArrived?: () => void;
}

export const ReservationLocationActions: React.FC<LocationActionsProps> = ({
  address,
  latitude,
  longitude,
  onOnTheWay,
  onArrived,
}) => {
  const openMaps = () => {
    const google = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    const waze = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
    const apple = `http://maps.apple.com/?ll=${latitude},${longitude}`;

    const url = Platform.select({
      ios: apple,
      android: google,
      default: google,
    });

    Linking.openURL(url!);
  };

  return (
    <View style={styles.card}>
      {/* Address Link */}
      <TouchableOpacity style={styles.addressRow} onPress={openMaps} activeOpacity={0.7}>
        <View style={{ flex: 1 }}>
          <Text style={styles.addressLabel}>Ubicación:</Text>

          <View style={styles.addressLinkRow}>
            <Text style={styles.addressText}>{address}</Text>
          </View>
        </View>

        <FontAwesome5 name="map-marked-alt" size={50} color={COLORS.textSecondary} />
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.btnLight} onPress={onOnTheWay}>
          <Text style={styles.btnDarkText}>En camino</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnPrimary} onPress={onArrived}>
          <Text style={styles.btnPrimaryText}>Llegué</Text>
        </TouchableOpacity>
      </View>

      {/* Footer Large Button */}
      <LargeButton
        title={"Marcar como completada"}
        iconName="checkmark-circle"
        style={{ marginVertical: 10 }}
        onPress={() => console.log("Completado")}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    marginHorizontal: 20,
    paddingVertical: 28,       // equal top & bottom padding
    paddingHorizontal: 22,
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 4,

    // Smooth vertical alignment
    justifyContent: "center",
    gap: 26,                   // perfect spacing between sections
  },

  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // perfect horizontal alignment
  },

  addressLabel: {
    fontSize: SIZES.h2,
    fontWeight: "600",
    color: "#444",
    marginBottom: 4,
  },

  addressLinkRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  addressText: {
    fontSize: SIZES.body2,
    color: COLORS.textSecondary,
    textDecorationLine: "underline",
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
    marginTop: 7
  },

  btnLight: {
    flex: 1,
    backgroundColor: "#F1F1F1",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },

  btnPrimary: {
    flex: 1,
    backgroundColor: COLORS.tertiary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },

  btnDarkText: {
    fontWeight: "600",
    color: "#333",
  },

  btnPrimaryText: {
    fontWeight: "600",
    color: "#FFF",
  },
});
