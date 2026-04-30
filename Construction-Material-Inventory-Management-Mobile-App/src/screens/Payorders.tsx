import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getPayorders, PayorderRow } from '../api/payorders';

export default function Payorders() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [payorders, setPayorders]   = useState<PayorderRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPayorders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const data = await getPayorders();
      setPayorders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load payorders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchPayorders(); }, [fetchPayorders]));

  const filtered = payorders.filter(order =>
    order.jobsiteAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.payorderNumber.includes(searchQuery)
  );

  const renderItem = ({ item }: { item: PayorderRow }) => (
    <TouchableOpacity style={styles.card}>
      <Text style={styles.addressText} numberOfLines={2}>{item.jobsiteAddress}</Text>
      <Text style={styles.divider}>|</Text>
      <Text style={styles.orderNumberText}>{item.payorderNumber}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <Text style={styles.buttonText}>Add Payorder</Text>
        </TouchableOpacity>
      </View>

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
              <RefreshControl refreshing={refreshing} onRefresh={() => fetchPayorders(true)} />
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5E7EB', paddingTop: 50, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  headerButton: { backgroundColor: '#A3A3A3', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 4 },
  buttonText: { color: '#000', fontSize: 16, fontWeight: '500' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, width: '100%' },
  searchLabel: { backgroundColor: '#A3A3A3', paddingVertical: 12, paddingHorizontal: 12, fontSize: 16, borderTopLeftRadius: 4, borderBottomLeftRadius: 4, overflow: 'hidden' },
  searchInput: { flex: 1, backgroundColor: '#D4D4D4', paddingVertical: 12, paddingHorizontal: 12, fontSize: 16, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  listContainer: { flex: 1, backgroundColor: '#FFFFFF', padding: 10, borderRadius: 8 },
  errorText: { color: '#DC2626', padding: 16, textAlign: 'center' },
  card: { flexDirection: 'row', backgroundColor: '#F0F0F0', padding: 16, marginBottom: 8, alignItems: 'center', borderRadius: 4 },
  addressText: { fontSize: 15, flex: 1, paddingRight: 8 },
  divider: { fontSize: 16, marginHorizontal: 8, color: '#9CA3AF' },
  orderNumberText: { fontSize: 16, width: 90, fontWeight: '600', textAlign: 'right' },
});
