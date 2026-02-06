import React, { useRef, useEffect, useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

// UI Components
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { MessageInput } from "@/appSRC/messages/Screens/InputTextMessage";
import { ChatMessage } from "@/appSRC/messages/Type/MessageType";
import { useMessages } from "@/appSRC/messages/Hooks/useMessage";
import { ChatBubble } from "@/appSRC/messages/Screens/ChatBubble";
import { ChatBudgetCard } from "@/appSRC/messages/Screens/ChatBudgetCard";
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";
import { useMessageImagePicker } from "@/appSRC/messages/Hooks/useMessageImagePicker";

// ... imports previos ...

const MessagesDetailsProfessionalScreen = () => {
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const { id, name, conversationId } = useLocalSearchParams();
  const router = useRouter();

  const {
    messages,
    loading,
    loadingMore,
    loadMore,
    sendMessage,
    refreshMessages,
  } = useMessages(conversationId as string, id as string);

  useFocusEffect(
    useCallback(() => {
      console.log("[ProfessionalScreen] 🎯 Focus check");
      if (messages.length === 0) {
        refreshMessages();
      }
    }, [refreshMessages, messages.length])
  );

  const handleSendMessage = async (text: string) => {
    sendMessage(text, pendingImage || undefined);
    setPendingImage(null);
  };

  const handleSendBudget = () => {
    router.push({
      pathname: "/(professional)/messages/ReservationRequestScreen",
      params: {
        conversationId: conversationId, // 💡 Asegúrate de que esta clave coincida
        clientId: id,
      },
    });
  };

  const renderItem = ({ item }: { item: ChatMessage }) => (
    <View
      style={[
        styles.bubbleWrapper,
        item.isMine ? styles.myBubbleWrapper : styles.theirBubbleWrapper,
      ]}>
      {item.type === "budget" ? (
        <ChatBudgetCard message={item} onPress={() => {}} />
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
      <ToolBarTitle
        titleText={(name as string) || "Zolver Chat"}
        showBackButton
      />

      <View style={styles.chatArea}>
        {loading ? (
          <MiniLoaderScreen />
        ) : (
          <FlatList
            data={messages}
            inverted // 💡 Crucial: Índice 0 abajo (mensajes nuevos)
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={false}
            // 💡 FIX: Usar ActivityIndicator en el footer para evitar saltos de layout
            ListFooterComponent={loadingMore ? <MiniLoaderScreen /> : null}
          />
        )}
      </View>

      <MessageInput
        placeholderName={name as string}
        onSendText={handleSendMessage}
        onQuotePress={handleSendBudget}
        selectedImageUri={pendingImage}
        onClearImage={() => setPendingImage(null)}
      />
    </KeyboardAvoidingView>
  );
};

export default MessagesDetailsProfessionalScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  chatArea: {
    flex: 1, // 🔥 CRITICAL: Makes the chat area take remaining space
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    flexGrow: 1, // 🔥 ADDED: Helps with proper spacing
  },
  bubbleWrapper: {
    marginVertical: 4,
    maxWidth: "85%",
  },
  // 🔥 ADDED: Proper alignment for bubbles
  myBubbleWrapper: {
    alignSelf: "flex-end",
  },
  theirBubbleWrapper: {
    alignSelf: "flex-start",
  },
  // Image styles (keep for future use)
  imageWrapper: {
    maxWidth: "75%",
    borderRadius: 18,
    overflow: "hidden",
    marginVertical: 8,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  myImage: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  theirImage: { alignSelf: "flex-start", borderBottomLeftRadius: 4 },
  chatImage: {
    width: 240,
    height: 180,
    backgroundColor: "#EEE",
  },
  imageCard: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  myImageCard: {
    alignSelf: "flex-end",
  },
  theirImageCard: {
    alignSelf: "flex-start",
  },
});
