import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { mockPayorders, Payorder } from '../data/mockData';

export default function Payorders() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const [searchQuery, setSearchQuery] = useState('');

  // Filters by both the address and the pay order number
  const filteredPayorders = mockPayorders.filter(order => 
    order.address.toLowerCase().includes(searchQuery.toLowerCase()) || 
    order.payorderNumber.includes(searchQuery)
  );

  const renderItem = ({ item }: { item: Payorder }) => (
    <TouchableOpacity style={styles.card}>
      <Text style={styles.addressText} numberOfLines={2}>
        {item.address}
      </Text>
      <Text style={styles.divider}>|</Text>
      <Text style={styles.orderNumberText}>{item.payorderNumber}</Text>
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
          <Text style={styles.buttonText}>Add Payorder</Text>
        </TouchableOpacity>
      </View>

      {/* Second Row - Full Width Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchLabel}>Search</Text>
        <TextInput 
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search address or order #..."
          placeholderTextColor="#666"
        />
      </View>

      {/* Scrollable List */}
      <View style={styles.listContainer}>
        <FlatList
          data={filteredPayorders}
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
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerButton: {
    backgroundColor: '#A3A3A3',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  searchLabel: {
    backgroundColor: '#A3A3A3',
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    overflow: 'hidden',
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
    borderRadius: 8,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
    borderRadius: 4,
  },
  addressText: {
    fontSize: 15,
    flex: 1, // Allows the address to take up the remaining space
    paddingRight: 8,
  },
  divider: {
    fontSize: 16,
    marginHorizontal: 8,
    color: '#9CA3AF',
  },
  orderNumberText: {
    fontSize: 16,
    width: 90, // Keeps the order numbers perfectly aligned on the right
    fontWeight: '600',
    textAlign: 'right',
  }
});