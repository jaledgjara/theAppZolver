import { ScrollView, StyleSheet, Text, View } from "react-native";
import React from "react";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { HelpCenterSelector } from "../Components/HelpCenterSelector";
import { COLORS, FONTS } from "@/appASSETS/theme";
import { FaqAccordion } from "@/appCOMP/faq/FaqAccordion";
import { LegalSection } from "../Components/LegalSection";
import { HelpCenterProps, QUESTIONS_AND_ANSWERS } from "../Type/HelpCenterType";

const HelpCenterScreen = ({ mode }: HelpCenterProps) => {
  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Soporte al cliente" showBackButton={true} />

      <ScrollView
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <HelpCenterSelector />
        </View>

        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Preguntas Frecuentes</Text>
          {QUESTIONS_AND_ANSWERS.map((item) => (
            <FaqAccordion
              key={item.id}
              title={item.title}
              answer={item.answer}
            />
          ))}
        </View>

        <LegalSection mode={mode} />
      </ScrollView>
    </View>
  );
};

export default HelpCenterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 10,
  },
  faqSection: {
    marginTop: 20,
  },
  faqTitle: {
    ...FONTS.h3,
    marginBottom: 15,
    color: COLORS.textSecondary,
    fontWeight: "700",
  },
});
