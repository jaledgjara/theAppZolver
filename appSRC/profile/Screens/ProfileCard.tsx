import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { EvilIcons } from "@expo/vector-icons";
import { SIZES, COLORS } from "@/appASSETS/theme";

interface ProfileCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  icon,
  title,
  subtitle,
}) => {
  return (
    <View style={styles.container}>
      {/* Left icon */}
      <View style={styles.iconContainer}>{icon}</View>

      {/* Text block */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {/* Right navigation arrow */}
      <View style={styles.arrowContainer}>
        <EvilIcons name="chevron-right" size={32} color="#999" />
      </View>
    </View>
  );
};

export default ProfileCard;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    alignItems: "center",
    paddingVertical: 22,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },

  // Icon at the left side
  iconContainer: {
    marginRight: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  // Main text content
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: SIZES.h3,
    color: COLORS.textPrimary,
    fontWeight: "bold",
    marginBottom: 3,
  },
  subtitle: {
    fontSize: SIZES.h4,
    color: COLORS.textSecondary,
  },

  // Arrow on the right
  arrowContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 12,
  },
});
