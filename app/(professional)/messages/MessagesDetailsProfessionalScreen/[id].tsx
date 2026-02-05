import React, { useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

// UI Components
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { MessageInput } from "@/appSRC/messages/Screens/InputTextMessage";
import { ChatMessage } from "@/appSRC/messages/Type/MessageType";
import { useMessages } from "@/appSRC/messages/Hooks/useMessage";
import { ChatBubble } from "@/appSRC/messages/Screens/ChatBubble";
import { ChatBudgetCard } from "@/appSRC/messages/Screens/ChatBudgetCard";

const MessagesDetailsProfessionalScreen = () => {
  const { id, name, conversationId } = useLocalSearchParams();
  const { messages, loading, sendMessage } = useMessages(
    conversationId as string,
    id as string
  );
  console.log("🔍 [Check] Conversation ID en Chat:", conversationId);
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100
      );
    }
  }, [messages]);

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    return (
      <View
        style={[
          styles.bubbleWrapper,
          item.isMine ? styles.myBubbleWrapper : styles.theirBubbleWrapper,
        ]}>
        {/* 💡 Lógica Polimórfica Completa */}
        {item.type === "budget" ? (
          <ChatBudgetCard
            message={item}
            // El profesional quizás no necesita "Aceptar" su propio presupuesto,
            // pero el card le sirve para ver el estado (Pendiente/Aceptado).
            onPress={() => console.log("Detalles del presupuesto enviado")}
          />
        ) : item.type === "image" ? (
          <View
            style={[
              styles.imageCard,
              item.isMine ? styles.myImageCard : styles.theirImageCard,
            ]}>
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
    // 🔥 WRAP ENTIRE SCREEN in KeyboardAvoidingView
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}>
      <ToolBarTitle
        titleText={(name as string) || "Chat con Cliente"}
        showBackButton
      />

      {/* 🔥 CHAT AREA wrapped in flex: 1 View */}
      <View style={styles.chatArea}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          // 🔥 Auto-scroll when keyboard appears
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
        />
      </View>

      {/* 🔥 INPUT without its own KeyboardAvoidingView */}
      <MessageInput
        placeholderName={name as string}
        onSendText={sendMessage}
        onQuotePress={() => {
          if (!conversationId) {
            Alert.alert("Error", "No se encontró el ID de la conversación.");
            return;
          }
          router.push({
            pathname: "/(professional)/messages/ReservationRequestScreen",
            params: {
              clientId: id,
              conversationId: conversationId, // ✅ Asegurado
            },
          });
        }}
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
