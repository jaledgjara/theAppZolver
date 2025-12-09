import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "@/appASSETS/theme";
import { Address } from "@/appSRC/location/Type/LocationType";

// 🔥 CORRECCIÓN CRÍTICA: Importar con llaves { } desde la raíz
import { Swipeable } from "react-native-gesture-handler";

interface LocationCardProps {
  item: Address;
  isSelected?: boolean;
  onPress: () => void;
  onDelete: () => void;
}

const LocationCard: React.FC<LocationCardProps> = ({
  item,
  isSelected = false,
  onPress,
  onDelete,
}) => {
  // Lógica para elegir el ícono según el label
  const getIcon = () => {
    const labelLower = item.label?.toLowerCase() || "";
    if (labelLower.includes("casa") || labelLower.includes("home")) {
      return <Ionicons name="home-outline" size={24} color={COLORS.tertiary} />;
    }
    if (labelLower.includes("trabajo") || labelLower.includes("work")) {
      return (
        <Ionicons name="briefcase-outline" size={24} color={COLORS.tertiary} />
      );
    }
    return (
      <Ionicons name="location-outline" size={24} color={COLORS.tertiary} />
    );
  };

  // Acción de swipe
  const renderRightActions = (progress: any, dragX: any) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });

    return (
      <TouchableOpacity onPress={onDelete} style={styles.deleteButtonContainer}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="trash-outline" size={28} color="white" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <TouchableOpacity
        style={[styles.container, isSelected && styles.selectedContainer]}
        onPress={onPress}
        activeOpacity={0.7}>
        {/* Icon Circle */}
        <View style={[styles.iconBox, isSelected && styles.selectedIconBox]}>
          {getIcon()}
        </View>

        {/* Text Info */}
        <View style={styles.infoContainer}>
          <View style={styles.row}>
            <Text style={styles.label}>{item.label || "Ubicación"}</Text>
            {item.is_default && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Default</Text>
              </View>
            )}
          </View>
          <Text style={styles.address} numberOfLines={1}>
            {item.address_street} {item.address_number}
          </Text>
        </View>

        {/* Selection Indicator */}
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
        )}
      </TouchableOpacity>
    </Swipeable>
  );
};

export default LocationCard;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedContainer: {
    borderColor: COLORS.primary,
    backgroundColor: "#FFFBF0",
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  selectedIconBox: {
    backgroundColor: "white",
  },
  infoContainer: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  label: {
    ...FONTS.h3,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  address: {
    ...FONTS.body4,
    color: COLORS.textSecondary,
  },
  defaultBadge: {
    backgroundColor: "#E0E0E0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#666",
  },
  deleteButtonContainer: {
    backgroundColor: COLORS.error,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    width: 90,
    height: "85%",
    borderRadius: 16,
    marginBottom: 12,
    marginLeft: 10,
    paddingHorizontal: 10,
  },
  deleteText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 4, // Spacing between icon and text
    textAlign: "center",
  },
});
