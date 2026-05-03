import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAuth } from '../context/AuthContext';

export default function MainMenu() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { logout } = useAuth();

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={logout}
        >
          <Text style={styles.navButtonText}>Logout</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('Admin')}
        >
          <Text style={styles.navButtonText}>Admin</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navButton}>
          <Text style={styles.navButtonText}>Leave a review!</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => navigation.navigate('Jobsites')}
        >
          <Text style={styles.menuButtonText}>Jobsite Inventories</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => navigation.navigate('Payorders')}
        >
          <Text style={styles.menuButtonText}>Pay Orders</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => navigation.navigate('Warehouses')}
        >
          <Text style={styles.menuButtonText}>Warehouses</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// CSS StyleSheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E7EB', // Light gray background
    paddingTop: 60, // Gives space for the phone's status bar
    paddingHorizontal: 16,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  navButton: {
    backgroundColor: '#D1D5DB', // Slightly darker gray
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  navButtonText: {
    color: '#000',
    fontWeight: '500',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: '60%', // Keeps the card from stretching too tall
  },
  menuButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  menuButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  }
});