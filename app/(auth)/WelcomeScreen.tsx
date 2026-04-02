import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { COLORS, FONTS, SIZES } from "../../appASSETS/theme";
import { LargeButton } from "appCOMP/button/LargeButton";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";

const WelcomeScreen = () => {
  const setStatus = useAuthStore((state) => state.setStatus);
  const setTransitionDirection = useAuthStore((state) => state.setTransitionDirection);

  // Animaciones de entrada
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(24)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Logo fade + scale-in
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
      // 2. Texto slide-up con stagger
      Animated.parallel([
        Animated.timing(textTranslate, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // 3. Botón fade-in
      Animated.timing(btnOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [logoOpacity, logoScale, textOpacity, textTranslate, btnOpacity]);

  const handleContinue = () => {
    setTransitionDirection("forward");
    setStatus("anonymous");
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Animated.View
        style={[styles.logoArea, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}
      >
        <Text style={styles.logoNexo}>Nexo</Text>
        <Text style={styles.logoFix}>Fix</Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.View
        style={{
          opacity: textOpacity,
          transform: [{ translateY: textTranslate }],
          alignItems: "center",
        }}
      >
        <Text style={styles.tagline}>Tu casa, resuelta.</Text>
        <Text style={styles.sub}>Conectamos personas con oficios verificados.</Text>
      </Animated.View>

      {/* CTA */}
      <Animated.View style={[styles.btnContainer, { opacity: btnOpacity }]}>
        <LargeButton
          title="Empezar"
          onPress={handleContinue}
          variant="accent"
          iconName="arrow-forward"
        />
      </Animated.View>
    </View>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.brandDeep,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SIZES.xl,
    gap: SIZES.xxxl,
  },
  logoArea: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  logoNexo: {
    ...FONTS.display,
    color: COLORS.white,
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 48,
  },
  logoFix: {
    ...FONTS.display,
    color: COLORS.accent,
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 48,
  },
  tagline: {
    ...FONTS.display,
    color: COLORS.white,
    textAlign: "center",
    marginBottom: SIZES.sm,
  },
  sub: {
    ...FONTS.body,
    color: COLORS.brandLight,
    textAlign: "center",
    lineHeight: 22,
  },
  btnContainer: {
    width: "100%",
  },
});
