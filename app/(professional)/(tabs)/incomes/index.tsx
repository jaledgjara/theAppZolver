import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import IncomeCard from "@/appCOMP/cards/IncomeCard";
import IncomeCardsContainer from "@/appSRC/incomesProf/Screens/IncomesCardContainer";
import IncomeCharts from "@/appSRC/incomesProf/Screens/IncomeCharts";

// Importamos el hook que creamos arriba
import { useIncomeStats } from "@/appSRC/incomesProf/Hooks/useIncomeStats";
import { COLORS } from "@/appASSETS/theme";

const IncomesScreen = () => {
  // 1. Usamos el hook
  const { stats, loading, refreshing, onRefresh } = useIncomeStats();

  // [DEBUG] Log en el render para ver si stats llega a la UI
  console.log(
    "---- [UI Incomes] Renderizando. Loading:",
    loading,
    "Stats:",
    stats ? "OK" : "NULL"
  );

  // Estado de carga inicial
  if (loading && !stats) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 10, color: "#666" }}>
          Cargando finanzas...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Ingresos" />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <View style={styles.contentContainer}>
          <IncomeCardsContainer>
            {/* Ganancias del Día (Viene del RPC) */}
            <IncomeCard
              title="Ganancias del día"
              value={stats?.incomeToday?.toString() || "0"}
              valueType="money"
              titleVariant="h2"
              boldTitle
              width="full"
            />

            {/* Ganancias del Mes (Viene del RPC) */}
            <IncomeCard
              title="Ganancias del mes"
              value={stats?.totalMonth?.toString() || "0"}
              valueType="money"
              titleVariant="h2"
              width="full"
            />

            {/* Por cobrar (Viene del RPC como 'totalPending') */}
            <IncomeCard
              title="Por cobrar"
              value={stats?.pendingPayment?.toString() || "0"}
              valueType="money"
              titleVariant="h3"
              width="half"
            />

            {/* Servicio Top (Viene del RPC) */}
            <IncomeCard
              title="Mi Servicio"
              value={stats?.topService || "General"}
              valueType="text"
              titleVariant="h3"
              width="half"
            />
          </IncomeCardsContainer>

          {/* Gráfico: Le pasamos la data real del RPC */}
          <IncomeCharts data={stats?.chartData || []} />
        </View>
      </ScrollView>
    </View>
  );
};

export default IncomesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  contentContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
    paddingBottom: 50,
  },
});
