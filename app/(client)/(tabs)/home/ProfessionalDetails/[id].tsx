// app/(client)/professionalDetails/[id].tsx

import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { COLORS, SIZES } from "@/appASSETS/theme";
import {
  AboutCard,
  AvailabilityCard,
  FeatureListCard,
  ProfileHeaderCard,
} from "@/appSRC/searchable/Screen/ProfileHeaderCard";
import { useProfessionalDetails } from "@/appSRC/searchable/Hooks/useProfessionalDetails";
import PortfolioCard from "@/appSRC/searchable/Screen/PortfolioCard";
import { ProfessionalTypeWork } from "@/appSRC/userProf/Type/ProfessionalTypeWork";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { useStartConversation } from "@/appSRC/conversation/Hooks/useStartConversation";

const ProfessionalDetailsView = () => {
  const router = useRouter();
  // Recibimos id y mode ('instant' o 'quote')
  const { id, mode } = useLocalSearchParams<{
    id: string;
    mode: ProfessionalTypeWork;
  }>();

  // Validamos modo por defecto si viene undefined (fallback a quote)
  const currentMode = mode || "quote";
  const isInstant = currentMode === "instant";
  const { startConversation, loading: isCreatingChat } = useStartConversation();
  const { profile, loading, error } = useProfessionalDetails(id);
  const { user } = useAuthStore(); // Necesitamos saber quién soy yo (Cliente)

  const handlePrimaryAction = async () => {
    if (!profile || !user?.uid) return;

    if (isInstant) {
      // ⚡️ FLUJO ZOLVER YA (Sin cambios)
      console.log("🚀 Iniciando reserva inmediata...");
      router.push({
        pathname: "/(client)/(tabs)/home/ReservationRequestScreen",
        params: {
          id: profile.user_id,
          name: profile.legal_name,
          categoryId: profile.category_id,
          category: profile.category_name || "General",
          mode: "instant",
          price: profile.price_per_hour || 5000,
        },
      });
    } else {
      // 📄 FLUJO PRESUPUESTO / CONTACTO (USANDO EL HOOK)

      // 1. Usamos la función del hook en lugar del servicio directo
      const resolvedId = await startConversation(profile.user_id);

      // 2. Si el hook nos devolvió un ID, navegamos
      if (resolvedId) {
        router.push({
          pathname: "/(client)/messages/MessagesDetailsScreen/[id]",
          params: {
            id: profile.user_id,
            name: profile.legal_name,
            conversationId: resolvedId, // ✅ ID Seguro
          },
        });
      }
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "red" }}>Error cargando perfil</Text>
      </View>
    );
  }

  return (
    <View style={mainStyles.container}>
      <ToolBarTitle
        titleText={isInstant ? "Reserva Inmediata" : "Solicitar Presupuesto"}
        showBackButton={true}
      />

      <ScrollView
        contentContainerStyle={mainStyles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 1. Info Card (Común para ambos) */}
        <ProfileHeaderCard profile={profile} />

        {/* 2. Disponibilidad (SOLO Zolver Ya) */}
        {isInstant && <AvailabilityCard />}

        {/* 3. Sobre mí (Común) */}
        <AboutCard text={profile.biography} />

        {/* 4. Portafolio (Imágenes - Común pero vital para Presupuesto) */}
        {/* Pasamos un array de fotos ficticio si no existe en BD aún */}
        <PortfolioCard
          images={
            profile.portfolio_photos || [
              "https://via.placeholder.com/300",
              "https://via.placeholder.com/301",
            ]
          }
        />

        {/* 5. Credenciales (Opcional, bueno para confianza) */}
        {profile.enrollment_number && (
          <FeatureListCard
            items={[`Matrícula: ${profile.enrollment_number}`]}
          />
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FOOTER DINÁMICO */}
      <View style={mainStyles.footer}>
        <View>
          {/* En Zolver Ya mostramos precio hora, en Presupuesto mostramos radio o texto */}
          <Text style={mainStyles.priceLabel}>{"Radio de cobertura"}</Text>
          <Text style={mainStyles.priceValue}>
            {`${profile.coverage_radius_km || 5} km`}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            mainStyles.bookButton,
            { backgroundColor: isInstant ? COLORS.primary : COLORS.tertiary },
          ]}
          onPress={handlePrimaryAction}>
          <Text style={mainStyles.bookButtonText}>
            {isInstant ? "RESERVAR" : "CONTACTAR"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProfessionalDetailsView;

const mainStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F9F9" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    paddingVertical: 40,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#EEE",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: 5,
  },
  priceLabel: { fontSize: 12, color: COLORS.textSecondary },
  priceValue: { fontSize: 20, fontWeight: "bold", color: COLORS.textPrimary },
  bookButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 2,
  },
  bookButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    textTransform: "uppercase",
  },
});
