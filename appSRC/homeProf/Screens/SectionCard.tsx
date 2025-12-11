import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import SectionItem, { SectionItemProps } from "./SectionItem";
import { COLORS, SIZES } from "@/appASSETS/theme";

interface SectionCardProps {
  title: string;
  date?: string;
  data: SectionItemProps[];
}

const SectionCard: React.FC<SectionCardProps> = ({ title, date, data }) => {
  return (
    <View style={styles.container}>
      {/* Header de la Tarjeta */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {date && <Text style={styles.date}>{date}</Text>}
      </View>

      <View style={styles.listContainer}>
        <FlatList
          data={data}
          keyExtractor={(item, index) => `${item.title}-${index}`}
          renderItem={({ item }) => <SectionItem {...item} />}
          // Separador sutil
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

export default SectionCard;

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    backgroundColor: "#FFF",
    borderRadius: 16, // Bordes más modernos
    // Sombra "Soft Shadow" estilo iOS/Material moderno
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, // Sombra más sutil y elegante
    shadowRadius: 12,
    elevation: 2, // Android suave
    overflow: "hidden", // Asegura que nada se salga del borde redondeado
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: "#FFF",
  },
  title: {
    fontSize: 18,
    fontWeight: "600", // Muy bold para jerarquía
    color: "#333",
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
    color: COLORS.primary, // Usamos el color primario para la fecha (toque de marca)
    textTransform: "uppercase",
  },
  listContainer: {
    paddingHorizontal: 20, // Padding interno para la lista
    paddingBottom: 10,
  },
  separator: {
    height: 1,
    backgroundColor: "#F0F0F0", // Separador muy sutil
    width: "100%",
  },
});
