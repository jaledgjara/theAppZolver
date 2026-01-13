import {
  Linking,
  Platform,
  ActionSheetIOS,
  Alert,
  AlertButton,
} from "react-native";
import { getMapOptions, MapAppOption } from "../Type/MapsType";

export const openMapMenu = async (address: string) => {
  console.log("[MapMenu] Abriendo menú para:", address);
  const encodedAddress = encodeURIComponent(address);
  const options = getMapOptions(encodedAddress);
  const availableMaps: MapAppOption[] = [];

  for (const map of options) {
    if (map.platform === "both" || map.platform === Platform.OS) {
      try {
        console.log(`[MapMenu] Consultando iOS por: ${map.appName}`);
        const isSupported = await Linking.canOpenURL(map.checkUrl);
        if (isSupported) {
          console.log(`[MapMenu] ✓ ${map.appName} detectado.`);
          availableMaps.push(map);
        } else {
          console.log(`[MapMenu] ? ${map.appName} no instalado.`);
        }
      } catch (error) {
        console.log(
          `[MapMenu] ✘ Error de esquema para ${map.appName}. El Info.plist NO está actualizado.`
        );
        if (map.appName === "Apple Maps" && Platform.OS === "ios") {
          availableMaps.push(map);
        }
      }
    }
  }

  console.log(`[MapMenu] Apps finales para mostrar: ${availableMaps.length}`);

  if (availableMaps.length <= 1) {
    const target = availableMaps[0] || options[0];
    console.log(`[MapMenu] Abriendo opción única: ${target.appName}`);
    return Linking.openURL(target.url);
  }

  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [...availableMaps.map((m) => m.appName), "Cancelar"],
        cancelButtonIndex: availableMaps.length,
        title: "Selecciona un mapa",
      },
      (index) => {
        if (index < availableMaps.length) {
          console.log(
            `[MapMenu] Usuario eligió: ${availableMaps[index].appName}`
          );
          Linking.openURL(availableMaps[index].url);
        }
      }
    );
  } else {
    const buttons: AlertButton[] = availableMaps.map((map) => ({
      text: map.appName,
      onPress: () => Linking.openURL(map.url),
    }));
    Alert.alert("Navegación", "Elige un mapa", [
      ...buttons,
      { text: "Cancelar", style: "cancel" },
    ]);
  }
};
