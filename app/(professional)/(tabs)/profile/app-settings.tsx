import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { useSignOut } from "@/appSRC/auth/Hooks/useSignOut";

export default function ProfessionalAppSettingsScreen() {
  const { handleSignOut } = useSignOut();

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Configuración" showBackButton={true} />
      <View style={styles.content}>
        <LargeButton title="Cerrar Sesión" onPress={handleSignOut} />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  content: { padding: 20, alignItems: "center" },
});
