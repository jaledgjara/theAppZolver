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
import {
  useLocalSearchParams,
  useRouter,
  useFocusEffect,
  router,
} from "expo-router";

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

  const {
    messages,
    loading,
    loadingMore,
    loadMore,
    sendMessage,
    refreshMessages,
  } = useMessages(conversationId as string, id as string);

  const { pickImage } = useMessageImagePicker((uri) => setPendingImage(uri));

  const handleSendMessage = async (text: string) => {
    sendMessage(text, pendingImage || undefined);
    setPendingImage(null);
  };

  const handleBudgetPress = (payload: BudgetPayload, messageId: string) => {
    router.push({
      pathname: "/(client)/messages/ConfirmBudgetScreen",
      params: {
        professionalId: id, // ID del experto con el que estamos hablando
        budgetPrice: payload.price.toString(),
        budgetTitle: payload.serviceName,
        messageId: messageId,
        conversationId: conversationId as string,
      },
    });
  };

  // Refresco al volver a la pantalla (ej: volver de ConfirmBudgetScreen).
  // useMessages ya hace el fetch inicial via useEffect, así que aquí solo
  // refrescamos si la pantalla re-gana foco (no en el mount inicial).
  const hasInitializedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!hasInitializedRef.current) {
        // Primer mount: useMessages ya carga los datos → skip
        hasInitializedRef.current = true;
        return;
      }
      // Re-focus (ej: volver de otra pantalla): refrescar datos
      console.log("[Screen] 🎯 Re-focus detected, refreshing messages...");
      refreshMessages();
    }, [refreshMessages])
  );

  const renderMessageItem = ({ item }: { item: ChatMessage }) => (
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
          />
        </View>
      ) : (
        <ChatBubble message={item} isMine={item.isMine} />
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ToolBarTitle titleText={(name as string) || "Chat"} showBackButton />

      <View style={styles.chatArea}>
        {loading ? (
          <MiniLoaderScreen />
        ) : (
          <FlatList
            data={messages}
            inverted // 💡 Crucial: Mantiene el scroll abajo y el índice 0 abajo.
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.listContent}
            onEndReached={loadMore} // Carga mensajes antiguos al subir
            onEndReachedThreshold={0.3}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListFooterComponent={loadingMore ? <MiniLoaderScreen /> : null}
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
