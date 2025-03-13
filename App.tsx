// App.tsx - Main application component
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import RoleSelectionScreen from './screens/RoleSelectionScreen';
import SenderScreen from './screens/SenderScreen';
import ReceiverScreen from './screens/ReceiverScreen';
import { AppContext, AppContextType } from './context/AppContext';

// Define the stack navigator parameter list
type RootStackParamList = {
  RoleSelection: undefined;
  Sender: undefined;
  Receiver: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  // Set up app-wide state using context
  const [imageData, setImageData] = useState<string | null>(null);
  const [connectedUser, setConnectedUser] = useState<string | null>(null);
  
  // Context values to be shared across components
  const contextValue: AppContextType = {
    imageData,
    setImageData,
    connectedUser,
    setConnectedUser
  };

  return (
    <AppContext.Provider value={contextValue}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="RoleSelection">
          <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} options={{ title: 'Select Your Role' }} />
          <Stack.Screen name="Sender" component={SenderScreen} options={{ title: 'Send Image' }} />
          <Stack.Screen name="Receiver" component={ReceiverScreen} options={{ title: 'Receive Image' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppContext.Provider>
  );
}