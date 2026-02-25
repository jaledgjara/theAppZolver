import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { COLORS, SIZES } from "@/appASSETS/theme";
import { AdminUser } from "../Type/AdminTypes";
import { AdminUserService } from "../Service/AdminUserService";
import { useAdminUserActions } from "../Hooks/useAdminUserActions";
import RoleBadge from "./RoleBadge";

interface UserDetailModalProps {
  user: AdminUser | null;
  visible: boolean;
  onClose: () => void;
}

const ROLES: Array<"client" | "professional" | "admin"> = [
  "client",
  "professional",
  "admin",
];

export default function UserDetailModal({
  user,
  visible,
  onClose,
}: UserDetailModalProps) {
  const [selectedRole, setSelectedRole] = useState(user?.role ?? "client");
  const { changeRole, isChangingRole, approveProfessional, rejectProfessional, isUpdatingStatus } =
    useAdminUserActions();

  useEffect(() => {
    if (user) setSelectedRole(user.role ?? "client");
  }, [user]);

  const professionalQuery = useQuery({
    queryKey: ["admin", "professional", user?.id],
    queryFn: () => AdminUserService.fetchProfessionalDetail(user!.id),
    enabled: visible && user?.role === "professional",
  });

  if (!user) return null;

  const handleRoleChange = () => {
    if (selectedRole === user.role) return;
    changeRole(
      { authUid: user.authUid, role: selectedRole },
      { onSuccess: onClose }
    );
  };

  const professional = professionalQuery.data;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={styles.modal}
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Detalle de usuario</Text>
              <Pressable onPress={onClose}>
                <Text style={styles.closeButton}>Cerrar</Text>
              </Pressable>
            </View>

            {/* User info */}
            <View style={styles.section}>
              <InfoRow label="Nombre" value={user.legalName ?? "—"} />
              <InfoRow label="Email" value={user.email} />
              <InfoRow label="Teléfono" value={user.phone ?? "—"} />
              <InfoRow
                label="Registrado"
                value={user.createdAt.toLocaleDateString("es-AR")}
              />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Rol</Text>
                <RoleBadge role={user.role} />
              </View>
              <InfoRow
                label="Perfil"
                value={user.profileComplete ? "Completo" : "Incompleto"}
              />
            </View>

            {/* Professional section */}
            {user.role === "professional" && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Profesional</Text>
                {professionalQuery.isLoading ? (
                  <ActivityIndicator color={COLORS.tertiary} />
                ) : professional ? (
                  <>
                    <InfoRow
                      label="Estado identidad"
                      value={professional.identityStatus}
                    />
                    <InfoRow
                      label="Tipo trabajo"
                      value={professional.typeWork ?? "—"}
                    />
                    <InfoRow
                      label="Activo"
                      value={professional.isActive ? "Sí" : "No"}
                    />

                    {(professional.identityStatus === "pending" ||
                      professional.identityStatus === "rejected") && (
                      <View style={styles.actionRow}>
                        <Pressable
                          style={[styles.actionButton, styles.approveButton]}
                          onPress={() => approveProfessional(user.id)}
                          disabled={isUpdatingStatus}
                        >
                          <Text style={styles.actionButtonText}>Aprobar</Text>
                        </Pressable>
                        {professional.identityStatus === "pending" && (
                          <Pressable
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={() => rejectProfessional(user.id)}
                            disabled={isUpdatingStatus}
                          >
                            <Text style={styles.actionButtonText}>
                              Rechazar
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    )}
                  </>
                ) : (
                  <Text style={styles.emptyText}>
                    Sin perfil profesional encontrado.
                  </Text>
                )}
              </View>
            )}

            {/* Role change */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cambiar rol</Text>
              <View style={styles.roleRow}>
                {ROLES.map((role) => (
                  <Pressable
                    key={role}
                    style={[
                      styles.roleChip,
                      selectedRole === role && styles.roleChipSelected,
                    ]}
                    onPress={() => setSelectedRole(role)}
                  >
                    <Text
                      style={[
                        styles.roleChipText,
                        selectedRole === role && styles.roleChipTextSelected,
                      ]}
                    >
                      {role === "client"
                        ? "Cliente"
                        : role === "professional"
                          ? "Profesional"
                          : "Admin"}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Pressable
                style={[
                  styles.saveButton,
                  (selectedRole === user.role || isChangingRole) &&
                    styles.saveButtonDisabled,
                ]}
                onPress={handleRoleChange}
                disabled={selectedRole === user.role || isChangingRole}
              >
                {isChangingRole ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar cambio</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: 480,
    maxHeight: "80%",
    padding: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: SIZES.h3,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  closeButton: {
    fontSize: SIZES.body4,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  section: {
    marginBottom: 20,
    gap: 10,
  },
  sectionTitle: {
    fontSize: SIZES.body4,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: SIZES.body4,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: SIZES.body4,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: SIZES.radius,
    alignItems: "center",
  },
  approveButton: {
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
  roleRow: {
    flexDirection: "row",
    gap: 8,
  },
  roleChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  roleChipSelected: {
    borderColor: COLORS.tertiary,
    backgroundColor: COLORS.tertiary,
  },
  roleChipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  roleChipTextSelected: {
    color: COLORS.white,
  },
  saveButton: {
    backgroundColor: COLORS.tertiary,
    paddingVertical: 12,
    borderRadius: SIZES.radius,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: SIZES.body4,
  },
});
