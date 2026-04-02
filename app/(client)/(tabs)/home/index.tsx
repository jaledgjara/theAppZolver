import { FlatList, ScrollView, StyleSheet, View } from "react-native";
import React, { useEffect } from "react";
import { useRouter } from "expo-router";

// Componentes UI
import { ToolBarHome } from "@/appSRC/home/Screens/TollbarHome";
import SearchBar from "@/appCOMP/searchable/SearchBar";
import { SectionHeader } from "@/appCOMP/cards/SectionHeader";
import CategoryItem from "@/appCOMP/categories/CategoryItem";
import StatusPlaceholder from "@/appCOMP/contentStates/StatusPlaceholder";
import { SkeletonList } from "@/appCOMP/skeleton/SkeletonCard";
import { COLORS, FONTS, SIZES } from "@/appASSETS/theme";
import { useServiceSelection } from "@/appSRC/categories/Hooks/useServiceCatalog";
import { getCategoryVectorIcon } from "@/appSRC/categories/Screens/CategoryIcons";

const Home = () => {
  const router = useRouter();
  const { categories, loadingCategories, fetchCategories, error } = useServiceSelection();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const renderCategoryItem = ({ item, index }: { item: any; index: number }) => (
    <CategoryItem
      name={item.name}
      icon={getCategoryVectorIcon(item.icon_slug, 28, COLORS.brandDeep)}
      index={index}
      size={100}
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* SearchBar prominente */}
        <View style={styles.searchWrapper}>
          <SearchBar
            value=""
            placeholder="¿Qué servicio necesitás hoy?"
            onPress={() => router.push("(client)/(tabs)/home/SearchScreen")}
          />
        </View>

        {/* Sección Categorías */}
        <View style={styles.section}>
          <SectionHeader title="Categorías" />

          {loadingCategories ? (
            <SkeletonList count={3} />
          ) : error ? (
            <StatusPlaceholder
              icon="alert-circle-outline"
              title="Error de conexión"
              subtitle="No pudimos cargar las categorías. Revisá tu conexión."
              buttonTitle="Reintentar"
              onButtonPress={fetchCategories}
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
                  icon="folder-open-outline"
                  title="Sin categorías"
                  subtitle="No hay categorías disponibles en este momento."
                />
              }
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  searchWrapper: {
    paddingHorizontal: SIZES.xl,
    paddingTop: SIZES.lg,
    paddingBottom: SIZES.sm,
  },
  section: {
    paddingHorizontal: SIZES.xl,
    paddingTop: SIZES.xxxl,
  },
});
