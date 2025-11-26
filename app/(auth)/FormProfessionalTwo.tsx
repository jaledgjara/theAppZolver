import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES } from "@/appASSETS/theme";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { ResizableInput } from "@/appCOMP/inputs/Screens/ResizableInput";
import QuickChips from "@/appCOMP/quickChips/QuickChips";
import { ServiceSwitcherCatalog } from "@/appSRC/auth/Screen/ServiceSwitcherCatalog";
import { PortfolioManager } from "@/appSRC/auth/Screen/PortofolioManager";
import { CategorySelectorModal } from "@/appSRC/auth/Screen/CategorySelectorModal";
import { useProfessionalForm } from "@/appSRC/auth/Hooks/useProfessionalForm";

// --- MÓDULOS ---

const FormProfessionalTwo = () => {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);

  // 🔥 EL CEREBRO (Hook)
  const {
    // Estado
    serviceModes,
    selectedCategory,
    specialization,
    licenseNumber,
    biography,
    portfolioImages,
    // Datos
    tags,
    loadingTags,
    categories,
    loadingCategories,
    // Acciones
    toggleServiceMode,
    pickImage,
    removeImage,
    updateField,
    // Validaciones
    isZolverYaDisabled,
    isProfileValid,
  } = useProfessionalForm();

  const handleContinue = () => {
    router.push("/(auth)/FormProfessionalThree");
  };

  return (
    <View style={styles.container}>
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

          {selectedCategory && (
            <View style={{ marginBottom: 10 }}>
              {loadingTags ? (
                <ActivityIndicator
                  size="small"
                  color={COLORS.primary}
                  style={{ alignSelf: "flex-start" }}
                />
              ) : (
                <QuickChips
                  items={tags.map((t) => t.label)}
                  onPress={(txt) => {
                    const newVal = specialization
                      ? `${specialization}, ${txt}`
                      : txt;
                    updateField("specialization", newVal);
                  }}
                />
              )}
            </View>
          )}

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

        {/* 4. MODO DE TRABAJO (Componente Modular) */}
        <View style={styles.section}>
          <Text style={styles.label}>Modalidad de Trabajo</Text>
          <Text style={styles.subLabel}>
            Puedes seleccionar ambas opciones si la categoría lo permite.
          </Text>

          <ServiceSwitcherCatalog
            modes={serviceModes}
            isDisabled={isZolverYaDisabled}
            onToggle={toggleServiceMode}
          />

          {isZolverYaDisabled && (
            <Text style={styles.warningText}>
              * La categoría {selectedCategory.name} no admite servicios
              inmediatos "Zolver Ya".
            </Text>
          )}
        </View>

        {/* 5. BIOGRAFÍA */}
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

        {/* 6. PORTAFOLIO (Componente Modular) */}
        <PortfolioManager
          images={portfolioImages}
          onAdd={pickImage}
          onRemove={removeImage}
        />

        {/* FOOTER */}
        <View style={styles.footer}>
          <LargeButton
            title="FINALIZAR PERFIL"
            onPress={handleContinue}
            disabled={!isProfileValid}
            iconName="checkmark-circle-outline"
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
    </View>
  );
};

export default FormProfessionalTwo;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 25, paddingBottom: 40 },
  section: { marginBottom: 24 },
  label: {
    ...FONTS.h3,
    fontSize: SIZES.h3,
    color: COLORS.textPrimary,
    marginBottom: 7,
    fontWeight: "600",
  },
  subLabel: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
    marginBottom: 12,
    fontSize: SIZES.body3,
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
  footer: { marginTop: 10, paddingBottom: 30 },
});
