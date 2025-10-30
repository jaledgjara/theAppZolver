import { COLORS, FONTS } from '@/appASSETS/theme';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';


const CustomPhoneInput = () => {
  const [countryCode, setCountryCode] = useState<CountryCode>('AR');
  const [country, setCountry] = useState<Country | null>({
    callingCode: ['54'],
    cca2: 'AR',
    currency: ['ARS'],
    flag: 'flag-ar',
    name: 'Argentina',
    region: 'Americas',
    subregion: 'South America',
  });
  const [phoneNumber, setPhoneNumber] = useState('');

  const onSelect = (selectedCountry: Country) => {
    setCountryCode(selectedCountry.cca2);
    setCountry(selectedCountry);
  };

  const handleVerification = () => {
    if (!country || !phoneNumber) {
        Alert.alert('Error', 'Por favor, completa todos los campos.');
        return;
    }
    
    const fullNumber = `+${country.callingCode[0]}${phoneNumber}`;
    Alert.alert('Verificación', `El número a verificar es: ${fullNumber}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Ingresa tu número de teléfono</Text>
        <View style={styles.inputContainer}>
          <CountryPicker
            countryCode={countryCode}
            withFilter
            withFlag
            withCountryNameButton={false}
            withCallingCode
            onSelect={onSelect}
            containerButtonStyle={styles.countryPickerButton}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Tu número"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
        </View>
        {/* <TouchableOpacity style={styles.button} onPress={handleVerification}>
          <Text style={styles.buttonText}>Verificar Número</Text>
        </TouchableOpacity> */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  content: {
    fontSize: 14,
    color: '#616161',
    marginBottom: 8,
    fontWeight: '500',
  },
  title: {
    ...FONTS.h3,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    height: 50,
  },
  countryPickerButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 10,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
  },
  button: {
    marginTop: 30,
    width: '100%',
    padding: 15,
    backgroundColor: '#007BFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CustomPhoneInput;