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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: "#FFF",
  },
  title: {
    fontSize: SIZES.body2,
    fontWeight: "600",
    color: "#333",
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 4,
    color: COLORS.primary,
    textTransform: "uppercase",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  separator: {
    height: 1,
    backgroundColor: "#F0F0F0",
    width: "100%",
  },
});
