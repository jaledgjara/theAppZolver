import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { COLORS } from "@/appASSETS/theme";
import { Ionicons } from "@expo/vector-icons";
import { useProfessionalPayout } from "@/appSRC/users/Professional/Hooks/useProfessionalPayout";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";
import { BaseCard } from "@/appCOMP/cards/BaseCard";

export default function ProfessionalPayoutConfigScreen() {
  // 1. Hooks de Capa de Dominio
  const { config, loading, saving, updateConfig } = useProfessionalPayout();
  const { user } = useAuthStore();

  // 2. Estados Locales para el Formulario
  const [editMode, setEditMode] = useState(false);
  const [localAlias, setLocalAlias] = useState("");
  const [localBank, setLocalBank] = useState("");

  // Sincronizar estado local cuando cargan los datos de Supabase
  useEffect(() => {
    if (config) {
      setLocalAlias(config.alias || "");
      setLocalBank(config.bankName || "");
    }
  }, [config]);

  // 3. Handlers de Lógica de Negocio
  const handleSave = async () => {
    if (!localAlias.trim()) {
      Alert.alert("Error", "El alias o CBU es obligatorio para recibir pagos.");
      return;
    }

    const res = await updateConfig(localAlias, localBank);

    if (res.success) {
      setEditMode(false);
      Alert.alert("Éxito", "Tus datos de cobro han sido actualizados.");
    } else {
      // El error del cooldown de 24hs vendrá aquí desde el Service
      Alert.alert("No se pudo actualizar", res.error);
    }
  };

  if (loading) return <MiniLoaderScreen />;

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Configuración de Cobro" showBackButton={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Banner Informativo UX */}
        <View style={styles.infoBanner}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={COLORS.primary}
          />
          <Text style={styles.infoText}>
            Configura donde recibirás el pago de los clientes. Zolver no cobra
            comisión sobre tus transferencias directas.
          </Text>
        </View>

        {/* Tarjeta Visual de Cobro */}
        <BaseCard style={styles.payoutCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>TU IDENTIDAD DE COBRO</Text>
            <Ionicons
              name="qr-code-outline"
              size={24}
              color={COLORS.tertiary}
            />
          </View>

          <Text style={styles.aliasDisplay} numberOfLines={1}>
            {localAlias || "Sin configurar"}
          </Text>

          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.holderDisplay}>
                {user?.displayName || "Profesional Zolver"}
              </Text>
              <Text style={styles.bankNameDisplay}>
                {localBank || "Entidad no definida"}
              </Text>
            </View>
            <Text style={styles.bankTag}>P2P READY</Text>
          </View>
        </BaseCard>

        {/* Formulario de Edición */}
        <View style={styles.formSection}>
          <Text style={styles.inputLabel}>Alias, CBU o CVU</Text>
          <View
            style={[styles.inputWrapper, !editMode && styles.disabledInput]}>
            <TextInput
              placeholder="Ej: mi.alias.mp o CBU..."
              value={localAlias}
              onChangeText={setLocalAlias}
              editable={editMode}
              style={styles.input}
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.inputLabel}>Banco o Billetera Virtual</Text>
          <View
            style={[styles.inputWrapper, !editMode && styles.disabledInput]}>
            <TextInput
              placeholder="Ej: Mercado Pago, Galicia, Brubank..."
              value={localBank}
              onChangeText={setLocalBank}
              editable={editMode}
              style={styles.input}
            />
          </View>

          <View>
            {!editMode ? (
              <LargeButton
                title="Editar Datos de Cobro"
                onPress={() => setEditMode(true)}
              />
            ) : (
              <LargeButton
                title={saving ? "Guardando..." : "Guardar Cambios"}
                onPress={handleSave}
                disabled={saving}
              />
            )}
          </View>
        </View>

        {/* Seguridad */}
        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={14} color={COLORS.tertiary} />
          <Text style={styles.securityText}>
            Almacenamiento seguro bajo protocolos RLS de Supabase.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  infoBanner: {
    flexDirection: "row",
    backgroundColor: COLORS.backgroundLight,
    padding: 15,
    borderRadius: 12,
    marginBottom: 25,
    gap: 10,
    alignItems: "center",
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  payoutCard: {
    backgroundColor: COLORS.primary,
    height: 180,
    borderRadius: 24,
    padding: 24,
    justifyContent: "space-between",
    marginBottom: 30,
    // Sombras para elevación
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  aliasDisplay: {
    color: "white",
    fontSize: 22,
    fontWeight: "800",
    marginVertical: 10,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  holderDisplay: { color: "white", fontSize: 15, fontWeight: "600" },
  bankNameDisplay: {
    color: COLORS.tertiary,
    fontSize: 14,
    fontWeight: "500",
    marginTop: 2,
  },
  bankTag: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    overflow: "hidden",
  },
  formSection: { gap: 10 },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginLeft: 4,
  },
  inputWrapper: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#F1F3F5",
  },
  disabledInput: {
    backgroundColor: "#F1F3F5",
    borderColor: "#E9ECEF",
    opacity: 0.7,
  },
  input: { fontSize: 16, color: COLORS.textPrimary, fontWeight: "500" },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  securityText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
});
