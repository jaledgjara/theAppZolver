import React, { useRef, useEffect, useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";

// UI Components
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { COLORS } from "@/appASSETS/theme";
import { MessageInput } from "@/appSRC/messages/Screens/InputTextMessage";
import { ChatBubble } from "@/appSRC/messages/Screens/ChatBubble";
import { ChatBudgetCard } from "@/appSRC/messages/Screens/ChatBudgetCard";
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";

// Logic
import { useMessages } from "@/appSRC/messages/Hooks/useMessage";
import { ChatMessage, BudgetPayload } from "@/appSRC/messages/Type/MessageType";
import { useMessageImagePicker } from "@/appSRC/messages/Hooks/useMessageImagePicker";

const MessagesDetailsClientScreen = () => {
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const { id, name, conversationId } = useLocalSearchParams();
  const router = useRouter();
  const { messages, loading, sendMessage, refreshMessages } = useMessages(
    conversationId as string,
    id as string
  );

  const flatListRef = useRef<FlatList>(null);

  const { pickImage } = useMessageImagePicker((uri) => {
    setPendingImage(uri); // 💡 Guardamos la URI localmente en la vista
  });

  // 💡 LOGICA CORREGIDA: La vista ya no decide, solo envía.
  const handleSendMessage = async (text: string) => {
    // Pasamos el texto y la imagen (si existe) al hook
    sendMessage(text, pendingImage || undefined);
    setPendingImage(null); // Limpiamos el draft
  };

  useFocusEffect(
    useCallback(() => {
      refreshMessages?.();
    }, [refreshMessages])
  );

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100
      );
    }
  }, [messages]);

  const handleBudgetPress = (payload: BudgetPayload, messageId: string) => {
    if (payload.status !== "pending_approval") return;
    router.push({
      pathname: "/(client)/messages/ConfirmBudgetScreen",
      params: {
        professionalId: id,
        budgetPrice: payload.price.toString(),
        budgetTitle: payload.serviceName,
        messageId,
        conversationId,
      },
    });
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    return (
      <View
        style={[
          styles.bubbleWrapper,
          item.isMine ? styles.myBubbleWrapper : styles.theirBubbleWrapper,
        ]}>
        {item.type === "budget" ? (
          <ChatBudgetCard
            message={item}
            onPress={() => handleBudgetPress(item.data, item.id)}
          />
        ) : item.type === "image" ? (
          <View style={styles.imageCard}>
            <Image
              source={{ uri: item.data.imageUrl }}
              style={styles.chatImage}
              resizeMode="cover"
            />
          </View>
        ) : (
          <ChatBubble message={item} isMine={item.isMine} />
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}>
      <ToolBarTitle
        titleText={(name as string) || "Profesional"}
        showBackButton
      />

      <View style={styles.chatArea}>
        {loading && messages.length === 0 ? (
          <MiniLoaderScreen />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
          />
        )}
      </View>

      <MessageInput
        placeholderName={name as string}
        onSendText={handleSendMessage}
        onImagePress={pickImage}
        selectedImageUri={pendingImage}
        onClearImage={() => setPendingImage(null)}
      />
    </KeyboardAvoidingView>
  );
};

export default MessagesDetailsClientScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  chatArea: { flex: 1 },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    flexGrow: 1, // 🔥 Changed this
  },
  bubbleWrapper: {
    marginVertical: 6,
    maxWidth: "85%",
  },
  myBubbleWrapper: { alignSelf: "flex-end" },
  theirBubbleWrapper: { alignSelf: "flex-start" },
  imageCard: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chatImage: { width: 220, height: 160 },
});
