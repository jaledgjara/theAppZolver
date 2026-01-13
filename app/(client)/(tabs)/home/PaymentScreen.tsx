import { StyleSheet, Text, View } from "react-native";
import React from "react";
import PaymentMethodListScreen from "@/appSRC/paymentMethod/Screens/PaymentMethodListScreen";

export default function PaymentScreen() {
  return <PaymentMethodListScreen mode="checkout" />;
}
