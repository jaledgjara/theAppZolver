import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import React from "react";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { useRouter } from "expo-router";
import MessageCard from "@/appSRC/messages/Screens/MessageCard";
import { useProFetchingConversation } from "@/appSRC/conversation/Hooks/useProFetchingConversation";
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";
import StatusPlaceholder from "@/appCOMP/contentStates/StatusPlaceholder";

const Messages = () => {
  const router = useRouter();

  // 1. Consumimos el estado del Hook
  const { conversations, loading, refreshConversations } =
    useProFetchingConversation();

  // ESTADO 1: CARGANDO (Si es la carga inicial)
  if (loading && conversations.length === 0) {
    return (
      <View style={styles.container}>
        <ToolBarTitle titleText="Mensajes" />
        <MiniLoaderScreen />
      </View>
    );
  }

  // ESTADO 2: VACÍO (No hay chats)
  if (!loading && conversations.length === 0) {
    return (
      <View style={styles.container}>
        <ToolBarTitle titleText="Mensajes" />
        <View style={styles.emptyContainer}>
          <StatusPlaceholder
            icon="message-text-outline"
            title="Bandeja Vacía"
            subtitle="Aún no has iniciado conversaciones con clientes."
            // Opcional: Un botón para ir al Home si quisieras
            // buttonTitle="Ir al Inicio"
            // onButtonPress={() => router.push("/(professional)/(tabs)/home")}
          />
        </View>
      </View>
    );
  }

  // ESTADO 3: CON DATOS (Lista de Chats)
  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Mensajes" />

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={refreshConversations}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname:
                  "(professional)/messages/MessagesDetailsProfessionalScreen/[id]",
                // Pasamos datos clave para que la siguiente pantalla cargue rápido
                params: {
                  id: item.partner.id, // ID del Cliente
                  name: item.partner.name, // Nombre para el Toolbar
                  conversationId: item.id, // ID de la Conversación (Optimización)
                },
              })
            }>
            <MessageCard
              name={item.partner.name} // ✅ Usamos el 'PartnerProfileSummary' aquí
              lastMessage={item.preview.content}
              avatarUrl={item.partner.avatar || undefined}
              // timestamp={item.preview.timestamp} // Sugerencia futura
            />
          </Pressable>
        )}
      />
    </View>
  );
};

export default Messages;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  listContent: {
    paddingVertical: 10,
  },
});
