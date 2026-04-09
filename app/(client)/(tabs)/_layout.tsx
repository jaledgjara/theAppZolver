import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/appASSETS/theme";
import { useUnreadCount } from "@/appSRC/notifications/Hooks/useUnreadCount";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React from "react";

// Altura base del tab bar sin incluir el inset inferior del device.
// El inset (home indicator iPhone, gesture bar Android) se suma dinámicamente.
const TAB_BAR_BASE_HEIGHT = 60;
const TAB_BAR_MIN_BOTTOM_PADDING = 8;

export default function TabsClientLayout() {
  const { unreadCount } = useUnreadCount();
  const insets = useSafeAreaInsets();

  // Respeta el safe area de cada device:
  // - iPhone con notch: insets.bottom ~34 → altura total 94
  // - Android con gesture bar: insets.bottom ~16-24 → altura total 76-84
  // - Devices sin inset: cae al mínimo 8 → altura total 68
  const bottomPadding = Math.max(insets.bottom, TAB_BAR_MIN_BOTTOM_PADDING);
  const tabBarHeight = TAB_BAR_BASE_HEIGHT + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.brandDeep,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarStyle: [styles.tabBar, { height: tabBarHeight, paddingBottom: bottomPadding }],
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Inicio",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon iconName="home" color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="reservations"
        options={{
          title: "Reservas",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon iconName="calendar" color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="messages"
        options={{
          title: "Mensajes",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon iconName="chatbubbles" color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon iconName="person" color={color} focused={focused} />
          ),
          tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? "99+" : unreadCount) : undefined,
          tabBarBadgeStyle: styles.badge,
        }}
      />
    </Tabs>
  );
}

// Ícono con fondo circular sutil cuando está activo
interface TabIconProps {
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  focused: boolean;
}

const TabIcon: React.FC<TabIconProps> = ({ iconName, color, focused }) => (
  <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
    <Ionicons name={iconName} size={22} color={color} />
  </View>
);

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_500Medium",
  },
  iconWrap: {
    width: 44,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: COLORS.brandLight,
  },
  badge: {
    backgroundColor: COLORS.brandDeep,
    color: COLORS.white,
    fontSize: 11,
    fontFamily: "PlusJakartaSans_700Bold",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    lineHeight: 18,
  },
});
