import React, { useRef, useEffect, useCallback } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";

// UI Components
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { COLORS } from "@/appASSETS/theme";
import { MessageInput } from "@/appSRC/messages/Screens/InputTextMessage";
import { ChatBubble } from "@/appSRC/messages/Screens/ChatBubble";
import { ChatBudgetCard } from "@/appSRC/messages/Screens/ChatBudgetCard";

// Logic
import { useMessages } from "@/appSRC/messages/Hooks/useMessage";
import { ChatMessage, BudgetPayload } from "@/appSRC/messages/Type/MessageType";

const MessagesDetailsClientScreen = () => {
  const { id, name, conversationId } = useLocalSearchParams();
  const router = useRouter();

  // Asegúrate de haber actualizado useMessages para exponer 'refreshMessages'
  const { messages, loading, sendMessage, refreshMessages } = useMessages(
    conversationId as string,
    id as string
  );

  const flatListRef = useRef<FlatList>(null);

  // ✅ CRÍTICO: Recargar mensajes al volver de la confirmación
  useFocusEffect(
    useCallback(() => {
      if (refreshMessages) {
        refreshMessages();
      }
    }, [refreshMessages])
  );

  // Auto-scroll al recibir mensajes
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleBudgetPress = (payload: BudgetPayload, messageId: string) => {
    // ✅ Validar estado 'pending_approval'
    if (payload.status !== "pending_approval") return;

    router.push({
      pathname: "/(client)/messages/ConfirmBudgetScreen",
      params: {
        professionalId: id,
        budgetPrice: payload.price.toString(),
        budgetTitle: payload.serviceName,
        budgetNotes: payload.notes || "",
        messageId: messageId,
        conversationId: conversationId,
      },
    });
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    switch (item.type) {
      case "budget":
        return (
          <ChatBudgetCard
            message={item}
            onPress={() => handleBudgetPress(item.data, item.id)}
          />
        );
      case "image":
        return (
          <ChatBubble
            message={{
              ...item,
              type: "text",
              data: { text: "📷 Imagen enviada" },
            }}
          />
        );
      case "text":
        return <ChatBubble message={item} isMine={item.isMine} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ToolBarTitle
        titleText={(name as string) || "Soporte / Profesional"}
        showBackButton={true}
      />

      <View style={styles.chatArea}>
        {loading && messages.length === 0 ? (
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
          />
        )}
      </View>

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
