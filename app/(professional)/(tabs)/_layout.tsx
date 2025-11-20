import { Tabs } from "expo-router";
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { COLORS } from "@/appASSETS/theme";


export default function TabsProfessionalLayout() {
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
        name="home"
        options={{
          title: 'Inicio',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reservations"
        options={{
          title: 'Reservas',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="calendar" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="incomes"
        options={{
          title: 'Ingresos',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="stats-chart" size={24} color={color} />

          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Mensajes',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons size={28} name="chatbubbles" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
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