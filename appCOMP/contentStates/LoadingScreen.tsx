import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import React from "react";
import MiniLoaderScreen from "./MiniLoaderScreen";
import { COLORS, SIZES } from "@/appASSETS/theme";

const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.textSecondary} />
      <Text style={styles.title}>CARGANDO... </Text>
    </View>
  );
};

export default LoadingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: COLORS.textSecondary,
    fontSize: SIZES.body3,
    fontWeight: "600",
    marginTop: 10,
  },
});
