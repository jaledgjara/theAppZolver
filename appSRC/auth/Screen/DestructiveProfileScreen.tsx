import { ScrollView, StyleSheet, Text, View } from "react-native";
import React from "react";
import { useSignOut } from "../Hooks/useSignOut";
import { useDeleteAccount } from "../Hooks/useDeleteAccount";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { LargeButton } from "@/appCOMP/button/LargeButton";

const DestructiveProfileScreen = () => {
  const { handleSignOut } = useSignOut();
  const { requestDeleteAccount } = useDeleteAccount();

  return (
    <View style={styles.container}>
      {/* 1. Toolbar Reutilizable */}
      <ToolBarTitle titleText="Configuración" showBackButton={true} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* SECCIÓN 1: SESIÓN */}
        <View style={styles.sectionContainer}>
          <Text style={styles.subTitle}>Sesión</Text>
          <Text style={styles.description}>
            Cierra tu sesión actual de forma segura. Podrás volver a ingresar en
            cualquier momento.
          </Text>

          <LargeButton
            title="Cerrar Sesión"
            onPress={handleSignOut}
            // Si LargeButton soporta variantes, usar 'outline' o 'secondary' aquí sería ideal
          />
        </View>

        <View style={styles.separator} />

        {/* SECCIÓN 2: ZONA DE PELIGRO */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.subTitle, { color: "red" }]}>
            Zona de Peligro
          </Text>
          <Text style={styles.description}>
            La eliminación de cuenta es irreversible. Todos tus datos asociados
            serán borrados de nuestros servidores.
          </Text>

          <LargeButton
            title="Eliminar mi Cuenta"
            onPress={requestDeleteAccount}
            backgroundColor="red"
            style={{
              borderColor: "red",
              borderWidth: 1,
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default DestructiveProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionContainer: {
    marginBottom: 10,
    gap: 15,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 10,
  },
  separator: {
    height: 1,
    backgroundColor: "#EEE",
    marginVertical: 30,
  },
});
