import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { EvilIcons } from "@expo/vector-icons";
import { BaseCard } from "@/appCOMP/cards/BaseCard";

// Types for the reservation card
export type ReservationStatus = "confirmed" | "on_route" | "finalized";

export interface ReservationCardProps {
  id: string;
  name: string;
  date: string;
  time?: string;
  service: string;
  status: ReservationStatus;
  avatar: any;
  onPress?: () => void;
}

// Maps each status to visual UI styles
const getStatusStyles = (status: ReservationStatus) => {
  switch (status) {
    case "confirmed":
      return {
        text: "Confirmada",
        backgroundColor: "#D4EDDA",
        textColor: "#28A745",
      };
    case "on_route":
      return {
        text: "En Camino",
        backgroundColor: "#FFF3CD",
        textColor: "#FFC107",
      };
    case "finalized":
      return {
        text: "Finalizada",
        backgroundColor: "#D1ECF1",
        textColor: "#0C5460",
      };
    default:
      return {
        text: "Desconocido",
        backgroundColor: "#E2E3E5",
        textColor: "#721C24",
      };
  }
};

export const ReservationCard: React.FC<ReservationCardProps> = (props) => {
  const { text, backgroundColor, textColor } = getStatusStyles(props.status);

  return (
    <BaseCard
      onPress={props.onPress}
      left={<Image source={props.avatar} style={styles.avatar} />}
      middle={
        <>
          {/* Name + status badge row */}
          <View style={styles.row}>
            <Text style={styles.name} numberOfLines={1}>
              {props.name}
            </Text>

            <View style={[styles.badge, { backgroundColor }]}>
              <Text style={[styles.badgeText, { color: textColor }]}>
                {text}
              </Text>
            </View>
          </View>

          {/* Date */}
          <Text style={styles.info}>{props.date}</Text>

          {/* Optional time */}
          {props.time && <Text style={styles.info}>{props.time}</Text>}

          {/* Service name */}
          <Text style={styles.info} numberOfLines={1}>
            {props.service}
          </Text>
        </>
      }
      right={<EvilIcons name="chevron-right" size={32} color="#999" />}
    />
  );
};

const styles = StyleSheet.create({
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 25,
    backgroundColor: "#E0E0E0",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flexShrink: 1,
    marginRight: 8,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 14,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  info: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
});
