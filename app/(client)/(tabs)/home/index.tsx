import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { ToolBarHome } from '@/appSRC/home/Screens/TollbarHome'
import { useRouter } from 'expo-router';
import SearchBar from '@/appCOMP/searchable/SearchBar';
import MoreCategoryTitle from '@/appSRC/home/Screens/MoreCategoryTitle';
import { COLORS } from '@/appASSETS/theme';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import CategoryItem from '@/appCOMP/categories/CategoryItem';

const CATEGORIES_DATA = [
  { id: '1', name: 'Pintor' },
  { id: '2', name: 'Gasista' },
  { id: '3', name: 'Pintor' },
  { id: '4', name: 'Pintor' },
  { id: '5', name: 'Pintor' },
  { id: '6', name: 'Pintor' },
  { id: '7', name: 'Pintor' },
  { id: '8', name: 'Pintor' },
  { id: '9', name: 'Pintor' },
];

const home = () => {
  const router = useRouter();

  const renderCategoryItem = ({ item }: { item: { id: string; name: string } }) => (
    <CategoryItem
      name={item.name}
      icon={<FontAwesome6 name="paint-roller" size={32} color={COLORS.primary} />}
      onPress={() =>
        router.push({
          pathname: '/(client)/(tabs)/home/CategoryDetailsView/' + item.id,
          params: { name: item.name }
      })
}

    />
  );

  return (
    <ScrollView style={styles.container}>
      <ToolBarHome
        titleText='Av. Bolougne Sur Mer 432'
        showMenukButton={true}
      />

      <View>
        <SearchBar
          value={""}
          placeholder="¿Qué servicio necesitas hoy?"
          onPress={() => router.push('(client)/(tabs)/home/SearchScreen')}
        />

        <MoreCategoryTitle
          title="Categorías"
          onLinkPress={() => router.push('')}
        />
        <View style={styles.listContainer} >
          <FlatList
            data={CATEGORIES_DATA}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={styles.listContentContainer}
            scrollEnabled={false}
          />
        </View>

      </View>
    </ScrollView>
  )
}

export default home

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1
  },
  listStyle: {
    marginTop: 20,
  },
  listContentContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  listContainer: {
    paddingTop: 15,
    paddingHorizontal: 8,
  },
})