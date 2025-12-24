import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { useProfessionalOnboardingStore } from "@/appSRC/auth/Type/ProfessionalAuthUser"; //

// Importamos las pantallas correspondientes
import IndexInstantScreen from "@/appSRC/reservations/Screens/Instant/IndexInstantScreen";
import IndexQuoteScreen from "@/appSRC/reservations/Screens/Quote/IndexQuoteScreen";
import { useRejectByProfessional } from "@/appSRC/reservations/Hooks/useRejectByProfessional";

const ProfessionalHomeScreen = () => {
  // 1. Obtenemos el tipo de trabajo del Store Global
  const { typeWork } = useProfessionalOnboardingStore();

  // 2. Definimos la lógica de visualización (Clean Code)
  const isInstant = typeWork === "instant";
  const isQuote = typeWork === "quote";
  const isHybrid = typeWork === "all";

  return (
    <View style={styles.container}>
      {/* El título se adapta al contexto del profesional */}
      <ToolBarTitle titleText={isQuote ? "Presupuestos" : "Inicio"} />

      <View style={styles.contentContainer}>
        {/* CASO 1: Profesional de Servicio Inmediato (Uber-like) */}
        {(isInstant || isHybrid) && (
          // Aquí renderizamos la pantalla de Radar/Mapa
          <IndexInstantScreen />
        )}

        {/* CASO 2: Profesional de Presupuestos (Habitissimo-like) */}
        {isQuote && (
          // Aquí renderizamos la pantalla de Bandeja de Entrada
          <IndexQuoteScreen />
        )}

        {/* DEBUG: Si solicitaste ver un texto específico para validar */}
        {/* {typeWork === 'instant' && (
          <View style={styles.debugContainer}>
            <Text>Modo Instantáneo Activo</Text>
          </View>
        )} 
        */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  contentContainer: {
    flex: 1,
  },
  debugContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ProfessionalHomeScreen;
