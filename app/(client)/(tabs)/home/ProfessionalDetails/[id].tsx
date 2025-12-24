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
  Platform,
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
import { ProfessionalTypeWork } from "@/appSRC/users/Model/ProfessionalTypeWork";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { useStartConversation } from "@/appSRC/conversation/Hooks/useStartConversation";
import { LargeButton } from "@/appCOMP/button/LargeButton";

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

      {/* === HUGE FOOTER === */}
      <View style={mainStyles.footerContainer}>
        <View style={mainStyles.footerInfoContainer}>
          <Text style={mainStyles.priceLabel}>Radio: </Text>
          <Text style={mainStyles.priceValue}>{`${
            profile.coverage_radius_km || 5
          } km`}</Text>
        </View>

        <View style={mainStyles.footerButtonWrapper}>
          <LargeButton
            title={isInstant ? "RESERVAR" : "CONTACTAR"}
            onPress={handlePrimaryAction}
            loading={isCreatingChat}
            style={{ marginVertical: 0 }}
          />
        </View>
      </View>
    </View>
  );
};

export default ProfessionalDetailsView;

const mainStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // === FOOTER STYLES ===
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",

    // Layout
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    // Spacing (Huge)
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 24, // Extra padding para iPhone X+

    // Shadows (Floating Effect)
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 }, // Sombra hacia arriba
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20, // Android shadow fuerte
  },
  footerInfoContainer: {
    flex: 0.4, // Ocupa el 40% del espacio
    justifyContent: "center",
  },
  footerButtonWrapper: {
    flex: 0.6, // El botón ocupa el 60% restante
    alignItems: "flex-end",
  },
  priceLabel: {
    fontSize: SIZES.body4,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: SIZES.h2, // H2 para que se vea grande
    fontWeight: "bold",
    color: COLORS.primary,
  },
});
