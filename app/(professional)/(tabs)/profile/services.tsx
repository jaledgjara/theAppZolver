import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { PROFESSIONAL_EDIT_OPTIONS } from "@/appSRC/profile/Type/ProfileData";
import ProfileCard from "@/appSRC/profile/Screens/ProfileCard";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function ProfessionalServicesScreen() {
  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Administrar Servicios" showBackButton={true} />
      <View>
        <FlatList
          data={PROFESSIONAL_EDIT_OPTIONS}
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
              />
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
});
