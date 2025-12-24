import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { useSignOut } from "@/appSRC/auth/Hooks/useSignOut";
import DestructiveProfileScreen from "@/appSRC/auth/Screen/DestructiveProfileScreen";

export default function AppSettingsScreen() {
  return <DestructiveProfileScreen />;
}
