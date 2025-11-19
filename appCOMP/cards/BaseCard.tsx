// A universal card layout used across Zolver.
// It standardizes spacing, shadows, rounding and left/middle/right sections.

import { TouchableOpacity, View, StyleSheet } from "react-native";


interface BaseCardProps {
  left?: React.ReactNode;
  middle: React.ReactNode;
  right?: React.ReactNode;
  onPress?: () => void;
}

export const BaseCard: React.FC<BaseCardProps> = ({
  left,
  middle,
  right,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {left && <View style={styles.left}>{left}</View>}

      <View style={styles.middle}>{middle}</View>

      {right && <View style={styles.right}>{right}</View>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    height: 120,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  left: {
    marginRight: 16,
  },
  middle: {
    flex: 1,
  },
  right: {
    marginLeft: 10,
  },
});
