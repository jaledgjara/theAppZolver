// SectionItem.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { EvilIcons } from '@expo/vector-icons';
import { COLORS } from '@/appASSETS/theme';

export interface SectionItemProps {
  title: string;
  time?: string;
  onPress?: () => void;
}

const SectionItem: React.FC<SectionItemProps> = ({ title, time, onPress }) => {
  return (
    <Pressable onPress={onPress} style={styles.container}>

      {time && <Text style={styles.time}>{time}</Text>}

      <Text
        style={[
          styles.title,
          time && { marginLeft: 12 }
        ]}
      >
        {title}
      </Text>

      <View style={styles.iconContainer}>
        <EvilIcons name="chevron-right" size={28} color="#B4B4B4" />
      </View>
    </Pressable>
  );
};

export default SectionItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: '#FFF',
  },
  time: {
    width: 70,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  title: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  iconContainer: {
    marginLeft: 8,
  },
});
