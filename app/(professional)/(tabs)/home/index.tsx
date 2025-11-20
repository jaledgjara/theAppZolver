import { ScrollView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { ToolBarTitle } from '@/appCOMP/toolbar/Toolbar'
import SectionCard from '@/appSRC/homeProf/Screens/SectionCard'

const home = () => {
  return (
    <View style={styles.container}>
      <ToolBarTitle
        titleText={'Inicio'}
      />
      <View style={styles.contentContainer}>
        <SectionCard
          title="Reservaciones de hoy"
          date="April 24, 2024"
          data={[
            { time: "9:00 AM", title: "John Smith", onPress: () => { } },
            { time: "11:00 AM", title: "Sarah Johnson", onPress: () => { } },
          ]}
        />

        <SectionCard
          title="Confirmaciones pendientes"
          data={[
            { title: "Confirm appointment with Michael Brown", onPress: () => { } }
          ]}
        />

        <SectionCard
          title="Alertas"
          data={[
            { title: "Reservation for Linda Davis was canceled", onPress: () => { } }
          ]}
        />
      </View>
    </View>
  )
}

export default home

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  contentContainer: {
    paddingHorizontal: 10,
    marginTop: 30
  },

})