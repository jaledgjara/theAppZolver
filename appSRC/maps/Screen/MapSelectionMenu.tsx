import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, FONTS } from "@/appASSETS/theme";
import { MapAppOption } from "../Type/MapsType";

interface Props {
  isVisible: boolean;
  onClose: () => void;
  options: MapAppOption[];
  onSelect: (url: string) => void;
}

export const MapSelectionMenu = ({
  isVisible,
  onClose,
  options,
  onSelect,
}: Props) => {
  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}>
        <View style={styles.content}>
          <Text style={styles.title}>Selecciona un mapa</Text>
          {options.map((map, index) => (
            <TouchableOpacity
              key={index}
              style={styles.option}
              onPress={() => {
                onSelect(map.url);
                onClose();
              }}>
              <Text style={styles.optionText}>{map.appName}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 10,
    paddingBottom: 10,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.textSecondary,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  option: {
    paddingLeft: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 15,
    alignItems: "flex-start",
    width: "100%",
  },
  cancelOption: {
    borderBottomWidth: 0,
    marginTop: 10,
  },
  optionText: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
    marginVertical: 10,
  },
  cancelButton: { paddingLeft: 20, marginTop: 10, alignItems: "flex-start" },
  cancelText: { ...FONTS.h2, color: COLORS.error, marginVertical: 10 },
  content: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 10,
    paddingBottom: 40,
  },
});
