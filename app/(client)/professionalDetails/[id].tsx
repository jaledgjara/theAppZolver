import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { COLORS } from "@/appASSETS/theme";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";

// Importamos nuestros componentes nuevos
import {
  ProfileHeaderCard,
  AboutCard,
  FeatureListCard,
  AvailabilityCard,
} from "@/appSRC/searchable/Screen/ProfileHeaderCard";
import { useProfessionalDetails } from "@/appSRC/searchable/Hooks/useProfessionalDetails";

// Importamos el hook real

const ProfessionalDetailsView = () => {
  const { id } = useLocalSearchParams();
  const professionalId = Array.isArray(id) ? id[0] : id;

  // 🔥 Hook conectado a Supabase
  const { profile, loading, error } = useProfessionalDetails(professionalId);

  if (loading) {
    return (
      <View style={mainStyles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={mainStyles.center}>
        <Text style={{ color: "red" }}>Error cargando perfil</Text>
      </View>
    );
  }

  // Preparamos datos para la UI (Mapeo)
  const certifications = [];
  if (profile.enrollment_number)
    certifications.push(`Matrícula: ${profile.enrollment_number}`);
  if (profile.cuit_cuil) certifications.push("Identidad Verificada (CUIT)");

  return (
    <View style={mainStyles.container}>
      <ToolBarTitle titleText="Perfil del Profesional" showBackButton={true} />

      <ScrollView
        contentContainerStyle={mainStyles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 1. Header con Avatar y Rating */}
        <ProfileHeaderCard profile={profile} />

        {/* 2. Disponibilidad (Estática por ahora, o dinámica si usas el JSON) */}
        <AvailabilityCard />

        {/* 3. Biografía */}
        <AboutCard text={profile.biography} />

        {/* 4. Credenciales Reales */}
        <FeatureListCard items={certifications} />

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer de Acción */}
      <View style={mainStyles.footer}>
        <View>
          <Text style={mainStyles.priceLabel}>Radio de cobertura</Text>
          <Text style={mainStyles.priceValue}>
            {profile.coverage_radius_km || 5} km
          </Text>
        </View>

        <TouchableOpacity
          style={mainStyles.bookButton}
          onPress={() =>
            console.log("Iniciar Chat / Reservar", profile.user_id)
          }>
          <Text style={mainStyles.bookButtonText}>Contactar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProfessionalDetailsView;

const mainStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
    elevation: 10,
    marginBottom: 5,
  },
  priceLabel: { fontSize: 12, color: "#888" },
  priceValue: { fontSize: 18, fontWeight: "bold", color: COLORS.primary },
  bookButton: {
    backgroundColor: COLORS.tertiary,
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  bookButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
