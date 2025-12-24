import React from "react";
import { ScrollView, StyleSheet, View, RefreshControl } from "react-native";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import IncomeCard from "@/appCOMP/cards/IncomeCard";
import IncomeCardsContainer from "@/appSRC/incomesProf/Screens/IncomesCardContainer";
import IncomeCharts from "@/appSRC/incomesProf/Screens/IncomeCharts";
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen"; // Usamos tu loader existente
import { useIncomeStats } from "@/appSRC/incomesProf/Hooks/useIncomeStats"; // Importamos el Hook

const incomes = () => {
  // 1. Usamos el Hook para obtener datos y estado
  const { stats, loading, refreshing, onRefresh } = useIncomeStats();

  // 2. Estado de carga inicial
  if (loading) {
    return <MiniLoaderScreen />;
  }

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Ingresos" />

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <View style={styles.contentContainer}>
          <IncomeCardsContainer>
            {/* CARD 1: Ganancias Hoy */}
            <IncomeCard
              title="Ganancias del día"
              value={stats?.incomeToday || 0}
              valueType="money"
              titleVariant="h3"
              boldTitle
              width="full"
            />

            {/* CARD 2: Ganancias Mes */}
            <IncomeCard
              title="Ganancias del mes"
              value={stats?.totalMonth || 0}
              valueType="money"
              titleVariant="h3"
              width="full"
            />

            {/* CARD 3: Por Cobrar */}
            <IncomeCard
              title="Por Cobrar"
              value={stats?.pendingPayment || 0}
              valueType="money"
              titleVariant="h3"
              width="half"
            />

            {/* CARD 4: Mi Servicio (Opcional) */}
            <IncomeCard
              title="Mi servicio"
              value={stats?.topService || "General"}
              valueType="text"
              titleVariant="h3"
              width="half"
            />
          </IncomeCardsContainer>

          {/* CHART: Pasamos la data real del Hook al componente */}
          <IncomeCharts data={stats?.chartData || []} />
        </View>
      </ScrollView>
    </View>
  );
};

export default incomes;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 30,
    paddingBottom: 30,
  },
});
