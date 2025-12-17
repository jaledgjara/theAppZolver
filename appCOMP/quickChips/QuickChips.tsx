import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS } from "@/appASSETS/theme";

// Definimos una interfaz compatible con ServiceTag
export interface ChipItem {
  id: string;
  label: string;
  [key: string]: any;
}

interface QuickChipsProps {
  items: ChipItem[]; // ✅ Ahora acepta Objetos, no solo strings
  selectedIds: string[]; // Array de IDs seleccionados
  onToggle: (item: any) => void;
}

const QuickChips: React.FC<QuickChipsProps> = ({
  items,
  selectedIds,
  onToggle,
}) => {
  // GUARDIA DE SEGURIDAD VISUAL
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {items.map((item) => {
        // Verificamos si este ID está en la lista de seleccionados
        const isSelected = selectedIds.includes(item.id);

        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.chip,
              isSelected ? styles.chipSelected : styles.chipUnselected,
            ]}
            onPress={() => onToggle(item)}>
            <Text
              style={[
                styles.chipText,
                isSelected
                  ? styles.chipTextSelected
                  : styles.chipTextUnselected,
              ]}>
              {/* ✅ Renderizamos label, no el objeto entero */}
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default QuickChips;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 4,
  },
  chipUnselected: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E0E0E0",
  },
  chipSelected: {
    backgroundColor: COLORS.textSecondary + "15", // Opacidad baja
    borderColor: COLORS.textSecondary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  chipTextUnselected: {
    color: "#666666",
  },
  chipTextSelected: {
    color: COLORS.textSecondary,
    fontWeight: "700",
  },
});
