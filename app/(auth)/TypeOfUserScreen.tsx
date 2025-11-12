import { StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import { ToolBarTitle } from '@/appCOMP/toolbar/Toolbar'
import UserTypeSelector from '@/appSRC/auth/Screen/UserTypeSelector'
import { LargeButton } from '@/appCOMP/button/LargeButton'

const TypeOfUserScreen = () => {
  const [selectedType, setSelectedType] = useState<"client" | "professional" | null>(null);

  return (
    <View style={styles.container}>
      <ToolBarTitle 
        titleText={'Tipo de usuario'}        
        showBackButton={true}
      />
      <View style={styles.contentContainer}>
        <View style={styles.contentUserType}>
          <UserTypeSelector
            title="Soy cliente"
            subtitle="Busco contratar profesionales"
            iconTitle="person-outline"
            onPress={() => setSelectedType("client")}
            selected={selectedType === "client"} 
          />
          <UserTypeSelector
            title="Soy profesional"
            subtitle="Ofrezco servicios en la app "
            iconTitle="briefcase-outline"
            onPress={() => setSelectedType("professional")}
            selected={selectedType === "professional"} 
          />
        </View>


        <LargeButton 
          title="COMENZAR" 
          iconName="arrow-forward-circle-outline"
          onPress={function (): void {
          throw new Error('Function not implemented.')
        } }          
        />
      </View>

    </View>
  )
}

export default TypeOfUserScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20
  },
  contentUserType: {
    width: "100%"
  }
})