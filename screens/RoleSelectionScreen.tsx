import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  RoleSelection: undefined;
  Sender: undefined;
  Receiver: undefined;
};

type RoleSelectionScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'RoleSelection'>;
};

export default function RoleSelectionScreen({ navigation }: RoleSelectionScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Your Role</Text>
      
      <TouchableOpacity
        style={styles.roleButton}
        onPress={() => navigation.navigate('Sender')}
      >
        <Text style={styles.roleButtonText}>Sender</Text>
        <Text style={styles.roleDescription}>Take pictures and send them</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.roleButton}
        onPress={() => navigation.navigate('Receiver')}
      >
        <Text style={styles.roleButtonText}>Receiver</Text>
        <Text style={styles.roleDescription}>Receive and save images</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  roleButton: {
    backgroundColor: '#4a90e2',
    width: '100%',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  roleButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  roleDescription: {
    color: 'white',
    fontSize: 14,
  },
});