import React, { useRef, useEffect } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";

// UI Components
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { COLORS } from "@/appASSETS/theme";
import { MessageInput } from "@/appSRC/messages/Screens/InputTextMessage";
import { ChatBubble } from "@/appSRC/messages/Screens/ChatBubble";
import { ChatBudgetCard } from "@/appSRC/messages/Screens/ChatBudgetCard";

// Logic
import { useMessages } from "@/appSRC/messages/Hooks/useMessage";
import { ChatMessage } from "@/appSRC/messages/Type/MessageType";

const MessagesDetailsClientScreen = () => {
  const { id, name, conversationId } = useLocalSearchParams();

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

  // 6. Factory: Decide qué componente pintar según el tipo
  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    switch (item.type) {
      case "budget_proposal":
        return (
          <ChatBudgetCard
            message={item}
            onPress={() => console.log("Detalle:", item.data)}
          />
        );

      case "image":
        return (
          <ChatBubble
            // Construimos un objeto TextMessage limpio
            message={{
              id: item.id,
              conversationId: item.conversationId,
              createdAt: item.createdAt,
              isMine: item.isMine,
              isRead: item.isRead,
              type: "text",
              text: item.caption || "📷 Imagen enviada",
            }}
          />
        );

      case "text":
        return <ChatBubble message={item} />;

      default:
        const unknownItem = item as any;

        return (
          <ChatBubble
            message={{
              id: unknownItem.id || "unknown-id",
              conversationId: unknownItem.conversationId || "unknown-conv",
              createdAt: unknownItem.createdAt || new Date(),
              isMine: unknownItem.isMine ?? false,
              isRead: unknownItem.isRead ?? true,
              type: "text",
              text: "Formato de mensaje no soportado",
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

      {/* DIFERENCIA CLAVE:
         El Input del cliente NO recibe onQuotePress.
         Solo sirve para escribir texto.
      */}
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
