import {
  FlatList,
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
} from "react-native";
import React, { useEffect } from "react";
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

const Home = () => {
  const router = useRouter();

  // Hook de la capa de dominio
  const { categories, loadingCategories, fetchCategories, error } =
    useServiceSelection();

  // Carga inicial
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Renderizado de cada item
  const renderCategoryItem = ({ item }: { item: any }) => {
    // 1. Usamos el mapper de Vectores
    // Aumentamos un poco el 'size' del icono interno para que balancee con el cuadrado grande
    const iconComponent = getCategoryVectorIcon(
      item.icon_slug,
      40,
      COLORS.primary
    );

    return (
      <CategoryItem
        name={item.name}
        icon={iconComponent}
        size={110} // 2. Cuadrados grandes como solicitaste
        onPress={() =>
          router.push({
            pathname: "/(client)/(tabs)/home/CategoryDetailsView/[id]",
            params: { id: item.id, name: item.name },
          })
        }
      />
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ToolBarHome
        titleText="Av. Bolougne Sur Mer 432"
        showMenukButton={true}
      />

      <View>
        <SearchBar
          value={""}
          placeholder="¿Qué servicio necesitas hoy?"
          onPress={() => router.push("(client)/(tabs)/home/SearchScreen")}
        />

        <MoreCategoryTitle
          title="Categorías"
          onLinkPress={() => console.log("Ver todas")}
        />

        <View style={styles.listContainer}>
          {loadingCategories ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item.id}
              numColumns={3}
              contentContainerStyle={styles.listContentContainer}
              scrollEnabled={false}
              // 3. Manejo de Estados (Vacío / Error)
              ListEmptyComponent={
                <View style={{ marginTop: 20 }}>
                  <StatusPlaceholder
                    icon={
                      error ? "alert-circle-outline" : "folder-open-outline"
                    }
                    title={error ? "Error de conexión" : "Sin Categorías"}
                    subtitle={
                      error
                        ? "No pudimos cargar los servicios. Revisa tu conexión."
                        : "No hay servicios disponibles en este momento."
                    }
                    buttonTitle={error ? "Reintentar" : undefined}
                    onButtonPress={error ? fetchCategories : undefined}
                  />
                </View>
              }
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    flex: 1,
  },
  listContentContainer: {
    alignItems: "center",
    paddingHorizontal: 5, // Padding reducido para acomodar las 3 columnas grandes
    paddingBottom: 40,
  },
  listContainer: {
    paddingTop: 15,
    paddingHorizontal: 0,
  },
  loaderContainer: {
    marginTop: 50,
    alignItems: "center",
  },
});
