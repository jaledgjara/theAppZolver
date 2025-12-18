import React, { useRef, useEffect } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

// UI Components
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { COLORS } from "@/appASSETS/theme";
import { MessageInput } from "@/appSRC/messages/Screens/InputTextMessage";
import { ChatBubble } from "@/appSRC/messages/Screens/ChatBubble";
// Logic
import { useMessages } from "@/appSRC/messages/Hooks/useMessage";
import { ChatMessage, BudgetPayload } from "@/appSRC/messages/Type/MessageType";
import { ChatBudgetCard } from "@/appSRC/messages/Screens/ChatBudgetCard";

const MessagesDetailsClientScreen = () => {
  const { id, name, conversationId } = useLocalSearchParams();
  const router = useRouter(); // ✅ Necesario para navegar al checkout

  // Hook Maestro
  const { messages, loading, sendMessage } = useMessages(
    conversationId as string,
    id as string
  );

  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // --- NAVEGACIÓN AL CHECKOUT ---
  const handleBudgetPress = (payload: BudgetPayload, messageId: string) => {
    // Solo permitimos click si está pendiente
    if (payload.status !== "pending") return;

    console.log("Navegando a ConfirmBudgetScreen...");

    // Navegamos fuera del Stack de Mensajes -> Hacia el Tab de Reservas
    router.push({
      pathname: "/(client)/messages/ConfirmBudgetScreen", // Ruta corregida
      params: {
        professionalId: id,
        budgetPrice: payload.price.toString(),
        budgetTitle: payload.serviceName,
        budgetNotes: payload.notes || "",
        messageId: messageId,
        conversationId: conversationId,
      },
    });
    console.log("Llegamos!...");
  };

  // 6. Factory: Decide qué componente pintar según el tipo
  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    switch (item.type) {
      // CASO 1: PRESUPUESTO
      case "budget":
        return (
          <ChatBudgetCard
            message={item}
            onPress={() => handleBudgetPress(item.data, item.id)}
          />
        );

      // CASO 2: IMAGEN (Usamos ChatBubble como fallback visual)
      case "image":
        return (
          <ChatBubble
            // 🛠️ FIX: Estructura correcta con 'data'
            message={{
              id: item.id,
              conversationId: item.conversationId,
              createdAt: item.createdAt,
              isMine: item.isMine,
              isRead: item.isRead,
              type: "text", // Lo disfrazamos de texto
              data: {
                text: "📷 Imagen enviada", // ✅ AHORA SÍ: Dentro de data
              },
            }}
          />
        );

      // CASO 3: TEXTO REAL
      case "text":
        return <ChatBubble message={item} isMine={item.isMine} />;

      // CASO 4: DEFAULT / ERROR
      default:
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
        titleText={(name as string) || "Soporte / Profesional"}
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
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          />
        )}
      </View>

      {/* Input solo texto para el cliente */}
      <MessageInput onSendText={sendMessage} />
    </View>
  );
};

export default MessagesDetailsClientScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6F8" },
  chatArea: { flex: 1, paddingHorizontal: 12 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingVertical: 16, paddingBottom: 20 },
});
