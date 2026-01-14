import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BaseCard } from "./BaseCard";
import { LargeButton } from "../button/LargeButton";
import { COLORS, FONTS } from "@/appASSETS/theme";
import { Ionicons } from "@expo/vector-icons";

interface ActionCardProps {
  title: string;
  description: string;
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  iconColor: string;
  buttonTitle: string;
  buttonColor: string;
  onPress: () => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  iconName,
  iconColor,
  buttonTitle,
  buttonColor,
  onPress,
}) => {
  return (
    <BaseCard>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Ionicons
            name={iconName}
            size={24}
            color={iconColor}
            style={styles.icon}
          />
          <Text style={[styles.title]}>{title}</Text>
        </View>

        <Text style={styles.description}>{description}</Text>

        <LargeButton
          title={buttonTitle}
          onPress={onPress}
          backgroundColor={buttonColor}
          style={styles.button}
        />
      </View>
    </BaseCard>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  icon: {
    marginRight: 10,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.textSecondary,
    fontWeight: "700",
  },
  description: {
    ...FONTS.body4,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  button: {
    marginVertical: 10,
    height: 50,
  },
});
