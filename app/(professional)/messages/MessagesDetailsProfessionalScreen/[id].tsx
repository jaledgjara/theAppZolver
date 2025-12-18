import React, { useRef, useEffect } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

// 1. Componentes Visuales y UI
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { COLORS } from "@/appASSETS/theme";
import { MessageInput } from "@/appSRC/messages/Screens/InputTextMessage";
import { ChatMessage } from "@/appSRC/messages/Type/MessageType";
import { useMessages } from "@/appSRC/messages/Hooks/useMessage";
import { ChatBubble } from "@/appSRC/messages/Screens/ChatBubble";
import { ChatBudgetCard } from "@/appSRC/messages/Screens/ChatBudgetCard";

// 2. Lógica de Negocio y Tipos

const MessagesDetailsProfessionalScreen = () => {
  // Params: id (Cliente ID), conversationId (ID del Chat)
  const { id, name, conversationId } = useLocalSearchParams();
  const router = useRouter();

  // 3. Inicializamos el Hook Maestro
  const { messages, loading, sendMessage } = useMessages(
    conversationId as string,
    id as string
  );

  // Referencia para controlar el scroll del listado
  const flatListRef = useRef<FlatList>(null);

  // 4. Efecto: Scroll al fondo cuando llegan mensajes nuevos
  useEffect(() => {
    if (messages.length > 0) {
      // Pequeño delay para asegurar que el layout se calculó
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // 5. Navegación a Crear Presupuesto
  const handleCreateQuoteNavigation = () => {
    router.push({
      pathname: "/(professional)/messages/ReservationRequestScreen",
      params: {
        clientId: id,
        clientName: name,
        conversationId: conversationId, // Pasamos el ID del chat para volver luego
        mode: "quote",
      },
    });
  };

  // 6. Factory: Decide qué componente pintar según el tipo
  // 6. Factory: Decide qué componente pintar según el tipo
  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    switch (item.type) {
      case "budget":
        return (
          <ChatBudgetCard
            message={item}
            onPress={() => console.log("Ir a detalle de reserva", item.data)}
          />
        );

      case "image":
        return (
          <ChatBubble
            // ✅ FIX: Estructura correcta (text va dentro de data)
            message={{
              id: item.id,
              conversationId: item.conversationId,
              createdAt: item.createdAt,
              isMine: item.isMine,
              isRead: item.isRead,
              type: "text",
              data: {
                text: "📷 Imagen enviada",
              },
            }}
          />
        );

      case "text":
        // El item ya es correcto, lo pasamos directo
        return <ChatBubble message={item} />;

      default:
        // Fallback para tipos desconocidos
        return (
          <ChatBubble
            // 🛠️ FIX: Estructura correcta con 'data'
            message={{
              id: "fallback",
              conversationId: "unknown",
              createdAt: new Date(),
              isMine: false,
              isRead: true,
              type: "text",
              data: {
                text: "Formato de mensaje no soportado", // ✅ AHORA SÍ: Dentro de data
              },
            }}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <ToolBarTitle
        titleText={(name as string) || "Chat"}
        showBackButton={true}
      />

      <View style={styles.chatArea}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            // Mantiene el teclado manejable y permite tocar burbujas
            keyboardShouldPersistTaps="handled"
            // Optimizaciones de rendimiento para listas largas
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={10}
            // Layout animado al aparecer nuevos items (Opcional)
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          />
        )}
      </View>

      {/* 7. Input Conectado */}
      <MessageInput
        onSendText={sendMessage} // Conecta con Supabase
        onQuotePress={handleCreateQuoteNavigation} // Navegación de Pro
      />
    </View>
  );
};

export default MessagesDetailsProfessionalScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F8", // Fondo gris muy suave para resaltar burbujas
  },
  chatArea: {
    flex: 1,
    paddingHorizontal: 12, // Espacio lateral para las burbujas
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingVertical: 16,
    paddingBottom: 20, // Espacio extra al final
  },
});
