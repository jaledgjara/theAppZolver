import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import CountryPicker, { Country, CountryCode } from "react-native-country-picker-modal";
import { COLORS, FONTS } from "@/appASSETS/theme";

interface CustomPhoneInputProps {
  value: string; // valor en formato E.164 (+54...)
  onChangeText: (phone: string) => void;
  defaultCountry?: CountryCode;
}

export const CustomPhoneInput: React.FC<CustomPhoneInputProps> = ({
  value,
  onChangeText,
  defaultCountry = "AR",
}) => {
  const [countryCode, setCountryCode] = useState<CountryCode>(defaultCountry);
  const [country, setCountry] = useState<Country | null>({
    callingCode: ["54"],
    cca2: "AR",
    currency: ["ARS"],
    flag: "flag-ar",
    name: "Argentina",
    region: "Americas",
    subregion: "South America",
  });

  // Derivamos el número local solo para mostrarlo en el input
  const localNumber = value.replace(`+${country?.callingCode[0] ?? ""}`, "");

  const onSelect = (selectedCountry: Country) => {
    setCountryCode(selectedCountry.cca2);
    setCountry(selectedCountry);

    // Cuando cambia el país, recalculamos el número completo
    const digitsOnly = localNumber.replace(/\D/g, "");
    onChangeText(`+${selectedCountry.callingCode[0]}${digitsOnly}`);
  };

  const handleChangeText = (text: string) => {
    const onlyDigits = text.replace(/\D/g, "");
    const fullNumber = country
      ? `+${country.callingCode[0]}${onlyDigits}`
      : onlyDigits;
    onChangeText(fullNumber);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ingresa tu número de teléfono</Text>
      <View style={styles.inputContainer}>
        <CountryPicker
          countryCode={countryCode}
          withFilter
          withFlag
          withCallingCode
          onSelect={onSelect}
          containerButtonStyle={styles.countryPickerButton}
        />
        <TextInput
          style={styles.textInput}
          placeholder="Tu número"
          keyboardType="phone-pad"
          value={localNumber}
          onChangeText={handleChangeText}
        />
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: { width: "100%", marginTop: 10 },
  content: { alignItems: "center" },
  title: {
    ...FONTS.h3,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.backgroundInput,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 3
  },
  textInput: {
    flex: 1,
    height: 45,
    fontSize: 18,
    marginLeft: 5,
    color: COLORS.textPrimary
  },
  countryPickerButton: {
    marginRight: 5,
  },
});