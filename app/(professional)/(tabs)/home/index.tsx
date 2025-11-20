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
          title="Today's Reservations"
          date="April 24, 2024"
          data={[
            { time: "9:00 AM", title: "John Smith", onPress: () => { } },
            { time: "11:00 AM", title: "Sarah Johnson", onPress: () => { } },
          ]}
        />

        <SectionCard
          title="Pending Confirmations"
          data={[
            { title: "Confirm appointment with Michael Brown", onPress: () => { } }
          ]}
        />

        <SectionCard
          title="Alerts"
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