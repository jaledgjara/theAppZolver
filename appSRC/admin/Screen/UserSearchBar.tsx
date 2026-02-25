import { useState, useCallback } from "react";
import { View, TextInput, Text, Pressable, StyleSheet } from "react-native";
import { COLORS, SIZES } from "@/appASSETS/theme";
import { AdminUserFilters } from "../Type/AdminTypes";

interface UserSearchBarProps {
  filters: AdminUserFilters;
  onFiltersChange: (filters: AdminUserFilters) => void;
}

const ROLE_OPTIONS: { label: string; value: AdminUserFilters["role"] }[] = [
  { label: "Todos", value: "all" },
  { label: "Clientes", value: "client" },
  { label: "Profesionales", value: "professional" },
  { label: "Admins", value: "admin" },
];

export default function UserSearchBar({
  filters,
  onFiltersChange,
}: UserSearchBarProps) {
  const [searchText, setSearchText] = useState(filters.search);

  const handleSearchSubmit = useCallback(() => {
    onFiltersChange({ ...filters, search: searchText, page: 0 });
  }, [searchText, filters, onFiltersChange]);

  const handleRoleChange = useCallback(
    (role: AdminUserFilters["role"]) => {
      onFiltersChange({ ...filters, role, page: 0 });
    },
    [filters, onFiltersChange]
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o email..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
        />
        <Pressable style={styles.searchButton} onPress={handleSearchSubmit}>
          <Text style={styles.searchButtonText}>Buscar</Text>
        </Pressable>
      </View>

      <View style={styles.filterRow}>
        {ROLE_OPTIONS.map((opt) => {
          const isActive = filters.role === opt.value;
          return (
            <Pressable
              key={opt.value}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => handleRoleChange(opt.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: SIZES.body4,
    color: COLORS.textPrimary,
  },
  searchButton: {
    backgroundColor: COLORS.tertiary,
    paddingHorizontal: 20,
    borderRadius: SIZES.radius,
    justifyContent: "center",
  },
  searchButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body4,
    fontWeight: "600",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.tertiary,
    borderColor: COLORS.tertiary,
  },
  filterChipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.white,
    fontWeight: "600",
  },
});
