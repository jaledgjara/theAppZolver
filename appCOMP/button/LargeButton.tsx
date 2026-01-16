import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
  ActivityIndicator,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES } from "@/appASSETS/theme";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

interface LargeButtonProps {
  title: string;
  onPress: () => void;

  /** Custom styling */
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  textColor?: string;
  disabled?: boolean;

  /** Optional icon */
  iconName?: IoniconName;
  iconColor?: string;
  iconSize?: number;

  /** Loader */
  loading?: boolean;
  loaderColor?: string;
}

export const LargeButton: React.FC<LargeButtonProps> = ({
  title,
  onPress,
  style,
  backgroundColor = COLORS.primary,
  textColor = COLORS.white,
  disabled = false,
  iconName,
  iconColor,
  iconSize = 22,
  loading = false,
  loaderColor,
}) => {
  const isDisabled = disabled || loading;

  // Default margin — only applies if user does not override margin in style
  const defaultMargin = { marginVertical: 30 };

  // Merge logic: user styles always override default margin
  const mergedStyle = Array.isArray(style)
    ? [defaultMargin, ...style]
    : [defaultMargin, style];

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={isDisabled}
      onPress={onPress}
      style={[
        styles.buttonContainer,
        { backgroundColor: isDisabled ? "#CFCFCF" : backgroundColor },
        mergedStyle, // THIS handles the default + override logic
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={loaderColor || textColor} />
      ) : (
        <View style={styles.contentRow}>
          {iconName && (
            <Ionicons
              name={iconName}
              size={iconSize}
              color={iconColor || textColor}
              style={styles.iconStyle}
            />
          )}

          <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 50,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },

  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  iconStyle: {
    marginRight: 8,
  },

  buttonText: {
    fontSize: SIZES.h3,
    fontWeight: "600",
    textAlign: "center",
  },
});
