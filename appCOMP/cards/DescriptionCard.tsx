import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface DescriptionCardProps {
  description: string;
}

const DescriptionCard: React.FC<DescriptionCardProps> = ({ description }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 20,
    marginHorizontal: 20
  },
  description: {
    fontSize: 15,
    color: "#555",
    lineHeight: 20,
  },
});

export default DescriptionCard;
