import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React from "react";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { Ionicons } from "@expo/vector-icons";
import ProfileCard from "@/appSRC/profile/Screens/ProfileCard";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { useRouter } from "expo-router";
import { CLIENT_MENU_ITEMS } from "@/appSRC/profile/Type/ProfileData";
import { COLORS } from "@/appASSETS/theme";
import { useUnreadCount } from "@/appSRC/notifications/Hooks/useUnreadCount";

const Profile = () => {
  const router = useRouter();
  const { unreadCount } = useUnreadCount();

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Perfil" />

      <FlatList
        data={CLIENT_MENU_ITEMS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}>
            <ProfileCard
              icon={
                <Ionicons
                  name={item.icon as keyof typeof Ionicons.glyphMap}
                  size={25}
                  color={"black"}
                />
              }
              title={item.title}
              subtitle={item.subtitle}
              badge={item.icon === "notifications-outline" ? unreadCount : undefined}
            />
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
});
