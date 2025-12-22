import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";

export default function ProfessionalNotificationsScreen() {
  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Notificaciones" showBackButton={true} />
      <View style={styles.content}>
        <Text>Configuración de alertas.</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  content: { padding: 20 },
});
