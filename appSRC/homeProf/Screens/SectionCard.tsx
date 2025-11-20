// SectionCard.tsx
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import SectionItem, { SectionItemProps } from './SectionItem';
import { COLORS, SIZES } from '@/appASSETS/theme';

interface SectionCardProps {
  title: string;
  date?: string; // optional
  data: SectionItemProps[]; // list of items
}

const SectionCard: React.FC<SectionCardProps> = ({ title, date, data }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      {date && <Text style={styles.date}>{date}</Text>}

      <View style={styles.listContainer}>
        <FlatList
          data={data}
          keyExtractor={(item, index) => `${item.title}-${index}`}
          renderItem={({ item }) => <SectionItem {...item} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

export default SectionCard;

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: '600',
    color: COLORS.textPrimary
  },
  date: {
    fontSize: 16,
    marginTop: 4,
    marginBottom: 12,
    color: COLORS.textSecondary,
  },
  listContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  separator: {
    height: 1,
    backgroundColor: '#E9E9E9',
  },
});
