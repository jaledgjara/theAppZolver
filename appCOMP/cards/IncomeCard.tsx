// IncomeCard.tsx
// Reusable card component for income-related metrics

import { COLORS, SIZES } from "@/appASSETS/theme";
import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface IncomeCardProps {
  title: string;
  value: string | number;
  valueType: "money" | "text" | "number";
  titleVariant?: "h2" | "h3";
  boldTitle?: boolean;
  width?: "full" | "half";
  subtitle?: string;
}

const IncomeCard: React.FC<IncomeCardProps> = ({
  title,
  value,
  valueType,
  titleVariant = "h3",
  boldTitle = false,
  width = "full",
  subtitle,
}) => {
  // Format money values for Argentina / LATAM style
  const formatMoney = (amount: number | string) => {
    if (typeof amount === "string") amount = Number(amount);
    return `$${amount.toLocaleString("es-AR", {
      minimumFractionDigits: 2,
    })}`;
  };

  // Render value based on type
  const renderValue = () => {
    if (valueType === "money") {
      return <Text style={styles.moneyValue}>{formatMoney(value)}</Text>;
    }

    if (valueType === "number") {
      return <Text style={styles.numberValue}>{value}</Text>;
    }

    return <Text style={styles.textValue}>{String(value)}</Text>;
  };

  return (
    <View
      style={[
        styles.card,
        width === "half" && styles.halfWidth,
        width === "full" && styles.fullWidth,
      ]}>
      <Text style={[titleVariant === "h2" ? styles.titleH2 : styles.titleH3]}>
        {title}
      </Text>

      {renderValue()}

      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

export default IncomeCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 16,
    marginBottom: 16,

    // Shadow for iOS
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,

    // Android shadow
    elevation: 2,
  },

  // Width presets
  fullWidth: {
    width: "100%",
  },
  halfWidth: {
    width: "48%",
  },

  // Titles
  titleH2: {
    fontSize: SIZES.h2,
    color: COLORS.textPrimary,
    marginBottom: 6,
    fontWeight: "600",
  },
  titleH3: {
    fontSize: SIZES.h3,
    color: COLORS.textPrimary,
    marginBottom: 6,
    fontWeight: "600",
  },
  // Values
  moneyValue: {
    fontSize: SIZES.h3,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  numberValue: {
    fontSize: SIZES.h3,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  textValue: {
    fontSize: SIZES.h3,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
