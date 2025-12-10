import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import React from "react";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { useRouter } from "expo-router";
import MessageCard from "@/appSRC/messages/Screens/MessageCard";

// app/(professional)/(tabs)/messages/index.tsx

// app/(professional)/(tabs)/messages/index.tsx

export const MESSAGES_DATA = [
  {
    id: "7pMDHNthDHWB30Khu5KJTOZu7oW2", // Dami Young (ID Firebase)
    name: "Dami Young",
    lastMessage: "¿Llegaste bien?",
    avatarUrl: "https://randomuser.me/api/portraits/men/11.jpg",
  },
  {
    id: "1pMDHNthDHWB30Khu5KJTOZu7oW2", // Clara Martínez
    name: "Clara Martínez",
    lastMessage: "Te mando el archivo ahora.",
    avatarUrl: "https://randomuser.me/api/portraits/women/21.jpg",
  },
  {
    id: "2pMDHNthDHWB30Khu5KJTOZu7oW2", // Lucas Ribeiro
    name: "Lucas Ribeiro",
    lastMessage: "¿Entrenamos mañana?",
    avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    id: "3pMDHNthDHWB30Khu5KJTOZu7oW2", // Sofía Hernández
    name: "Sofía Hernández",
    lastMessage: "Perfecto, confirmado.",
    avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    id: "4pMDHNthDHWB30Khu5KJTOZu7oW2", // Javier Ortega
    name: "Javier Ortega",
    lastMessage: "Estoy saliendo.",
    avatarUrl: "https://randomuser.me/api/portraits/men/55.jpg",
  },
  {
    id: "5pMDHNthDHWB30Khu5KJTOZu7oW2", // Mina Okabe
    name: "Mina Okabe",
    lastMessage: "¡Me encanta esa idea!",
    avatarUrl: "https://randomuser.me/api/portraits/women/68.jpg",
  },
];
const MessagesProfesional = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Mensajes" />

      <FlatList
        data={MESSAGES_DATA}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname:
                  "(professional)/messages/MessagesDetailsProfessionalScreen/[id]",
                params: { id: item.id, name: item.name },
              })
            }>
            <MessageCard
              name={item.name}
              lastMessage={item.lastMessage}
              avatarUrl={item.avatarUrl}
            />
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default MessagesProfesional;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  listContent: {
    paddingHorizontal: 5,
    paddingBottom: 20,
    paddingTop: 5,
  },
});
