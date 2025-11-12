import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS, FONTS } from "@/appASSETS/theme"; // asegúrate que estos existan

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

interface UserTypeSelectorProps {
  title: string;
  subtitle: string;
  iconTitle: IoniconName;
  onPress: () => void;
  selected?: boolean; // 🟩 NUEVO: indica si este botón está seleccionado
}

export const UserTypeSelector: React.FC<UserTypeSelectorProps> = ({
  title,
  subtitle,
  iconTitle,
  onPress,
  selected = false, // valor por defecto
}) => {
  return (
    <Pressable
      style={[styles.container, selected && styles.containerSelected]} // 🟩 estilo condicional
      onPress={onPress}
    >
      <View
        style={[
          styles.iconContainer,
          selected && styles.iconContainerSelected, // 🟩 cambia el color del ícono
        ]}
      >
        <Ionicons name={iconTitle} size={40} color="white" />
      </View>

      <View>
        <Text style={styles.title}>{title}</Text>
        <Text
          style={[
            styles.subtitle,
            { color: selected ? "white" : COLORS.textSecondary },
          ]}
        >
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
};

export default UserTypeSelector;

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginVertical: 15,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  // 🟩 Nuevo: cuando está seleccionado
  containerSelected: {
    backgroundColor: COLORS.tertiary ?? "#28A745", // puedes usar tu token del tema
    borderWidth: 2,
    borderColor: "#FFF",
  },
  iconContainer: {
    marginRight: 15,
  },
  // 🟩 Nuevo: destaca el icono seleccionado
  iconContainerSelected: {
    transform: [{ scale: 1.1 }],
  },
  title: {
    ...FONTS.h2,
    fontWeight: "bold",
    color: "white",
  },
  subtitle: {
    ...FONTS.h3,
    color: COLORS.textSecondary,
    fontWeight: "700",
  },
});
