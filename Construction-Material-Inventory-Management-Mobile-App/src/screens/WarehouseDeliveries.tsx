import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getDeliveries, DeliveryRow } from '../api/warehouses';

type WarehouseDeliveriesRouteProp = RouteProp<RootStackParamList, 'WarehouseDeliveries'>;

export default function WarehouseDeliveries() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<WarehouseDeliveriesRouteProp>();
  const { warehouseId, warehouseAddress } = route.params;

  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDeliveries = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const data = await getDeliveries(Number(warehouseId));
      setDeliveries(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load deliveries.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [warehouseId]);

  useFocusEffect(useCallback(() => { fetchDeliveries(); }, [fetchDeliveries]));

  const filtered = deliveries.filter(d =>
    d.destinationAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.packingSlipId.includes(searchQuery)
  );

  const renderItem = ({ item }: { item: DeliveryRow }) => (
    <View style={styles.card}>
      <Text style={styles.addressText} numberOfLines={2}>{item.destinationAddress}</Text>
      <Text style={styles.divider}>|</Text>
      <Text style={styles.deliveryNumberText}>{item.packingSlipId}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.titleText} numberOfLines={1}>
            #{warehouseId} | {warehouseAddress}
          </Text>
        </View>
        <TouchableOpacity style={[styles.headerButton, styles.deleteButton]}>
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <View style={styles.leftActions}>
          <TouchableOpacity style={styles.actionButton}><Text style={styles.buttonText}>Add</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}><Text style={styles.buttonText}>Remove</Text></TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchLabel}>Search</Text>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search address or slip #"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 32 }} size="large" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            showsVerticalScrollIndicator
            contentContainerStyle={{ paddingBottom: 20 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => fetchDeliveries(true)} />
            }
          />
        )}
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
  errorText: { color: '#DC2626', padding: 16, textAlign: 'center' },
  card: { flexDirection: 'row', backgroundColor: '#F0F0F0', padding: 16, marginBottom: 8, alignItems: 'center', borderRadius: 4 },
  addressText: { fontSize: 15, flex: 1, paddingRight: 8 },
  divider: { fontSize: 16, marginHorizontal: 8, color: '#9CA3AF' },
  deliveryNumberText: { fontSize: 16, width: 110, fontWeight: '600', textAlign: 'right' },
});
