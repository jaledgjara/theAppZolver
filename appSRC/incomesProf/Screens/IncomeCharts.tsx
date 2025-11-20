// IncomeChartCard.tsx
// Chart displayed with the same style as IncomeCard

import { SIZES } from "@/appASSETS/theme";
import React from "react";
import { View, Image, StyleSheet, Text } from "react-native";

const IncomeChartCard = () => {
  const chartUrl =
    "https://quickchart.io/chart?width=900&height=420&format=png&backgroundColor=white&c=%7B%22type%22%3A%22line%22%2C%22data%22%3A%7B%22labels%22%3A%5B%22Lun%22%2C%22Mar%22%2C%22Mi%C3%A9%22%2C%22Jue%22%2C%22Vie%22%2C%22S%C3%A1b%22%2C%22Dom%22%5D%2C%22datasets%22%3A%5B%7B%22label%22%3A%22Ingresos%22%2C%22data%22%3A%5B150%2C400%2C320%2C800%2C1200%2C600%2C900%5D%2C%22borderColor%22%3A%22%234A90E2%22%2C%22borderWidth%22%3A3%2C%22tension%22%3A0.35%2C%22pointRadius%22%3A4%2C%22pointBackgroundColor%22%3A%22%234A90E2%22%2C%22pointBorderWidth%22%3A1%2C%22fill%22%3Afalse%7D%5D%7D%2C%22options%22%3A%7B%22plugins%22%3A%7B%22legend%22%3A%7B%22display%22%3Afalse%7D%7D%2C%22scales%22%3A%7B%22x%22%3A%7B%22grid%22%3A%7B%22display%22%3Afalse%7D%2C%22ticks%22%3A%7B%22color%22%3A%22%23777%22%2C%22font%22%3A%7B%22size%22%3A12%7D%7D%7D%2C%22y%22%3A%7B%22beginAtZero%22%3Afalse%2C%22grid%22%3A%7B%22color%22%3A%22rgba(0%2C0%2C0%2C0.05)%22%7D%2C%22ticks%22%3A%7B%22color%22%3A%22%23777%22%2C%22font%22%3A%7B%22size%22%3A12%7D%7D%7D%7D%7D%7D";

  return (
    <View style={styles.card}>
      <Text style={styles.title}> Ingresos</Text>

      <Image
        source={{ uri: chartUrl }}
        style={styles.chartImage}
        resizeMode="contain"
      />
    </View>
  );
};

export default IncomeChartCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 16,
    marginBottom: 16,

    // Shadow (iOS)
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,

    // Shadow (Android)
    elevation: 2,
  },

  chartImage: {
    width: "100%",
    height: 250,
    borderRadius: 12,
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: '600'
  }
});
