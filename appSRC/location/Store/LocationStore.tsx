import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Address } from "../Type/LocationType";

interface LocationState {
  activeAddress: Address | null;
  setActiveAddress: (address: Address | null) => void;
  // 👇 Función necesaria para limpiar al cerrar sesión
  reset: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      activeAddress: null,

      setActiveAddress: (address) => {
        const label = address ? address.label : "Ninguna";

        // 🟢 LOG CRÍTICO: Verificar si el Store recibe coordenadas reales
        if (address && address.coords) {
          console.log(`📍 [STORE] Ubicación ACTIVA cambiada a: "${label}"`);
          console.log(
            `   └─ 🌎 Coords: [${address.coords.lat}, ${address.coords.lng}]`
          );

          if (address.coords.lat === 0 && address.coords.lng === 0) {
            console.warn(
              "⚠️ [STORE] ALERTA: Las coordenadas son 0,0. El mapa no se moverá."
            );
          }
        } else {
          console.log(
            `⚠️ [STORE] Ubicación seteada a NULL o sin coords: "${label}"`
          );
        }

        set({ activeAddress: address });
      },

      // 👇 IMPLEMENTACIÓN DEL RESET
      reset: () => {
        console.log("🧹 [STORE] Reseteando ubicación (Logout)");
        set({ activeAddress: null });
      },
    }),
    {
      name: "zolver-location-storage", // Nombre de la key en AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
