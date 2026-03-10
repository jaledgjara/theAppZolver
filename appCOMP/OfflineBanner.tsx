import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONTS, SIZES } from "@/appASSETS/theme";

/**
 * A banner that displays when the device has no network connection.
 * Place at the top of the screen layout.
 */
export function OfflineBanner() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Sin conexión a internet</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.error,
    paddingVertical: SIZES.base,
    paddingHorizontal: SIZES.padding,
    alignItems: "center",
  },
  text: {
    ...FONTS.h4,
    color: COLORS.white,
  },
});
