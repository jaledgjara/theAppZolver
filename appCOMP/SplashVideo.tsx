import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import * as SplashScreen from "expo-splash-screen";

interface SplashVideoProps {
  /** Llamado cuando el video terminó de reproducirse */
  onFinish: () => void;
}

/**
 * Splash de video que se monta encima del árbol de navegación al inicio de la app.
 *
 * - Reproduce `appASSETS/splash-video/nexofix.mp4` una sola vez, sin sonido.
 * - `contentFit="cover"` → llena toda la pantalla sin bordes negros (recorta si hace falta).
 * - Cuando el primer frame está listo, oculta el splash nativo (handoff sin flash).
 * - Cuando el video termina, llama a `onFinish` para que el padre lo desmonte.
 */
export function SplashVideo({ onFinish }: SplashVideoProps) {
  const player = useVideoPlayer(require("@/appASSETS/splash-video/nexofix.mov"), (p) => {
    p.loop = false;
    p.muted = true;
    p.play();
  });

  // Oculta el splash nativo apenas el player está listo, para que el handoff
  // sea inmediato y no se vea un frame de transición en blanco.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {
      // ignore: ya estaba oculto
    });
  }, []);

  // Detecta el final de la reproducción y notifica al padre.
  useEffect(() => {
    const sub = player.addListener("playToEnd", () => {
      onFinish();
    });
    return () => {
      sub.remove();
    };
  }, [player, onFinish]);

  return (
    <View style={styles.container} pointerEvents="none">
      <VideoView
        style={styles.video}
        player={player}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
    zIndex: 9999,
    elevation: 9999,
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
});
