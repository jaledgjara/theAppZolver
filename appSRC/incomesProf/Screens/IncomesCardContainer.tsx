import React from "react";
import { View, StyleSheet } from "react-native";

interface Props {
  children: React.ReactNode;
}

const IncomeCardsContainer: React.FC<Props> = ({ children }) => {
  return <View style={styles.container}>{children}</View>;
};

export default IncomeCardsContainer;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
});