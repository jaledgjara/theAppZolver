import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSignOut } from "../Hooks/useSignOut";
import { useDeleteAccount } from "../Hooks/useDeleteAccount";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { ActionCard } from "@/appCOMP/cards/ActionCard";
import { COLORS } from "@/appASSETS/theme";

const DestructiveProfileScreen = () => {
  const { handleSignOut } = useSignOut();
  const { requestDeleteAccount } = useDeleteAccount();

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Configuración" showBackButton={true} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* SECCIÓN SESIÓN */}
        <ActionCard
          title="Sesión"
          description="Cierra tu sesión de forma segura. Podrás volver a entrar con tu cuenta en cualquier momento."
          iconName="log-out-outline"
          iconColor={COLORS.primary}
          buttonTitle="Cerrar Sesión"
          buttonColor={COLORS.primary}
          onPress={handleSignOut}
        />

        <View style={styles.spacing} />

        {/* SECCIÓN ZONA DE PELIGRO */}
        <ActionCard
          title="Zona de Peligro"
          description="La eliminación de cuenta es irreversible. Todos tus datos serán borrados permanentemente."
          iconName="alert-circle-outline"
          iconColor={COLORS.error}
          buttonTitle="Eliminar mi Cuenta"
          buttonColor={COLORS.error}
          onPress={requestDeleteAccount}
        />
      </ScrollView>
    </View>
  );
};

export default DestructiveProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  scrollContent: {
    padding: 20,
  },
  spacing: {
    height: 10,
  },
});
