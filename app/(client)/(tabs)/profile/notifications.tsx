import React from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  Alert,
} from "react-native";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import StatusPlaceholder from "@/appCOMP/contentStates/StatusPlaceholder";
import NotificationCard from "@/appSRC/notifications/Screens/NotificationCard";
import { useFetchNotifications } from "@/appSRC/notifications/Hooks/useFetchNotifications";
import { useMarkNotificationRead } from "@/appSRC/notifications/Hooks/useMarkNotificationRead";
import { COLORS, FONTS } from "@/appASSETS/theme";
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";

export default function NotificationsScreen() {
  const {
    notifications,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    refresh,
    handleMarkAllRead,
    handleDelete,
  } = useFetchNotifications();

  const { handlePress } = useMarkNotificationRead();

  const confirmDelete = (id: string) => {
    Alert.alert(
      "Eliminar notificación",
      "¿Estás seguro de que querés eliminar esta notificación?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => handleDelete(id),
        },
      ],
    );
  };

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Notificaciones" showBackButton={true} />

      {/* Botón Marcar Todas */}
      {hasUnread && (
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={handleMarkAllRead}
          activeOpacity={0.7}>
          <Text style={styles.markAllText}>Marcar todas como leídas</Text>
        </TouchableOpacity>
      )}

      {/* Estado: Cargando */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <MiniLoaderScreen />
        </View>
      ) : notifications.length === 0 ? (
        /* Estado: Vacío */
        <StatusPlaceholder
          icon="bell-off-outline"
          title="Sin notificaciones"
          subtitle="Cuando recibas reservas, mensajes o actualizaciones, aparecerán aquí."
        />
      ) : (
        /* Estado: Lista */
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={refresh}
          refreshing={false}
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.3}
          renderItem={({ item }) => (
            <NotificationCard
              item={item}
              onPress={() => handlePress(item)}
              onDelete={() => confirmDelete(item.id)}
            />
          )}
          ListFooterComponent={loadingMore ? <MiniLoaderScreen /> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  markAllButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  markAllText: {
    ...FONTS.body4,
    color: COLORS.tertiary,
    fontWeight: "600",
  },
  footer: {
    paddingVertical: 20,
  },
});
