import React, { useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  Alert,
} from "react-native";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { COLORS, SIZES } from "@/appASSETS/theme";
import { Ionicons } from "@expo/vector-icons";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { PortfolioManager } from "@/appSRC/auth/Screen/PortofolioManager";
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";
import { useProfessionalProfile } from "@/appSRC/users/Professional/General/Hooks/useProfessionalProfile";
import { MediaService } from "@/appSRC/users/Professional/General/Service/MediaService";
import UserAvatar from "@/appCOMP/avatar/UserAvatar";

const ProfessionalPublicProfileScreen = () => {
  const {
    profile,
    loading,
    saving,
    updateProfile,
    handleEditPhoto,
    handleAddImage,
    handleRemoveImage,
    handleUpdateField,
  } = useProfessionalProfile();

  // El MediaService ahora sí detecta file:// y muestra el preview
  const displayPhoto = MediaService.resolveUrl(profile.photoUrl, "avatars");
  const resolvedPortfolio = profile.portfolioUrls.map(
    (path) => MediaService.resolveUrl(path, "portfolio") || ""
  );
  if (loading) return <MiniLoaderScreen />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ToolBarTitle titleText="Editar Perfil" showBackButton={true} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageSection}>
          <View style={styles.imageContainer}>
            {displayPhoto ? (
              <Image
                source={{ uri: displayPhoto }}
                style={styles.profileImage}
              />
            ) : (
              <UserAvatar name={profile.specialty || "U"} size={120} />
            )}
            <TouchableOpacity
              style={styles.editBadge}
              onPress={handleEditPhoto}>
              <Ionicons name="camera" size={25} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Especialidad Profesional</Text>
          <TextInput
            style={styles.input}
            value={profile.specialty}
            onChangeText={(val) => handleUpdateField("specialty", val)}
          />

          <Text style={styles.label}>Biografía</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            value={profile.bio}
            onChangeText={(val) => handleUpdateField("bio", val)}
          />
        </View>

        <View style={styles.divider} />

        <PortfolioManager
          images={resolvedPortfolio}
          onAdd={handleAddImage}
          onRemove={handleRemoveImage}
        />

        <LargeButton
          title={saving ? "Guardando..." : "Guardar Cambios"}
          onPress={updateProfile}
          disabled={saving}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ProfessionalPublicProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  imageSection: {
    alignItems: "center",
    marginVertical: 30,
  },
  imageContainer: {
    position: "relative",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#F0F0F0",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 5,
    backgroundColor: COLORS.primary || "#000",
    borderRadius: 50,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
  },
  imageInstruction: {
    marginTop: 12,
    fontSize: SIZES.h4,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  formContainer: {
    marginTop: 10,
  },
  label: {
    fontSize: SIZES.h3,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 10,
    marginTop: 20,
  },
  input: {
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 17,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  textArea: {
    height: 150,
    textAlignVertical: "top",
  },
  portfolioSection: {
    marginTop: 20,
  },
  portfolioItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  portfolioInput: {
    flex: 1,
    padding: 15,
    fontSize: 14,
  },
  addMore: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 5,
  },
  addMoreText: {
    marginLeft: 8,
    color: COLORS.primary,
    fontWeight: "600",
  },
  divider: { height: 1, backgroundColor: "#EEE", marginVertical: 25 },
  helperText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: "italic",
    marginTop: -10,
  },
});

/*

Perfil Público	Foto, Bio, Especialidad, Portfolio	person-outline
Configuración de Trabajo	Precio, Tipo de Trabajo (Instant/Quote)	briefcase-outline
Área de Servicio	Mapa, Lat/Lng, Radio de Cobertura	map-outline

*/
