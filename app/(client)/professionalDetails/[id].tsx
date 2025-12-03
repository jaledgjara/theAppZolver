import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Text,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS } from "@/appASSETS/theme";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import {
  ProfileHeaderCard,
  AboutCard,
  FeatureListCard,
  AvailabilityCard,
} from "@/appSRC/searchable/Screen/ProfileHeaderCard"; // Asumiendo que guardaste el código anterior aquí
// import { useProfessionalDetails } from '@/appSRC/searchable/Hooks/useProfessionalDetails'; // Tu hook real

// MOCK DATA (Para visualizar la UI inmediatamente si no hay backend activo)
const MOCK_PROFILE = {
  id: "1",
  legal_name: "Juan Carlos Pérez",
  specialty: "Electricista Matriculado",
  rating: 4.9,
  reviews_count: 247,
  avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  biography:
    "Especialista en instalaciones eléctricas residenciales y comerciales con más de 10 años de trayectoria. Mi prioridad es la seguridad y la eficiencia energética.",
  certifications: [
    "Matrícula Nacional Categoría 1",
    "Certificación en Seguridad Eléctrica",
    "Premio a la Excelencia Zolver 2023",
    "Seguro de Responsabilidad Civil",
  ],
};

const ProfessionalDetailsView = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const professionalId = Array.isArray(id) ? id[0] : id;

  // const { profile, loading, error } = useProfessionalDetails(professionalId);
  // Usamos Mock para demo UI
  const loading = false;
  const profile = MOCK_PROFILE;

  if (loading) {
    return (
      <View style={mainStyles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={mainStyles.container}>
      {/* 1. Header con Toolbar personalizado */}
      <ToolBarTitle titleText="Perfil del Profesional" showBackButton={true} />

      <ScrollView
        contentContainerStyle={mainStyles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 2. Tarjeta Principal de Perfil */}
        <ProfileHeaderCard profile={profile} />

        {/* 3. Disponibilidad */}
        <AvailabilityCard />

        {/* 4. Sobre mí */}
        <AboutCard text={profile.biography} />

        {/* 5. Certificaciones / Logros */}
        <FeatureListCard
          title="Logros y Certificaciones"
          items={profile.certifications}
        />

        {/* Espacio extra para el footer flotante */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 6. Footer de Acción (Sticky)
      <View style={mainStyles.footer}>
        <View>
          <Text style={mainStyles.priceLabel}>Precio por visita</Text>
          <Text style={mainStyles.priceValue}>
            $15.000 <Text style={mainStyles.priceUnit}>/ base</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={mainStyles.bookButton}
          onPress={() => console.log("Reservar")}>
          <Text style={mainStyles.bookButtonText}>Reservar Cita</Text>
        </TouchableOpacity>
      </View> */}
    </View>
  );
};

export default ProfessionalDetailsView;

const mainStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA", // El fondo gris claro de las imágenes de referencia
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  // Footer estilo "Sticky"
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 30,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
    // Sombra superior
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 10,
  },
  priceLabel: {
    fontSize: 12,
    color: "#888",
  },
  priceValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary, // Amarillo Zolver o Azul Profesional
  },
  priceUnit: {
    fontSize: 14,
    fontWeight: "normal",
    color: "#666",
  },
  bookButton: {
    backgroundColor: COLORS.tertiary, // Verde/Azul Zolver
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  bookButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
