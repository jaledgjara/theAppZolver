import { ScrollView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { ToolBarTitle } from '@/appCOMP/toolbar/Toolbar'
import { CalendarReservationCard } from '@/appCOMP/cards/CalendarReservationCard'
import { ReservationLocationActions } from '@/appCOMP/maps/ReservationLocationActions'
import { useLocalSearchParams } from 'expo-router'
import { MOCK_RESERVATIONS } from '..'
import { COLORS, SIZES } from '@/appASSETS/theme'
import DescriptionCard from '@/appCOMP/cards/DescriptionCard'

const ReservationsDetailsScreen = () => {
  // 1. Read the dynamic id from the route
  const { id } = useLocalSearchParams();

  // 2. Fetch reservation data.
  // For now using mock; later fetch from API or Zustand store.
  const reservation = MOCK_RESERVATIONS.find((r) => r.id === id);

  return (
    <View style={styles.container}>
      <ToolBarTitle
        titleText='Detalles de la reserva'
        showBackButton={true}
      />

      

      <View style={styles.contentContainer}>
        <ScrollView>
          {/* INFORMACION */}
          <View style={styles.infoContainer}>
            <Text style={styles.titleTwo}>Información</Text>
            {reservation && (
              <CalendarReservationCard
                time={reservation.time}
                name={reservation.name}
                service={reservation.service}
                status={'Confirmada'}
                date="17 - 11 - 2025"
              />
            )}
          </View>

          {/* DESCRIPCION */}
          <View style={styles.infoContainer}>
            <Text style={styles.titles}>Descripción</Text>

            <DescriptionCard description={'El cliente necesita revisar el enchufe del baño porque hace chispa cuando conecta la afeitadora.'} />
          </View>


          {/* UBICACION */}
          <View style={styles.infoContainer}>
            <Text style={styles.titles}>Ubicación</Text>
            <ReservationLocationActions
              address="Calle Mayor 15, Madrid"
              latitude={40.4168}
              longitude={-3.7038}
            />
          </View>
        </ScrollView>
      </View>
    </View>
  )
}

export default ReservationsDetailsScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 10,
    marginTop: 30,
    paddingBottom: 20
  },
  titles: {
    fontSize: SIZES.h2,
    fontWeight: '600',
    color: COLORS.textSecondary,
    paddingHorizontal: 20,
    paddingVertical: 10
  },
  titleTwo: {
    fontSize: SIZES.h2,
    fontWeight: '600',
    color: COLORS.textSecondary,
    paddingHorizontal: 20,
  },
  infoContainer: {
    paddingBottom: 20
  }
})