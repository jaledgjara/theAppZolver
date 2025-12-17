import { COLORS, FONTS, SIZES } from "@/appASSETS/theme";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// TYPE DEFINITION: Exportamos el tipo para usarlo en la pantalla padre (Clean Architecture)
export type ReservationFilterType = "active" | "pending" | "historical";

// INTERFACE: Props del componente
interface TabbedReservationFiltersProps {
  currentFilter: ReservationFilterType;
  onFilterChange: (filter: ReservationFilterType) => void;
}

export const TabbedReservationFilters: React.FC<
  TabbedReservationFiltersProps
> = ({ currentFilter, onFilterChange }) => {
  const filters: { id: ReservationFilterType; label: string }[] = [
    { id: "active", label: "Activas" },
    { id: "pending", label: "Pendientes" },
    { id: "historical", label: "Historial" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {filters.map((filter) => {
          const isActive = currentFilter === filter.id;

          return (
            <TouchableOpacity
              key={filter.id}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => onFilterChange(filter.id)}
              activeOpacity={0.7}>
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FAFAFA",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 4,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 25,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary || "#3B82F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  tabText: {
    fontSize: SIZES.body3,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },
  tabTextActive: {
    fontSize: SIZES.body3,
    fontWeight: "500",
    color: "white",
  },
});
