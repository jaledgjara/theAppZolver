import { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { COLORS, SIZES } from "@/appASSETS/theme";
import { PendingProfessional } from "../Type/AdminTypes";
import { useAdminUserActions } from "../Hooks/useAdminUserActions";

interface PendingProfessionalCardProps {
  professional: PendingProfessional;
}

export default function PendingProfessionalCard({
  professional: p,
}: PendingProfessionalCardProps) {
  const {
    verifyProfessional,
    rejectProfessional,
    isUpdatingStatus,
    updateStatusError,
    updateProfile,
    isUpdatingProfile,
  } = useAdminUserActions();

  const handleVerify = () => {
    console.log(`[Card] handleVerify pressed for userId: ${p.userId}`);
    const confirmed = window.confirm(
      `¿Estás seguro de verificar a ${p.legalName ?? p.email}?`
    );
    if (confirmed) {
      console.log(`[Card] Confirmed — calling verifyProfessional(${p.userId})`);
      verifyProfessional(p.userId);
    } else {
      console.log(`[Card] Cancelled verify`);
    }
  };

  const handleReject = () => {
    console.log(`[Card] handleReject pressed for userId: ${p.userId}`);
    const confirmed = window.confirm(
      `¿Estás seguro de rechazar a ${p.legalName ?? p.email}?`
    );
    if (confirmed) {
      console.log(`[Card] Confirmed — calling rejectProfessional(${p.userId})`);
      rejectProfessional(p.userId);
    } else {
      console.log(`[Card] Cancelled reject`);
    }
  };

  // Editable fields
  const [specialization, setSpecialization] = useState(p.specializationTitle);
  const [biography, setBiography] = useState(p.biography);
  const [enrollment, setEnrollment] = useState(p.enrollmentNumber);
  const [radius, setRadius] = useState(String(p.coverageRadiusKm));
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const hasEdits =
    specialization !== p.specializationTitle ||
    biography !== p.biography ||
    enrollment !== p.enrollmentNumber ||
    radius !== String(p.coverageRadiusKm);

  const handleSaveEdits = () => {
    const fields: Record<string, string | number> = {};
    if (specialization !== p.specializationTitle)
      fields.specialization_title = specialization;
    if (biography !== p.biography) fields.biography = biography;
    if (enrollment !== p.enrollmentNumber)
      fields.enrollment_number = enrollment;
    if (radius !== String(p.coverageRadiusKm)) {
      const parsed = parseFloat(radius);
      if (!isNaN(parsed)) fields.coverage_radius_km = parsed;
    }
    updateProfile({ userId: p.userId, fields });
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.name}>{p.legalName ?? "Sin nombre"}</Text>
          <Text style={styles.email}>{p.email}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.meta}>
            Tel: {p.phone ?? "—"}
          </Text>
          <Text style={styles.meta}>
            Registrado: {p.createdAt.toLocaleDateString("es-AR")}
          </Text>
        </View>
      </View>

      {/* Documents */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Documentos (DNI)</Text>
        <View style={styles.docsRow}>
          {p.docFrontUrl ? (
            <Pressable onPress={() => setImagePreview(p.docFrontUrl)}>
              <Image source={{ uri: p.docFrontUrl }} style={styles.docImage} />
              <Text style={styles.docLabel}>Frente</Text>
            </Pressable>
          ) : (
            <View style={styles.docPlaceholder}>
              <Text style={styles.docPlaceholderText}>Sin frente</Text>
            </View>
          )}
          {p.docBackUrl ? (
            <Pressable onPress={() => setImagePreview(p.docBackUrl)}>
              <Image source={{ uri: p.docBackUrl }} style={styles.docImage} />
              <Text style={styles.docLabel}>Dorso</Text>
            </Pressable>
          ) : (
            <View style={styles.docPlaceholder}>
              <Text style={styles.docPlaceholderText}>Sin dorso</Text>
            </View>
          )}
        </View>
      </View>

      {/* Profile info — editable fields */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Perfil profesional</Text>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Categoría ID</Text>
          <Text style={styles.fieldValue}>{p.mainCategoryId ?? "—"}</Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Especialización</Text>
          <TextInput
            style={styles.fieldInput}
            value={specialization}
            onChangeText={setSpecialization}
          />
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Matrícula</Text>
          <TextInput
            style={styles.fieldInput}
            value={enrollment}
            onChangeText={setEnrollment}
          />
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Biografía</Text>
          <TextInput
            style={[styles.fieldInput, styles.fieldInputMultiline]}
            value={biography}
            onChangeText={setBiography}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Tipo trabajo</Text>
          <Text style={styles.fieldValue}>{p.typeWork}</Text>
        </View>
      </View>

      {/* Location */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ubicación</Text>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Coordenadas</Text>
          <Text style={styles.fieldValue}>
            {p.baseLat.toFixed(4)}, {p.baseLng.toFixed(4)}
          </Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Radio cobertura (km)</Text>
          <TextInput
            style={[styles.fieldInput, { width: 80 }]}
            value={radius}
            onChangeText={setRadius}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Financial */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Datos financieros</Text>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>CBU / Alias</Text>
          <Text style={styles.fieldValue}>
            {p.financialInfo?.cbu_alias ?? "—"}
          </Text>
        </View>
      </View>

      {/* Portfolio */}
      {p.portfolioUrls.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Portfolio</Text>
          <View style={styles.portfolioGrid}>
            {p.portfolioUrls.map((url, i) => (
              <Pressable key={i} onPress={() => setImagePreview(url)}>
                <Image source={{ uri: url }} style={styles.portfolioThumb} />
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Save edits button */}
      {hasEdits && (
        <Pressable
          style={styles.saveButton}
          onPress={handleSaveEdits}
          disabled={isUpdatingProfile}
        >
          {isUpdatingProfile ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar cambios</Text>
          )}
        </Pressable>
      )}

      {/* Error banner */}
      {updateStatusError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>
            Error: {updateStatusError.message}
          </Text>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <Pressable
          style={[
            styles.actionButton,
            styles.verifyButton,
            isUpdatingStatus && styles.actionButtonDisabled,
          ]}
          onPress={handleVerify}
          disabled={isUpdatingStatus}
        >
          {isUpdatingStatus ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={styles.actionButtonText}>Verificar</Text>
          )}
        </Pressable>
        <Pressable
          style={[
            styles.actionButton,
            styles.rejectButton,
            isUpdatingStatus && styles.actionButtonDisabled,
          ]}
          onPress={handleReject}
          disabled={isUpdatingStatus}
        >
          {isUpdatingStatus ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={styles.actionButtonText}>Rechazar</Text>
          )}
        </Pressable>
      </View>

      {/* Full-size image preview overlay */}
      {imagePreview && (
        <Pressable
          style={styles.previewOverlay}
          onPress={() => setImagePreview(null)}
        >
          <Image
            source={{ uri: imagePreview }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    marginBottom: 20,
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    gap: 4,
  },
  headerRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  name: {
    fontSize: SIZES.h3,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  email: {
    fontSize: SIZES.body4,
    color: COLORS.textSecondary,
  },
  meta: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  // Sections
  section: {
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: SIZES.body4,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  // Documents
  docsRow: {
    flexDirection: "row",
    gap: 16,
  },
  docImage: {
    width: 180,
    height: 120,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundLight,
  },
  docLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
  docPlaceholder: {
    width: 180,
    height: 120,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  docPlaceholderText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },
  // Fields
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  fieldLabel: {
    fontSize: SIZES.body4,
    color: COLORS.textSecondary,
    minWidth: 140,
  },
  fieldValue: {
    fontSize: SIZES.body4,
    color: COLORS.textPrimary,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  fieldInput: {
    flex: 1,
    fontSize: SIZES.body4,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.backgroundLight,
  },
  fieldInputMultiline: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  // Portfolio
  portfolioGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  portfolioThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundLight,
  },
  // Save button
  saveButton: {
    backgroundColor: COLORS.tertiary,
    paddingVertical: 10,
    borderRadius: SIZES.radius,
    alignItems: "center",
    marginBottom: 12,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: SIZES.body4,
  },
  // Error banner
  errorBanner: {
    backgroundColor: "#FFF0F0",
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorBannerText: {
    color: COLORS.error,
    fontSize: SIZES.body4,
    fontWeight: "500",
  },
  // Actions
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: SIZES.radius,
    alignItems: "center",
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  verifyButton: {
    backgroundColor: COLORS.success,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: SIZES.body4,
  },
  // Image preview
  previewOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: SIZES.radius,
    zIndex: 10,
  },
  previewImage: {
    width: "90%",
    height: "90%",
  },
});
