import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES } from "@/appASSETS/theme";
import { LargeButton } from "@/appCOMP/button/LargeButton";

// =============================================================================
// INTERFACE
// =============================================================================

const PLATFORM_FEE_RATE = 0.10; // 10% Zolver platform fee

interface CheckoutSummaryCardProps {
  /** Service subtotal (what the professional charges). */
  subtotal: number;
  /** Generic info value (hours, service name, etc.). */
  hoursLabel?: string;
  /** Left-side label for the info row. Defaults to "Tiempo estimado". */
  infoLabel?: string;
  /** Right-side suffix after the value. Defaults to " hs". Pass "" for none. */
  infoSuffix?: string;
  /** CTA button text. */
  buttonTitle: string;
  /** CTA button handler. */
  onPress: () => void;
  /** Disable the CTA button. */
  disabled?: boolean;
  /** Show loading state on button. */
  loading?: boolean;
  /** Small disclaimer text below button. */
  disclaimer?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const CheckoutSummaryCard = ({
  subtotal,
  hoursLabel,
  infoLabel = "Tiempo estimado",
  infoSuffix = " hs",
  buttonTitle,
  onPress,
  disabled = false,
  loading = false,
  disclaimer,
}: CheckoutSummaryCardProps) => {
  const platformFee = Math.round(subtotal * PLATFORM_FEE_RATE);
  const total = subtotal + platformFee;

  return (
    <View style={styles.container}>
      {/* Optional: Info row (hours, service name, etc.) */}
      {hoursLabel && (
        <>
          <View style={styles.row}>
            <Text style={styles.label}>{infoLabel}</Text>
            <Text style={styles.value}>{hoursLabel}{infoSuffix}</Text>
          </View>
          <View style={styles.divider} />
        </>
      )}

      {/* Subtotal */}
      <View style={styles.row}>
        <Text style={styles.label}>Subtotal del servicio</Text>
        <Text style={styles.value}>${subtotal.toLocaleString()}</Text>
      </View>

      {/* Platform fee */}
      <View style={styles.row}>
        <Text style={styles.label}>Comisión Zolver (10%)</Text>
        <Text style={styles.feeValue}>${platformFee.toLocaleString()}</Text>
      </View>

      <View style={styles.divider} />

      {/* Total */}
      <View style={styles.totalRow}>
        <View>
          <Text style={styles.totalLabel}>Total a pagar</Text>
          <Text style={styles.taxNote}>Incluye comisión de plataforma</Text>
        </View>
        <Text style={styles.totalValue}>${total.toLocaleString()}</Text>
      </View>

      {/* CTA */}
      <LargeButton
        title={loading ? "Procesando..." : buttonTitle}
        onPress={onPress}
        disabled={disabled || loading}
      />

      {/* Secure badge */}
      <View style={styles.secureBadge}>
        <Ionicons name="shield-checkmark" size={14} color={COLORS.textSecondary} />
        <Text style={styles.secureText}>Pago encriptado y seguro</Text>
      </View>

      {/* Optional disclaimer */}
      {disclaimer && <Text style={styles.disclaimer}>{disclaimer}</Text>}
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    padding: 24,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 24,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  value: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  feeValue: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.tertiary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    opacity: 0.3,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  taxNote: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  totalValue: {
    fontSize: SIZES.h2,
    fontWeight: "800",
    color: COLORS.primary,
  },
  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    gap: 5,
  },
  secureText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  disclaimer: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 10,
  },
});
