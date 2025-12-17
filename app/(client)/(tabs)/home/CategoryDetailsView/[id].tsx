import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import React from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { ProfessionalCard } from "@/appSRC/home/Screens/ProfessionalCard";
import SearchModeSelector from "@/appSRC/searchable/Screen/SearchModeSelector";
import StatusPlaceholder from "@/appCOMP/contentStates/StatusPlaceholder";
import { COLORS } from "@/appASSETS/theme";
import { useServiceByCategorySearch } from "@/appSRC/searchable/Hooks/useServiceByCategorySearch";

const CategoryDetailsView = () => {
  const { id, name } = useLocalSearchParams();
  const categoryId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();

  // Hook conectado
  const { professionals, loading, refetch, mode, handleModeChange } =
    useServiceByCategorySearch(categoryId);

  const categoryName = Array.isArray(name) ? name[0] : name;

  // Texto dinámico para el estado vacío
  const emptySubtitle =
    mode === "instant"
      ? "Esta categoría no admite servicios inmediatos o no hay profesionales disponibles ahora."
      : "No hay profesionales disponibles para presupuesto en esta categoría.";

  return (
    <View style={styles.container}>
      <ToolBarTitle
        titleText={categoryName ?? "Categoría"}
        showBackButton={true}
      />

      {/* Selector de Modo */}
      <View style={styles.contentContainer}>
        <SearchModeSelector
          currentMode={mode}
          onModeChange={handleModeChange}
        />
      </View>

      <FlatList
        data={professionals}
        keyExtractor={(item) => item.id || item.user_id}
        renderItem={({ item }) => (
          <ProfessionalCard
            avatar={item.photo_url}
            name={item.legal_name}
            category={item.specialization_title}
            rating={item.rating}
            reviewsCount={item.reviews_count}
            price={item.price_per_hour}
            distance={item.dist_meters}
            onPress={() => {
              router.push({
                pathname: "/(client)/(tabs)/home/ProfessionalDetails/[id]",
                params: {
                  id: item.user_id,
                  mode: mode,
                },
              });
            }}
          />
        )}
        // Componente de carga al final
        ListFooterComponent={
          loading ? (
            <ActivityIndicator
              size="large"
              color={COLORS.primary}
              style={{ marginTop: 20 }}
            />
          ) : null
        }
        // Estado vacío
        ListEmptyComponent={
          !loading ? (
            <View style={{ marginTop: 40, paddingHorizontal: 20 }}>
              <StatusPlaceholder
                icon="account-search-outline"
                title="Sin resultados"
                subtitle={emptySubtitle}
              />
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
};

export default CategoryDetailsView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  contentContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    alignItems: "center",
    paddingVertical: 10,
  },
});
