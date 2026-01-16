// app/(client)/professionalDetails/[id].tsx
import React from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// Componentes
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { COLORS, SIZES } from "@/appASSETS/theme";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import {
  AboutCard,
  FeatureListCard,
} from "@/appSRC/searchable/Screen/ProfileHeaderCard";
import PortfolioCard from "@/appSRC/searchable/Screen/PortfolioCard";

// Hooks
import { useProfessionalDetails } from "@/appSRC/searchable/Hooks/useProfessionalDetails";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { useStartConversation } from "@/appSRC/conversation/Hooks/useStartConversation";
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";

const ProfessionalDetailsView = () => {
  const router = useRouter();
  const { id, mode } = useLocalSearchParams<{ id: string; mode: any }>();
  const isInstant = (mode || "quote") === "instant";

  const { startConversation, loading: isCreatingChat } = useStartConversation();
  const { profile, loading, error } = useProfessionalDetails(id);
  const { user } = useAuthStore();

  const handlePrimaryAction = async () => {
    if (!profile || !user?.uid) return;
    if (isInstant) {
      router.push({
        pathname: "/(client)/(tabs)/home/ReservationRequestScreen",
        params: {
          professionalId: profile.user_id,
          name: profile.legal_name,
          categoryId: profile.category_id,
          category: profile.category_name || "General",
          mode: "instant",
          price: profile.price_per_hour || "-",
        },
      });
    } else {
      const resolvedId = await startConversation(profile.user_id);
      if (resolvedId) {
        router.push({
          pathname: "/(client)/messages/MessagesDetailsScreen/[id]",
          params: {
            id: profile.user_id,
            name: profile.legal_name,
            conversationId: resolvedId,
          },
        });
      }
    }
  };

  if (loading) return <MiniLoaderScreen />;
  if (error || !profile)
    return (
      <View style={mainStyles.center}>
        <Text style={{ color: COLORS.error }}>Error cargando perfil</Text>
      </View>
    );

  return (
    <View style={mainStyles.container}>
      <ToolBarTitle
        titleText={isInstant ? "Zolver Ya" : "Perfil"}
        showBackButton
      />

      <ScrollView
        contentContainerStyle={mainStyles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 1. CABECERA VERTICAL (Productiva) */}
        <View style={mainStyles.headerVertical}>
          <Image
            source={{
              uri: "https://via.placeholder.com/150",
            }}
            style={mainStyles.profileAvatar}
          />
          <Text style={mainStyles.proName}>{profile.legal_name}</Text>
          <Text style={mainStyles.proCategory}>
            {profile.category_name || "Profesional"}
          </Text>

          <View style={mainStyles.ratingRow}>
            <Ionicons name="star" size={14} color={COLORS.primary} />
            <Text style={mainStyles.ratingText}>{profile.rating || 0}</Text>
            <View style={mainStyles.dotSeparator} />
            <Ionicons
              name="shield-checkmark"
              size={14}
              color={COLORS.textSecondary}
            />
            <Text style={mainStyles.verifiedText}>Verificado</Text>
          </View>

          <View
            style={[
              mainStyles.typeBadge,
              {
                backgroundColor: isInstant ? COLORS.primary + "10" : "#FFF3E0",
              },
            ]}>
            <Ionicons
              name={isInstant ? "flash" : "document-text"}
              size={12}
              color={isInstant ? COLORS.primary : "#F57C00"}
            />
            <Text
              style={[
                mainStyles.typeBadgeText,
                { color: isInstant ? COLORS.primary : "#F57C00" },
              ]}>
              {isInstant ? "Servicio Inmediato" : "Cotización previa"}
            </Text>
          </View>
        </View>

        {/* 2. SOBRE MÍ (Limpio y sin superposiciones) */}
        <View style={mainStyles.aboutSection}>
          <Text style={mainStyles.sectionLabel}>Sobre el profesional</Text>
          <Text style={mainStyles.aboutText}>
            {profile.biography || "Sin descripción disponible."}
          </Text>
        </View>

        {/* 3. PORTFOLIO */}
        <View style={mainStyles.miniSection}>
          <PortfolioCard images={profile.portfolio_photos || []} />
        </View>

        {/* 4. CREDENCIALES */}
        {profile.enrollment_number && (
          <View style={mainStyles.miniSection}>
            <FeatureListCard
              items={[`Matrícula Profesional: ${profile.enrollment_number}`]}
            />
          </View>
        )}

        {/* 5. ACTION BOX (Final de Scroll) */}
        <View style={mainStyles.actionCard}>
          <Text style={mainStyles.footerLabel}>Cobertura</Text>
          <Text style={mainStyles.footerValue}>
            {profile.coverage_radius_km || "-"} km a la redonda
          </Text>
          <LargeButton
            title={isInstant ? "RESERVAR AHORA" : "CONTACTAR PROFESIONAL"}
            onPress={handlePrimaryAction}
            loading={isCreatingChat}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const mainStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 20 },

  // Cabecera
  headerVertical: { alignItems: "center", marginBottom: 25 },
  profileAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 12,
    backgroundColor: "#F5F5F5",
  },
  proName: { fontSize: 20, fontWeight: "800", color: COLORS.textPrimary },
  proCategory: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
    marginTop: 2,
  },

  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  ratingText: { fontSize: 13, color: "#888", marginLeft: 4 },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#DDD",
    marginHorizontal: 8,
  },
  verifiedText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },

  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 12,
    gap: 5,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  // Seccion Sobre Mi Limpia
  aboutSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 16,
  },
  sectionLabel: {
    fontSize: SIZES.body3,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  aboutText: { fontSize: 14, color: "#444", lineHeight: 20 },

  miniSection: { marginBottom: 15 },

  // Action Footer Orgánico
  actionCard: {
    padding: 20,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 24,
    marginTop: 10,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  footerLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  footerValue: { fontSize: 14, color: "#333", fontWeight: "700" },
  priceInfo: { alignItems: "flex-end" },
  priceText: { fontSize: 22, fontWeight: "800", color: COLORS.primary },
  priceUnit: { fontSize: 12, color: "#999", fontWeight: "400" },
});

export default ProfessionalDetailsView;
