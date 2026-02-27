import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES } from "@/appASSETS/theme";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { ResizableInput } from "@/appCOMP/inputs/Screens/ResizableInput";
import { BaseCard } from "@/appCOMP/cards/BaseCard";
import { ServiceSwitcherCatalog } from "@/appSRC/auth/Screen/ServiceSwitcherCatalog";
import { PortfolioManager } from "@/appSRC/auth/Screen/PortofolioManager";
import { CategorySelectorModal } from "@/appSRC/auth/Screen/CategorySelectorModal";
import { useProfessionalForm } from "@/appSRC/auth/Hooks/useProfessionalForm";
import { useImagePicker } from "@/appCOMP/images/Hooks/useImagePicker";

const FormProfessionalTwo = () => {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);

  const {
    portfolioImages,
    addPortfolioImage,
    removeImage,
    typeWork,
    selectedCategory,
    specialization,
    licenseNumber,
    biography,
    categories,
    loadingCategories,
    templates,
    loadingTemplates,
    customPrices,
    setCustomPrices,
    setTypeWork,
    updateField,
    isZolverYaDisabled,
    isProfileValid,
  } = useProfessionalForm();

  const portfolioPicker = useImagePicker();

  const handleAddPortfolio = async () => {
    const uri = await portfolioPicker.pickImage();
    if (uri) {
      addPortfolioImage(uri);
    }
  };

  const handleContinue = () => {
    router.push("/(auth)/FormProfessionalThree");
  };

  const showPricing = typeWork === "instant" || typeWork === "hybrid";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}>
      <ToolBarTitle titleText="Perfil Profesional" showBackButton={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 1. CATEGORÍA */}
        <View style={styles.section}>
          <Text style={styles.label}>Categoría Principal</Text>
          <ResizableInput
            placeholder="Selecciona tu rubro (ej. Plomería)"
            value={selectedCategory?.name}
            editable={false}
            onPress={() => setModalVisible(true)}
            pointerEvents="none"
            icon={
              <Ionicons
                name="grid-outline"
                size={22}
                color={COLORS.textSecondary}
              />
            }
          />
        </View>

        {/* 2. ESPECIALIZACIÓN */}
        <View style={styles.section}>
          <Text style={styles.label}>Especialización / Título</Text>
          <ResizableInput
            placeholder={
              selectedCategory
                ? "Ej: Electricista Matriculado..."
                : "Primero selecciona una categoría"
            }
            value={specialization}
            onChangeText={(t) => updateField("specialization", t)}
            editable={!!selectedCategory}
            icon={
              <Ionicons
                name="ribbon-outline"
                size={22}
                color={COLORS.textSecondary}
              />
            }
          />
        </View>

        {/* 3. LICENCIA (Condicional) */}
        {selectedCategory?.requires_license && (
          <View style={styles.section}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.label}>Matrícula Profesional</Text>
              <View style={styles.badgeRequired}>
                <Text style={styles.badgeText}>Requerido</Text>
              </View>
            </View>
            <Text style={styles.subLabel}>
              Esta categoría requiere validación oficial.
            </Text>
            <ResizableInput
              placeholder="N° de Matrícula"
              value={licenseNumber}
              onChangeText={(t) => updateField("licenseNumber", t)}
              icon={
                <Ionicons
                  name="card-outline"
                  size={22}
                  color={COLORS.textSecondary}
                />
              }
            />
          </View>
        )}

        {/* 4. MODO DE TRABAJO */}
        <View style={styles.section}>
          <Text style={styles.label}>Modalidad de Trabajo</Text>
          <Text style={styles.subLabel}>
            {selectedCategory?.is_usually_urgent
              ? "Esta categoría permite ambas modalidades. Toca cada una para activarla."
              : "Selecciona cómo quieres recibir solicitudes."}
          </Text>

          <ServiceSwitcherCatalog
            typeWork={typeWork}
            isDisabled={isZolverYaDisabled}
            allowHybrid={!!selectedCategory?.is_usually_urgent}
            onSelect={setTypeWork}
          />

          {isZolverYaDisabled && (
            <Text style={styles.warningText}>
              * La categoría {selectedCategory.name} no admite servicios
              inmediatos "Zolver Ya".
            </Text>
          )}
        </View>

        {/* 5. TARIFAS ZOLVER YA (Condicional) */}
        {showPricing && (
          <View style={styles.section}>
            <Text style={styles.label}>Tus Tarifas Zolver Ya</Text>
            <Text style={styles.subLabel}>
              Ajusta tus precios para competir mejor.
            </Text>

            {loadingTemplates ? (
              <ActivityIndicator
                size="small"
                color={COLORS.primary}
                style={{ alignSelf: "center", marginVertical: 20 }}
              />
            ) : (
              templates.map((item) => (
                <BaseCard key={item.id} style={styles.skuCard}>
                  <View style={styles.skuHeader}>
                    <Text style={styles.skuLabel}>{item.label}</Text>
                    <Text style={styles.suggestedLabel}>
                      Sugerido: ${item.basePrice}
                    </Text>
                  </View>
                  <ResizableInput
                    value={customPrices[item.id] || ""}
                    onChangeText={(val) =>
                      setCustomPrices((prev) => ({
                        ...prev,
                        [item.id]: val,
                      }))
                    }
                    keyboardType="numeric"
                    icon={<Text style={styles.currency}>$</Text>}
                  />
                </BaseCard>
              ))
            )}
          </View>
        )}

        {/* 6. BIOGRAFÍA */}
        <View style={styles.section}>
          <Text style={styles.label}>Acerca de ti</Text>
          <ResizableInput
            placeholder="Cuéntale a tus clientes sobre tu experiencia..."
            value={biography}
            onChangeText={(t) => updateField("biography", t)}
            isTextArea={true}
            icon={
              <Ionicons
                name="person-outline"
                size={22}
                color={COLORS.textSecondary}
              />
            }
          />
        </View>

        {/* 7. PORTAFOLIO (Mis Trabajos) */}
        <PortfolioManager
          images={portfolioImages}
          onAdd={handleAddPortfolio}
          onRemove={removeImage}
        />

        {/* FOOTER */}
        <View style={styles.footer}>
          <LargeButton
            title="CONTINUAR"
            onPress={handleContinue}
            disabled={!isProfileValid}
            iconName="arrow-forward-circle-outline"
          />
        </View>
      </ScrollView>

      {/* MODAL DE SELECCIÓN */}
      <CategorySelectorModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        categories={categories}
        loading={loadingCategories}
        selectedId={selectedCategory?.id}
        onSelect={(cat) => {
          updateField("selectedCategory", cat);
          setModalVisible(false);
          updateField("specialization", "");
        }}
      />
    </KeyboardAvoidingView>
  );
};

export default FormProfessionalTwo;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  scrollContent: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 24 },
  label: {
    fontSize: SIZES.h3,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 7,
  },
  subLabel: {
    fontSize: SIZES.body4,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  badgeRequired: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  badgeText: { color: "#DC2626", fontSize: 10, fontWeight: "700" },
  warningText: {
    fontSize: SIZES.h4,
    color: "#F59E0B",
    marginTop: 8,
    fontStyle: "italic",
  },
  skuCard: { padding: 16, marginBottom: 12, backgroundColor: "#F9F9FB" },
  skuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  skuLabel: { fontSize: 16, fontWeight: "600", color: COLORS.textPrimary },
  suggestedLabel: { fontSize: 12, color: COLORS.primary, fontWeight: "500" },
  currency: { fontSize: 18, fontWeight: "bold", color: COLORS.textPrimary },
  footer: { marginTop: 10, paddingBottom: 30 },
});
