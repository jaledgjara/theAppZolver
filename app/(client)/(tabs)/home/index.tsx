import {
  FlatList,
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  Linking,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";

// Componentes UI
import { ToolBarHome } from "@/appSRC/home/Screens/TollbarHome";
import SearchBar from "@/appCOMP/searchable/SearchBar";
import MoreCategoryTitle from "@/appSRC/home/Screens/MoreCategoryTitle";
import CategoryItem from "@/appCOMP/categories/CategoryItem";
import StatusPlaceholder from "@/appCOMP/contentStates/StatusPlaceholder";
import { COLORS } from "@/appASSETS/theme";
import { useServiceSelection } from "@/appSRC/categories/Hooks/useServiceCatalog";
import { getCategoryVectorIcon } from "@/appSRC/categories/Screens/CategoryIcons";
import { LargeButton } from "@/appCOMP/button/LargeButton";

// Maps Custom Logic
import { MapSelectionMenu } from "@/appSRC/maps/Screen/MapSelectionMenu";
import { MapAppOption } from "@/appSRC/maps/Type/MapsType";
import { useMapNavigation } from "@/appSRC/maps/Hooks/openMapMenu";

const Home = () => {
  const router = useRouter();
  const { categories, loadingCategories, fetchCategories, error } =
    useServiceSelection();

  // Hook personalizado para mapas
  const { mapMenuVisible, availableMaps, setMapMenuVisible, handleOpenMap } =
    useMapNavigation();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const renderCategoryItem = ({ item }: { item: any }) => (
    <CategoryItem
      name={item.name}
      icon={getCategoryVectorIcon(item.icon_slug, 40, COLORS.primary)}
      size={110}
      onPress={() =>
        router.push({
          pathname: "/(client)/(tabs)/home/CategoryDetailsView/[id]",
          params: { id: item.id, name: item.name },
        })
      }
    />
  );

  return (
    <View style={styles.container}>
      <ToolBarHome />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
          <LargeButton
            title="Ver dirección en Mapa"
            onPress={() => handleOpenMap("Av. San Martin 123, Mendoza")}
            iconName="map-outline"
            backgroundColor={COLORS.tertiary}
          />
        </View>

        <SearchBar
          value={""}
          placeholder="¿Qué servicio necesitas hoy?"
          onPress={() => router.push("(client)/(tabs)/home/SearchScreen")}
        />

        <MoreCategoryTitle title="Categorías" onLinkPress={() => {}} />

        <View style={styles.listContainer}>
          {loadingCategories ? (
            <ActivityIndicator
              size="large"
              color={COLORS.primary}
              style={{ marginTop: 50 }}
            />
          ) : (
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item.id}
              numColumns={3}
              scrollEnabled={false}
              ListEmptyComponent={
                <StatusPlaceholder
                  icon={error ? "alert-circle-outline" : "folder-open-outline"}
                  title={error ? "Error de conexión" : "Sin Categorías"}
                  subtitle={""}
                />
              }
            />
          )}
        </View>
      </ScrollView>

      {/* El menú se renderiza al final, controlado por el hook */}
      <MapSelectionMenu
        isVisible={mapMenuVisible}
        options={availableMaps}
        onClose={() => setMapMenuVisible(false)}
        onSelect={(url) => Linking.openURL(url)}
      />
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: { backgroundColor: "white", flex: 1 },
  listContentContainer: {
    alignItems: "flex-start",
    marginRight: 5,
    paddingBottom: 40,
  },
  listContainer: { paddingTop: 15, paddingHorizontal: 0 },
  loaderContainer: { marginTop: 50, alignItems: "center" },
});
