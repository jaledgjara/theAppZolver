import { View, Text } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

const _layout = () => {
  return (
    <Stack>
      <Stack.Screen 
        name="WelcomeScreen" 
        options={{ headerShown: false,  animation: "slide_from_left" }} 
        
      />

      <Stack.Screen 
        name="SignInScreen" 
        options={{ headerShown: false }} 
      />

      <Stack.Screen 
        name="UserBasicInfoScreen" 
        options={{ headerShown: false }} 
      />
      
      <Stack.Screen 
        name="PhoneVerificationScreen" 
        options={{ headerShown: false }} 
      />
    </Stack>
  )
}

export default _layout

      {/* <Stack.Screen 
        name="signIn" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="welcomeUserType" 
        options={{ headerShown: false }} 
      />

      <Stack.Screen 
        name="userBasicForm" 
        options={{ headerShown: false }} 
      />

      <Stack.Screen 
        name="professionalId" 
        options={{ headerShown: false }} 
      />

      <Stack.Screen 
        name="professionalDescription" 
        options={{ headerShown: false }} 
      />

      <Stack.Screen 
        name="professionalLocationTime" 
        options={{ headerShown: false }} 
      />

      <Stack.Screen 
        name="professionalPayment" 
        options={{ headerShown: false }} 
      /> */}