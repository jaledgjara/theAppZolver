import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// Componentes
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { COLORS, SIZES } from "@/appASSETS/theme";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import PortfolioCard from "@/appSRC/searchable/Screen/PortfolioCard";
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";
import UserAvatar from "@/appCOMP/avatar/UserAvatar";

// Hooks
import { useProfessionalDetails } from "@/appSRC/searchable/Hooks/useProfessionalDetails";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { useStartConversation } from "@/appSRC/conversation/Hooks/useStartConversation";

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
        titleText={isInstant ? "Zolver Ya" : "Perfil del Profesional"}
        showBackButton
      />

      <ScrollView
        contentContainerStyle={mainStyles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 1. CABECERA UNIFICADA (Con fondo gris y alineación corregida) */}
        <View style={mainStyles.sectionCard}>
          <View style={mainStyles.headerRow}>
            <UserAvatar
              path={profile.photo_url}
              name={profile.legal_name || "Z"}
              size={80}
              style={mainStyles.avatarShadow}
            />
            <View style={mainStyles.infoContainer}>
              <Text style={mainStyles.proName} numberOfLines={1}>
                {profile.legal_name}
              </Text>
              <Text style={mainStyles.proCategory}>
                {profile.category_name || "Profesional"}
              </Text>

              <View style={mainStyles.ratingRow}>
                <Ionicons name="star" size={14} color={COLORS.primary} />
                <Text style={mainStyles.ratingText}>
                  {profile.rating > 0 ? profile.rating.toFixed(1) : "Nuevo"}
                </Text>
                <View style={mainStyles.dotSeparator} />
                <Ionicons
                  name="shield-checkmark"
                  size={14}
                  color={COLORS.primary}
                />
                <Text style={mainStyles.verifiedText}>Verificado</Text>
              </View>
            </View>
          </View>

          {/* Badge de Modo de Servicio integrado en la card */}
          <View
            style={[
              mainStyles.typeBadge,
              {
                backgroundColor: isInstant ? COLORS.primary + "15" : "#FFF3E0",
              },
            ]}>
            <Ionicons
              name={isInstant ? "flash" : "document-text"}
              size={12}
              color={COLORS.primary}
            />
            <Text style={[mainStyles.typeBadgeText, { color: COLORS.primary }]}>
              {isInstant
                ? "Servicio de Respuesta Inmediata"
                : "Servicio de Presupuesto "}
            </Text>
          </View>
        </View>

        {/* 2. SOBRE MÍ */}
        <View style={mainStyles.sectionCard}>
          <Text style={mainStyles.sectionLabel}>Sobre el profesional</Text>
          <Text style={mainStyles.aboutText}>
            {profile.biography ||
              "El profesional no ha proporcionado una descripción todavía."}
          </Text>
        </View>

        {/* 3. PORTFOLIO UNIFICADO (Mismo fondo y título) */}
        <View style={mainStyles.sectionCard}>
          <Text style={mainStyles.sectionLabel}>Portafolio de trabajos</Text>
          <PortfolioCard images={profile.portfolio_photos || []} />
        </View>

        {/* 4. ACCIÓN PRINCIPAL */}

        <View style={mainStyles.actionContainer}>
          {/* Lógica: Solo mostramos cobertura si es Instant (Zolver Ya) */}
          {isInstant && (
            <View style={mainStyles.coverageRow}>
              <Ionicons
                name="location"
                size={16}
                color={COLORS.textSecondary}
              />
              <Text style={mainStyles.footerLabel}>Cobertura: </Text>
              <Text style={mainStyles.footerValue}>
                {profile.coverage_radius_km || "10"} km a la redonda
              </Text>
            </View>
          )}

          <LargeButton
            title={isInstant ? "SOLICITAR ZOLVER YA" : "ENVIAR MENSAJE"}
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
  scrollContent: { padding: 20, gap: 16 },

  // Bloque Base para todas las secciones (ESTANDARIZACIÓN)
  sectionCard: {
    backgroundColor: COLORS.backgroundLight || "#F8F9FA",
    borderRadius: 20,
    padding: 16,
    width: "100%",
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    marginBottom: 12,
    letterSpacing: 1,
  },

  // Cabecera Row
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatarShadow: {
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  infoContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },

  proName: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },

  proCategory: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 2,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  ratingText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginLeft: 4,
  },

  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#CCC",
    marginHorizontal: 8,
  },

  verifiedText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },

  // Badges y Otros
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 16,
    gap: 6,
    alignSelf: "flex-start",
  },

  typeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  aboutText: {
    fontSize: 15,
    color: "#4A4A4A",
    lineHeight: 22,
  },

  // Footer / Action
  actionContainer: {
    marginTop: 8,
    gap: 12,
  },
  coverageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  footerLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  footerValue: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
});

export default ProfessionalDetailsView;
