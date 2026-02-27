import { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES } from "@/appASSETS/theme";
import { AdminUserService } from "@/appSRC/admin/Service/AdminUserService";

const SETTING_KEY = "platform_fee_rate";
const STEP = 0.01; // 1% increments
const MIN_FEE = 0;
const MAX_FEE = 0.5; // 50% max

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [localRate, setLocalRate] = useState<number | null>(null);
  const [savedRate, setSavedRate] = useState<number>(0.10);
  const initializedRef = useRef(false);

  // Fetch current fee rate from DB
  const { data: fetchedRate, isLoading } = useQuery({
    queryKey: ["admin", "platform_fee_rate"],
    queryFn: async () => {
      const val = await AdminUserService.fetchPlatformSetting(SETTING_KEY);
      return parseFloat(val ?? "0.10");
    },
    staleTime: 1000 * 60 * 10,
  });

  // Sync fetched rate → local state only on first load
  useEffect(() => {
    if (fetchedRate !== undefined && !initializedRef.current) {
      initializedRef.current = true;
      setSavedRate(fetchedRate);
      setLocalRate(fetchedRate);
    }
  }, [fetchedRate]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (newRate: number) =>
      AdminUserService.updatePlatformSetting(SETTING_KEY, newRate.toFixed(4)),
    onSuccess: (_data, newRate) => {
      setSavedRate(newRate);
      // Invalidate client-side cache so checkout screens pick up the new rate
      queryClient.invalidateQueries({ queryKey: ["platform_fee_rate"] });
    },
  });

  const currentRate = localRate ?? savedRate;
  const displayPercent = Math.round(currentRate * 100);
  const hasChanges = localRate !== null && localRate !== savedRate;

  const increment = useCallback(() => {
    setLocalRate((prev) => {
      const next = (prev ?? 0.1) + STEP;
      return next <= MAX_FEE ? parseFloat(next.toFixed(4)) : MAX_FEE;
    });
  }, []);

  const decrement = useCallback(() => {
    setLocalRate((prev) => {
      const next = (prev ?? 0.1) - STEP;
      return next >= MIN_FEE ? parseFloat(next.toFixed(4)) : MIN_FEE;
    });
  }, []);

  const handleSave = () => {
    if (localRate !== null) {
      saveMutation.mutate(localRate);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Configuración</Text>
        <ActivityIndicator color={COLORS.tertiary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Configuración</Text>

      {/* Platform Fee Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="cash-outline" size={22} color={COLORS.tertiary} />
          <Text style={styles.cardTitle}>Comisión de plataforma</Text>
        </View>

        <Text style={styles.cardDescription}>
          Porcentaje que Zolver cobra sobre cada transacción. Se calcula sobre
          el subtotal del servicio y se suma al monto que paga el cliente.
        </Text>

        {/* Stepper */}
        <View style={styles.stepperContainer}>
          <TouchableOpacity
            style={[styles.stepperButton, currentRate <= MIN_FEE && styles.stepperButtonDisabled]}
            onPress={decrement}
            disabled={currentRate <= MIN_FEE}
            activeOpacity={0.6}>
            <Ionicons name="remove" size={24} color={currentRate <= MIN_FEE ? COLORS.border : COLORS.textPrimary} />
          </TouchableOpacity>

          <View style={styles.stepperValueBox}>
            <Text style={styles.stepperValue}>{displayPercent}%</Text>
          </View>

          <TouchableOpacity
            style={[styles.stepperButton, currentRate >= MAX_FEE && styles.stepperButtonDisabled]}
            onPress={increment}
            disabled={currentRate >= MAX_FEE}
            activeOpacity={0.6}>
            <Ionicons name="add" size={24} color={currentRate >= MAX_FEE ? COLORS.border : COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Preview */}
        <View style={styles.previewBox}>
          <Text style={styles.previewTitle}>Vista previa</Text>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Servicio de $10.000</Text>
            <Text style={styles.previewValue}>
              Comisión: ${Math.round(10000 * currentRate).toLocaleString()}
            </Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>El cliente paga</Text>
            <Text style={styles.previewValueBold}>
              ${(10000 + Math.round(10000 * currentRate)).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Save button */}
        {hasChanges && (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saveMutation.isPending}
            activeOpacity={0.7}>
            {saveMutation.isPending ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar cambios</Text>
            )}
          </TouchableOpacity>
        )}

        {saveMutation.isSuccess && !hasChanges && (
          <View style={styles.savedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.savedText}>Guardado</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageTitle: {
    fontSize: SIZES.h2,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 24,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: 28,
    maxWidth: 520,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: SIZES.h3,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  cardDescription: {
    fontSize: SIZES.body4,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  // Stepper
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginBottom: 24,
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.backgroundLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepperButtonDisabled: {
    opacity: 0.4,
  },
  stepperValueBox: {
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: SIZES.radius,
  },
  stepperValue: {
    fontSize: SIZES.h1,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  // Preview
  previewBox: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: SIZES.radius,
    padding: 16,
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  previewLabel: {
    fontSize: SIZES.body4,
    color: COLORS.textSecondary,
  },
  previewValue: {
    fontSize: SIZES.body4,
    fontWeight: "600",
    color: COLORS.tertiary,
  },
  previewValueBold: {
    fontSize: SIZES.body4,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  // Save
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: SIZES.body3,
    fontWeight: "700",
    color: COLORS.white,
  },
  savedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 8,
  },
  savedText: {
    fontSize: SIZES.body4,
    color: COLORS.success,
    fontWeight: "600",
  },
});
