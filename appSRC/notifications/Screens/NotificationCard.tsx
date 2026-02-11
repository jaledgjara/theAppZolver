// appSRC/notifications/Screens/NotificationCard.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";
import { COLORS, FONTS } from "@/appASSETS/theme";
import {
  Notification,
  NotificationType,
} from "@/appSRC/notifications/Type/NotificationType";

// ---------------------------------------------------------------------------
// MAPA DE ÍCONOS POR TIPO
// ---------------------------------------------------------------------------
// Cada tipo de notificación tiene su ícono y color para que el usuario
// identifique visualmente de qué se trata sin leer el título.
// ---------------------------------------------------------------------------
const ICON_MAP: Record<
  NotificationType,
  { name: keyof typeof Ionicons.glyphMap; color: string }
> = {
  reservation_new: { name: "calendar-outline", color: COLORS.tertiary },
  reservation_accepted: { name: "checkmark-circle-outline", color: COLORS.success },
  reservation_rejected: { name: "close-circle-outline", color: COLORS.error },
  reservation_completed: { name: "trophy-outline", color: COLORS.primary },
  reservation_cancelled: { name: "ban-outline", color: COLORS.error },
  message_new: { name: "chatbubble-outline", color: COLORS.tertiary },
  budget_received: { name: "document-text-outline", color: COLORS.warning },
  budget_accepted: { name: "checkmark-done-outline", color: COLORS.success },
  payment_received: { name: "wallet-outline", color: COLORS.success },
  payment_refund: { name: "arrow-undo-outline", color: COLORS.warning },
  general: { name: "notifications-outline", color: COLORS.tertiary },
};

// ---------------------------------------------------------------------------
// HELPER: Tiempo relativo ("hace 5 min", "hace 2 h", "hace 3 d")
// ---------------------------------------------------------------------------
function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Ahora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  const weeks = Math.floor(days / 7);
  return `hace ${weeks} sem`;
}

// ---------------------------------------------------------------------------
// PROPS
// ---------------------------------------------------------------------------
interface NotificationCardProps {
  item: Notification;
  onPress: () => void;
  onDelete: () => void;
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------
// Sigue el mismo patrón de Swipeable que LocationCard y SavedCardRow.
// El swipe a la izquierda revela el botón de eliminar con animación de escala.
// ---------------------------------------------------------------------------
const NotificationCard: React.FC<NotificationCardProps> = ({
  item,
  onPress,
  onDelete,
}) => {
  const iconConfig = ICON_MAP[item.type] || ICON_MAP.general;

  const renderRightActions = (_progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });

    return (
      <TouchableOpacity
        onPress={onDelete}
        style={styles.deleteButtonContainer}
        activeOpacity={0.6}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="trash-outline" size={24} color="white" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <TouchableOpacity
        style={[styles.container, !item.is_read && styles.unreadContainer]}
        onPress={onPress}
        activeOpacity={0.7}>
        {/* Ícono */}
        <View
          style={[
            styles.iconBox,
            { backgroundColor: iconConfig.color + "15" },
          ]}>
          <Ionicons
            name={iconConfig.name}
            size={24}
            color={iconConfig.color}
          />
        </View>

        {/* Contenido */}
        <View style={styles.infoContainer}>
          <View style={styles.headerRow}>
            <Text
              style={[styles.title, !item.is_read && styles.unreadTitle]}
              numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
          </View>
          <Text style={styles.body} numberOfLines={2}>
            {item.body}
          </Text>
        </View>

        {/* Indicador de no leída */}
        {!item.is_read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    </Swipeable>
  );
};

export default NotificationCard;

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  unreadContainer: {
    backgroundColor: "#FFFBF0",
    borderColor: COLORS.primary,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  infoContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    ...FONTS.body4,
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontWeight: "700",
  },
  time: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  body: {
    ...FONTS.body4,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },
  deleteButtonContainer: {
    backgroundColor: COLORS.error,
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "85%",
    borderRadius: 16,
    marginBottom: 12,
    marginLeft: 10,
  },
});
