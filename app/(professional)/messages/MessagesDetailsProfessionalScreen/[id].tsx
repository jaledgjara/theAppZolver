import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { COLORS } from "@/appASSETS/theme";
import { MessageInput } from "@/appSRC/messages/Screens/InputTextMessage";

const MessagesDetailsProfessionalScreen = () => {
  const { id, name, reservationId } = useLocalSearchParams();
  const router = useRouter();

  // Función para navegar a la creación de presupuesto
  const handleCreateQuoteNavigation = () => {
    router.push({
      pathname: "/(professional)/messages/ReservationRequestScreen",
      params: {
        clientId: id,
        clientName: name,
        mode: "quote",
      },
    });
  };

  return (
    <View style={styles.container}>
      <ToolBarTitle
        titleText={(name as string) || "Chat"}
        showBackButton={true}
      />

      <View style={styles.chatArea}>
        {/* Aquí iría la <FlatList> de mensajes (MessageCard) */}
        <Text style={styles.placeholderText}>Historial de chat con {name}</Text>
      </View>

      {/* Pasamos la función de acción al Input */}
      <MessageInput onQuotePress={handleCreateQuoteNavigation} />
    </View>
  );
};

export default MessagesDetailsProfessionalScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  chatArea: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: { color: COLORS.textSecondary, fontStyle: "italic" },
});
