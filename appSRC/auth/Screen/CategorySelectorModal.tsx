import React from "react";
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES } from "@/appASSETS/theme";
import { ServiceCategory } from "@/appSRC/auth/Hooks/useServiceCatalog";

interface Props {
  visible: boolean;
  onClose: () => void;
  categories: ServiceCategory[];
  loading: boolean;
  selectedId?: string;
  onSelect: (category: ServiceCategory) => void;
}

export const CategorySelectorModal: React.FC<Props> = ({
  visible,
  onClose,
  categories,
  loading,
  selectedId,
  onSelect,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Elige tu Categoría</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color={COLORS.primary}
              style={{ margin: 20 }}
            />
          ) : (
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = selectedId === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.item, isSelected && styles.itemSelected]}
                    onPress={() => onSelect(item)}>
                    <View
                      style={[
                        styles.iconBox,
                        isSelected && { backgroundColor: COLORS.primary },
                      ]}>
                      <Ionicons
                        name={(item.icon_slug as any) || "cube"}
                        size={20}
                        color={isSelected ? "white" : COLORS.textSecondary}
                      />
                    </View>
                    <Text
                      style={[styles.text, isSelected && styles.textSelected]}>
                      {item.name}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="radio-button-on"
                        size={22}
                        color={COLORS.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    paddingBottom: 15,
  },
  title: {
    fontSize: SIZES.body3,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  closeBtn: { backgroundColor: "#F5F5F5", padding: 6, borderRadius: 20 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "transparent",
  },
  itemSelected: { backgroundColor: "#FFFDF5", borderColor: COLORS.primary },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EFEFEF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  text: { flex: 1, fontSize: 16, color: COLORS.textPrimary, fontWeight: "500" },
  textSelected: { fontWeight: "700" },
});
