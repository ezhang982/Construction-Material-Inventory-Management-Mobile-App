import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { mockJobsites, Jobsite } from '../data/mockData';

export default function JobsiteInventories() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const [searchQuery, setSearchQuery] = useState('');

  const filteredJobsites = mockJobsites.filter(site => 
    site.address.toLowerCase().includes(searchQuery.toLowerCase()) || 
    site.id.includes(searchQuery)
  );

  const renderItem = ({ item }: { item: Jobsite }) => (
    <TouchableOpacity style={styles.jobsiteCard}>
      <Text style={styles.jobsiteId}>{item.id}</Text>
      <Text style={styles.divider}>|</Text>
      <Text style={styles.jobsiteAddress}>{item.address}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      
      {/* Top Header Row - Just the Buttons */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.headerButton}>
          <Text style={styles.buttonText}>Add Jobsite</Text>
        </TouchableOpacity>
      </View>

      {/* Second Row - Full Width Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchLabel}>Search</Text>
        <TextInput 
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Type an ID or address..."
          placeholderTextColor="#666"
        />
      </View>

      {/* Scrollable List */}
      <View style={styles.listContainer}>
        <FlatList
          data={filteredJobsites}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Pushes the buttons to opposite edges
    marginBottom: 16, // Space between buttons and the search bar
  },
  headerButton: {
    backgroundColor: '#A3A3A3',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4, // Added a slight rounding to make them look more like buttons
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20, // Space between the search bar and the list
    width: '100%',
  },
  searchLabel: {
    backgroundColor: '#A3A3A3',
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    overflow: 'hidden', // Required on iOS for border-radius on Text components
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#D4D4D4',
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8, // Rounds the corners of the white list container
  },
  jobsiteCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
    borderRadius: 4,
  },
  jobsiteId: {
    fontSize: 16,
    width: 80,
    fontWeight: '600',
  },
  divider: {
    fontSize: 16,
    marginHorizontal: 12,
    color: '#9CA3AF', // Made the divider a softer gray
  },
  jobsiteAddress: {
    fontSize: 16,
    flex: 1,
  }
});