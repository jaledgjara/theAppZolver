import { View, Text, Pressable, StyleSheet } from "react-native";
import { COLORS, SIZES } from "@/appASSETS/theme";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.button, page === 0 && styles.buttonDisabled]}
        onPress={() => onPageChange(page - 1)}
        disabled={page === 0}
      >
        <Text
          style={[styles.buttonText, page === 0 && styles.buttonTextDisabled]}
        >
          Anterior
        </Text>
      </Pressable>

      <Text style={styles.pageInfo}>
        {page + 1} de {totalPages}
      </Text>

      <Pressable
        style={[
          styles.button,
          page >= totalPages - 1 && styles.buttonDisabled,
        ]}
        onPress={() => onPageChange(page + 1)}
        disabled={page >= totalPages - 1}
      >
        <Text
          style={[
            styles.buttonText,
            page >= totalPages - 1 && styles.buttonTextDisabled,
          ]}
        >
          Siguiente
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 16,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: SIZES.body4,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  buttonTextDisabled: {
    color: COLORS.textSecondary,
  },
  pageInfo: {
    fontSize: SIZES.body4,
    color: COLORS.textSecondary,
  },
});
