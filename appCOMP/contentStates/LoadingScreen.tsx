import { StyleSheet, Text, View } from "react-native";
import React from "react";
import MiniLoaderScreen from "./MiniLoaderScreen";
import { COLORS, SIZES } from "@/appASSETS/theme";

const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <MiniLoaderScreen />
      <Text>Cargando... </Text>
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
    padding: 10,
  },
  title: {
    color: COLORS.textSecondary,
    fontSize: SIZES.body3,
  },
});
