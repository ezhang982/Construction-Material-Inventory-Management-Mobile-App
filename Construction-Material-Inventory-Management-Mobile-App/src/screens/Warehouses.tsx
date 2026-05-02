import React, { useCallback, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, RefreshControl, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getWarehouses, createWarehouse, WarehouseRow } from '../api/warehouses';

export default function WarehouseInventories() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [warehouses, setWarehouses]   = useState<WarehouseRow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [error, setError]             = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Add modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [newAddress, setNewAddress]     = useState('');
  const [submitError, setSubmitError]   = useState('');
  const [submitting, setSubmitting]     = useState(false);

  const fetchWarehouses = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      setWarehouses(await getWarehouses());
    } catch (err: any) {
      setError(err.message || 'Failed to load warehouses.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchWarehouses(); }, [fetchWarehouses]));

  const openModal = () => {
    setNewAddress('');
    setSubmitError('');
    setModalVisible(true);
  };

  const handleAdd = async () => {
    if (!newAddress.trim()) {
      setSubmitError('Address is required.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const created = await createWarehouse(newAddress.trim());
      setWarehouses(prev => [...prev, created]);
      setModalVisible(false);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to create warehouse.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = warehouses.filter(w =>
    w.warehouseAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.id.toString().includes(searchQuery)
  );

  const renderItem = ({ item }: { item: WarehouseRow }) => (
    <TouchableOpacity
      style={styles.jobsiteCard}
      onPress={() => navigation.navigate('WarehouseDeliveries', {
        warehouseId:      item.id.toString(),
        warehouseAddress: item.warehouseAddress,
      })}
    >
      <Text style={styles.jobsiteId}>#{item.id}</Text>
      <Text style={styles.jobsiteAddress}>{item.warehouseAddress}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Warehouses</Text>
        <TouchableOpacity style={styles.headerButton} onPress={openModal}>
          <Text style={styles.buttonText}>Add Warehouse</Text>
        </TouchableOpacity>
      </View>

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
              <RefreshControl refreshing={refreshing} onRefresh={() => fetchWarehouses(true)} />
            }
          />
        )}
      </View>

      {/* Add Warehouse Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Add Warehouse</Text>

              <Text style={styles.modalLabel}>Address</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 9129 Lenten Dr Rockville MD"
                value={newAddress}
                onChangeText={setNewAddress}
              />

              {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmButton} onPress={handleAdd} disabled={submitting}>
                  {submitting
                    ? <ActivityIndicator color="#000" />
                    : <Text style={styles.buttonText}>Add</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5E7EB', paddingTop: 50, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  pageTitle: { flex: 1, textAlign: 'center', fontSize: 24, fontWeight: '700', color: '#111827' },
  headerButton: { backgroundColor: '#A3A3A3', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 4 },
  buttonText: { color: '#000', fontSize: 16, fontWeight: '500' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, width: '100%' },
  searchLabel: { backgroundColor: '#A3A3A3', paddingVertical: 12, paddingHorizontal: 12, fontSize: 16, borderTopLeftRadius: 4, borderBottomLeftRadius: 4, overflow: 'hidden' },
  searchInput: { flex: 1, backgroundColor: '#D4D4D4', paddingVertical: 12, paddingHorizontal: 12, fontSize: 16, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  listContainer: { flex: 1, backgroundColor: '#FFFFFF', padding: 10, borderRadius: 8 },
  errorText: { color: '#DC2626', padding: 4, marginBottom: 8 },
  jobsiteCard: { backgroundColor: '#F0F0F0', padding: 16, marginBottom: 8, borderRadius: 4 },
  jobsiteId: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  jobsiteAddress: { fontSize: 16, fontWeight: '500' },
  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 8, padding: 24, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  modalLabel: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  modalInput: { backgroundColor: '#E5E7EB', padding: 12, borderRadius: 4, marginBottom: 14, fontSize: 15 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 4 },
  cancelButton: { backgroundColor: '#D1D5DB', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 4 },
  confirmButton: { backgroundColor: '#A3A3A3', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 4, minWidth: 64, alignItems: 'center' },
});
