import { COLORS } from "@/appASSETS/theme";
import React from "react";
import { View, Text, StyleSheet } from "react-native";

// Interfaz para las props que recibe este componente
interface ChartDataPoint {
  label: string;
  value: number;
}

interface IncomeChartsProps {
  data: ChartDataPoint[]; // Ahora recibe datos reales
}

// Colores del sistema
const SECONDARY_COLOR = "#f3d681ff";

// Recibimos 'data' como prop, ya NO hay mock data adentro
const IncomeCharts: React.FC<IncomeChartsProps> = ({ data }) => {
  // Si no hay datos, manejamos un estado vacío seguro
  const chartData =
    data && data.length > 0
      ? data
      : [
          { label: "Sin datos", value: 0 },
          { label: "Sin datos", value: 0 },
          { label: "Sin datos", value: 0 },
        ];

  // 2. Lógica para calcular altura
  const maxValue = Math.max(...chartData.map((d) => d.value)) || 1; // Evitar división por cero
  const MAX_BAR_HEIGHT = 150;

  const formatCurrency = (value: number) => {
    return value.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Rendimiento del Mes</Text>

      <View style={styles.chartContainer}>
        {chartData.map((item, index) => {
          const barHeight =
            item.value === 0 ? 4 : (item.value / maxValue) * MAX_BAR_HEIGHT;

          const isMax = item.value === maxValue && item.value > 0;

          return (
            <View key={index} style={styles.barColumn}>
              <Text
                style={styles.valueLabel}
                numberOfLines={1}
                adjustsFontSizeToFit>
                {formatCurrency(item.value)}
              </Text>

              <View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    backgroundColor: isMax ? COLORS.primary : SECONDARY_COLOR,
                  },
                ]}
              />

              <Text style={styles.periodLabel}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default IncomeCharts;

const styles = StyleSheet.create({
  // ... (Mantén tus estilos exactamente igual que antes)
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    color: "#666",
    marginBottom: 25,
    fontWeight: "600",
    fontSize: 16,
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 180,
  },
  barColumn: {
    alignItems: "center",
    width: "30%",
    justifyContent: "flex-end",
  },
  valueLabel: {
    marginBottom: 6,
    fontSize: 11,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
  },
  bar: {
    width: 24,
    borderRadius: 12,
  },
  periodLabel: {
    marginTop: 8,
    fontSize: 11,
    color: "#888",
    textAlign: "center",
  },
});
