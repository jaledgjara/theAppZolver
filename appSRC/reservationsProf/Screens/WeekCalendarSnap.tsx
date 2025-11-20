import React, { useState, useRef, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import dayjs from "dayjs";

const SCREEN_WIDTH = Dimensions.get("window").width;

const WeekStrip = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));

  // Calculate Monday of the current week
  const getWeekStart = (date: string) => {
    const d = dayjs(date);
    const dayOfWeek = d.day();
    return d.subtract(dayOfWeek === 0 ? 6 : dayOfWeek - 1, "day");
  };

  const currentWeekStart = getWeekStart(selectedDate);

  const generateWeek = (start: dayjs.Dayjs) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = start.add(i, "day");
      days.push({
        key: date.format("YYYY-MM-DD"),
        label: date.format("ddd").toUpperCase().slice(0, 1), // L M X J V S D
        number: date.date(),
        iso: date.format("YYYY-MM-DD"),
      });
    }
    return days;
  };

  const flatListRef = useRef<FlatList>(null);

  const handleEnd = useCallback(
    (event: any) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / SCREEN_WIDTH);

      const newWeekStart = currentWeekStart.add(index - 1, "week");
      const newSelected = newWeekStart.format("YYYY-MM-DD");

      // change week
      setSelectedDate(newSelected);

      // snap back to the center
      flatListRef.current?.scrollToIndex({ index: 1, animated: false });
    },
    [currentWeekStart]
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={[0, 1, 2]} // prev, current, next
        initialScrollIndex={1}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleEnd}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        keyExtractor={(item) => item.toString()}
        renderItem={({ index }) => {
          const weekStart = currentWeekStart.add(index - 1, "week");
          const week = generateWeek(weekStart);

          return (
            <View style={{ width: SCREEN_WIDTH, flexDirection: "row", justifyContent: "space-between" }}>
              {week.map((day) => {
                const isSelected = day.iso === selectedDate;

                return (
                  <TouchableOpacity
                    key={day.iso}
                    style={styles.dayContainer}
                    onPress={() => setSelectedDate(day.iso)}
                  >
                    <Text style={styles.dayLabel}>{day.label}</Text>

                    <View
                      style={[
                        styles.dayNumberWrapper,
                        isSelected && styles.dayNumberSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayNumber,
                          isSelected && styles.dayNumberSelectedText,
                        ]}
                      >
                        {day.number}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        }}
      />
    </View>
  );
};

export default WeekStrip;

const styles = StyleSheet.create({
  container: {
    height: 110,
    paddingVertical: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',      // ← NECESARIO PARA QUE LA SOMBRA ENVUELVA TODO
  },
  dayContainer: {
    flex: 1,
    alignItems: "center",
  },
  dayLabel: {
    fontSize: 15,
    color: "#444",
    marginBottom: 4,
  },
  dayNumberWrapper: {
    width: 30,
    height: 30,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumberSelected: {
    backgroundColor: "#F4C542",
  },
  dayNumberSelectedText: {
    color: "#000",
    fontWeight: "bold",
  },
  dayNumber: {
    fontSize: 15,
    color: "#000",
  },
});
