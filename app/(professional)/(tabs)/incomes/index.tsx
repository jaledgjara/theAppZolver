import { ScrollView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { ToolBarTitle } from '@/appCOMP/toolbar/Toolbar'
import IncomeCard from '@/appCOMP/cards/IncomeCard'
import IncomeCardsContainer from '@/appSRC/incomesProf/Screens/IncomesCardContainer'
import IncomeCharts from '@/appSRC/incomesProf/Screens/IncomeCharts'

const incomes = () => {
  return (
    <View style={styles.container}>
      <ToolBarTitle
        titleText='Ingresos'
      />
      <ScrollView>
        <View style={styles.contentContainer}>
          <IncomeCardsContainer>
            <IncomeCard
              title="Ganancias del día"
              value="150"
              valueType="money"
              titleVariant="h2"
              boldTitle
              width="full"
            />

            <IncomeCard
              title="Ganancias del mes"
              value="2300"
              valueType="money"
              titleVariant="h2"
              width="full"
            />

            <IncomeCard
              title="Total historico"
              value="12750"
              valueType="money"
              titleVariant="h3"
              width="half"
            />
            <IncomeCard
              title="Pendientes"
              value="200"
              valueType="money"
              titleVariant="h3"
              width="half"
            />

            <IncomeCard
              title="Próximos cobros"
              value="3"
              valueType="number"
              titleVariant="h3"
              width="half"
            />

            <IncomeCard
              title="Servicios más vendidos"
              value="Corte de pelo"
              valueType="text"
              titleVariant="h3"
              width="half"
            />
          </IncomeCardsContainer>

          <IncomeCharts />

        </View>
      </ScrollView>
    </View>
  )
}

export default incomes

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 30,
    paddingBottom: 30
  }
})