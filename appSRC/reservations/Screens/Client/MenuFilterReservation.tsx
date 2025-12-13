import { COLORS } from "@/appASSETS/theme";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// ENUM: 3 Tipos de filtros
type ReservationFilter = "upcoming" | "completed" | "canceled";

// INTERFACE: Props del componente
interface TabbedReservationFiltersProps {
  currentFilter: ReservationFilter;
  onFilterChange: (filter: ReservationFilter) => void;
}

export const TabbedReservationFilters: React.FC<
  TabbedReservationFiltersProps
> = ({ currentFilter, onFilterChange }) => {
  // FILTERS: Definimos los filtros con sus etiquetas
  const filters: { id: ReservationFilter; label: string }[] = [
    { id: "upcoming", label: "Próximas" },
    { id: "completed", label: "Completadas" },
    { id: "canceled", label: "Canceladas" },
  ];

  return (
    <View style={styles.container}>
      {filters.map((filter) => (
        <TouchableOpacity
          key={filter.id}
          style={[
            styles.tabButton,
            currentFilter === filter.id && styles.tabButtonActive,
          ]}
          onPress={() => onFilterChange(filter.id)}>
          <Text
            style={[
              styles.tabText,
              currentFilter === filter.id && styles.tabTextActive,
            ]}>
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
    position: "relative",
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
    borderRadius: 30,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.textPrimary,
    fontWeight: "bold",
  },
});
