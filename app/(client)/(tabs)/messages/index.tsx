import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { ToolBarTitle } from '@/appCOMP/toolbar/Toolbar'
import { useRouter } from 'expo-router'
import MessageCard from '@/appSRC/messages/Screens/MessageCard'

export const MESSAGES_DATA = [
  {
    id: "u1",
    name: "Dami Young",
    lastMessage: "¿Llegaste bien?",
    avatarUrl: "https://randomuser.me/api/portraits/men/11.jpg",
  },
  {
    id: "u2",
    name: "Clara Martínez",
    lastMessage: "Te mando el archivo ahora.",
    avatarUrl: "https://randomuser.me/api/portraits/women/21.jpg",
  },
  {
    id: "u3",
    name: "Lucas Ribeiro",
    lastMessage: "¿Entrenamos mañana?",
    avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    id: "u4",
    name: "Sofía Hernández",
    lastMessage: "Perfecto, confirmado.",
    avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    id: "u5",
    name: "Javier Ortega",
    lastMessage: "Estoy saliendo.",
    avatarUrl: "https://randomuser.me/api/portraits/men/55.jpg",
  },
  {
    id: "u6",
    name: "Mina Okabe",
    lastMessage: "¡Me encanta esa idea!",
    avatarUrl: "https://randomuser.me/api/portraits/women/68.jpg",
  },
];


const Messages = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ToolBarTitle
        titleText='Mensajes'
      />

      <FlatList
        data={MESSAGES_DATA}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "(client)/messages/MessagesDetailsScreen/[id]",
                params: { id: item.id, name: item.name }
              })
            }
          >
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
  )
}

export default Messages

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  listContent: {
    paddingHorizontal: 5,
    paddingBottom: 20,
    paddingTop: 5,
  }
})