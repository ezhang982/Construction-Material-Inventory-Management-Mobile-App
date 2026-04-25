import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { inventoryItem, mockItemList, mockJobsites } from '../data/mockData';

// For TypeScript to know parameters to expect from the route
type JobSiteInventoryRouteProp = RouteProp<RootStackParamList, 'JobSiteInventory'>;

export default function JobsiteInventory() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<JobSiteInventoryRouteProp>();
  
  // Extract the ID passed from the previous screen
  const { JobsiteId } = route.params;

 

  // Find the specific jobsite details for the header
  const currentJobsite = mockJobsites.find(jobsite => jobsite.id === JobsiteId);

  const [searchQuery, setSearchQuery] = useState('');

  // Filter deliveries by the specific warehouse AND the search query
  const filteredItems = (currentJobsite?.inventory).filter(inventoryItem =>
    (inventoryItem.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    inventoryItem.name.includes(searchQuery))
  );

   console.log(filteredItems);

  const renderItem = ({ item }: { item: inventoryItem }) => (
    <View style={styles.card}>
      <Text style={styles.typeText} numberOfLines={2}>
        {item.type}
      </Text>
      <Text style={styles.divider}>|</Text>
      <Text style={styles.idText}>{item.id}</Text>
      <Text style={styles.divider}>|</Text>
      <Text style={styles.nameText}>{item.name}</Text>
    <View style={styles.card}></View>
      <Text style={styles.divider}>x</Text>
      <Text style={styles.amountText}>{item.amount}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Text style={styles.titleText} numberOfLines={1}>
            {currentJobsite?.id} | {currentJobsite?.address}
          </Text>
        </View>

        <TouchableOpacity style={[styles.headerButton, styles.deleteButton]}>
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons Row */}
      <View style={styles.actionRow}>
        <View style={styles.leftActions}>
          <TouchableOpacity style={styles.actionButton}><Text style={styles.buttonText}>Add</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}><Text style={styles.buttonText}>Remove</Text></TouchableOpacity>
        </View>
      </View>

      {/* Search Bar Row */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchLabel}>Search</Text>
        <TextInput 
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search id or name"
          placeholderTextColor="#666"
        />
      </View>

      {/* Scrollable List */}
      <View style={styles.listContainer}>
        <FlatList
          data={filteredItems}
          keyExtractor={innerItem => innerItem.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5E7EB', paddingTop: 50, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerButton: { backgroundColor: '#A3A3A3', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 4 },
  deleteButton: { backgroundColor: '#9CA3AF' },
  buttonText: { color: '#000', fontSize: 14, fontWeight: '500' },
  titleContainer: { flex: 1, backgroundColor: '#FFFFFF', marginHorizontal: 8, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 4, alignItems: 'center' },
  titleText: { fontSize: 14, fontWeight: '600', color: '#000' },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 12 },
  leftActions: { flexDirection: 'row', gap: 8 },
  actionButton: { backgroundColor: '#A3A3A3', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 4 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, width: '100%' },
  searchLabel: { backgroundColor: '#A3A3A3', paddingVertical: 12, paddingHorizontal: 12, fontSize: 16, borderTopLeftRadius: 4, borderBottomLeftRadius: 4, overflow: 'hidden' },
  searchInput: { flex: 1, backgroundColor: '#D4D4D4', paddingVertical: 12, paddingHorizontal: 12, fontSize: 16, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  listContainer: { flex: 1, backgroundColor: '#FFFFFF', padding: 10, borderRadius: 8 },
  card: { flexDirection: 'row', backgroundColor: '#F0F0F0', padding: 16, marginBottom: 8, alignItems: 'center', borderRadius: 4 },
  addressText: { fontSize: 15, flex: 1, paddingRight: 8 },
  divider: { fontSize: 16, marginHorizontal: 8, color: '#9CA3AF' },
  deliveryNumberText: { fontSize: 16, width: 110, fontWeight: '600', textAlign: 'right' }
});