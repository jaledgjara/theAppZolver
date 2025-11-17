import { Tabs } from "expo-router";
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { COLORS } from "@/appASSETS/theme";


export default function TabsClientLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#A0AEC0',
        tabBarStyle: {
          backgroundColor: 'white',
        },
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{
          title: 'Inicio',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Reservations"
        options={{
          title: 'Reservas',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="calendar" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Messages"
        options={{
          title: 'Mensajes',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons size={28} name="chatbubbles" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Profile"
        options={{
          title: 'Perfil',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="user" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}