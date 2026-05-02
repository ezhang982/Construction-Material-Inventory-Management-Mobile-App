import React, { useCallback, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, RefreshControl, Modal, ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import {
  getDeliveries, createDelivery, deleteDelivery, deleteWarehouse,
  DeliveryRow,
} from '../api/warehouses';

type WarehouseDeliveriesRouteProp = RouteProp<RootStackParamList, 'WarehouseDeliveries'>;

export default function WarehouseDeliveries() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<WarehouseDeliveriesRouteProp>();
  const { warehouseId, warehouseAddress } = route.params;

  const [deliveries, setDeliveries]       = useState<DeliveryRow[]>([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [error, setError]                 = useState('');
  const [searchQuery, setSearchQuery]     = useState('');
  const [selectedId, setSelectedId]       = useState<number | null>(null);

  // Add delivery modal
  const [addVisible, setAddVisible]         = useState(false);
  const [slipId, setSlipId]                 = useState('');
  const [destAddress, setDestAddress]       = useState('');
  const [addError, setAddError]             = useState('');
  const [adding, setAdding]                 = useState(false);

  // Remove delivery confirmation modal
  const [removeVisible, setRemoveVisible]   = useState(false);
  const [removing, setRemoving]             = useState(false);
  const [removeError, setRemoveError]       = useState('');

  // Delete warehouse confirmation modal
  const [deleteVisible, setDeleteVisible]   = useState(false);
  const [deleting, setDeleting]             = useState(false);
  const [deleteError, setDeleteError]       = useState('');

  const fetchDeliveries = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      setDeliveries(await getDeliveries(Number(warehouseId)));
    } catch (err: any) {
      setError(err.message || 'Failed to load deliveries.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [warehouseId]);

  useFocusEffect(useCallback(() => { fetchDeliveries(); }, [fetchDeliveries]));

  // ── Add delivery ────────────────────────────────────────────────
  const openAdd = () => {
    setSlipId('');
    setDestAddress('');
    setAddError('');
    setAddVisible(true);
  };

  const handleAdd = async () => {
    if (!slipId.trim() || !destAddress.trim()) {
      setAddError('Both fields are required.');
      return;
    }
    setAdding(true);
    setAddError('');
    try {
      const created = await createDelivery(Number(warehouseId), slipId.trim(), destAddress.trim());
      setDeliveries(prev => [created, ...prev]);
      setAddVisible(false);
    } catch (err: any) {
      setAddError(err.message || 'Failed to add delivery.');
    } finally {
      setAdding(false);
    }
  };

  // ── Remove selected delivery ────────────────────────────────────
  const openRemove = () => {
    if (!selectedId) return;
    setRemoveError('');
    setRemoveVisible(true);
  };

  const handleRemove = async () => {
    if (!selectedId) return;
    setRemoving(true);
    setRemoveError('');
    try {
      await deleteDelivery(Number(warehouseId), selectedId);
      setDeliveries(prev => prev.filter(d => d.id !== selectedId));
      setSelectedId(null);
      setRemoveVisible(false);
    } catch (err: any) {
      setRemoveError(err.message || 'Failed to remove delivery.');
    } finally {
      setRemoving(false);
    }
  };

  // ── Delete warehouse ────────────────────────────────────────────
  const openDelete = () => {
    setDeleteError('');
    setDeleteVisible(true);
  };

  const handleDeleteWarehouse = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteWarehouse(Number(warehouseId));
      setDeleteVisible(false);
      navigation.goBack();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete warehouse.');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = deliveries.filter(d =>
    d.destinationAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.packingSlipId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedDelivery = deliveries.find(d => d.id === selectedId) ?? null;

  const renderItem = ({ item }: { item: DeliveryRow }) => {
    const isSelected = item.id === selectedId;
    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => setSelectedId(prev => prev === item.id ? null : item.id)}
      >
        <Text style={styles.addressText} numberOfLines={2}>{item.destinationAddress}</Text>
        <Text style={styles.divider}>|</Text>
        <Text style={styles.deliveryNumberText}>{item.packingSlipId}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.titleText} numberOfLines={1}>
            #{warehouseId} | {warehouseAddress}
          </Text>
        </View>
        <TouchableOpacity style={[styles.headerButton, styles.deleteButton]} onPress={openDelete}>
          <Text style={styles.buttonText}>Delete Warehouse</Text>
        </TouchableOpacity>
      </View>

      {/* Action row */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton} onPress={openAdd}>
          <Text style={styles.buttonText}>Add Delivery</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, !selectedId && styles.actionDisabled]}
          onPress={openRemove}
          disabled={!selectedId}
        >
          <Text style={styles.buttonText}>Remove Delivery</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchLabel}>Search</Text>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#666"
        />
      </View>

      {/* List */}
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

      {/* ── Add Delivery Modal ── */}
      <Modal visible={addVisible} transparent animationType="fade" onRequestClose={() => !adding && setAddVisible(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => { if (!adding) setAddVisible(false); }}>
          <TouchableOpacity style={styles.modalCard} activeOpacity={1} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Delivery</Text>
              <TouchableOpacity onPress={() => { if (!adding) setAddVisible(false); }} style={styles.xButton}>
                <Text style={styles.xButtonText}>x</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Packing Slip ID</Text>
            <TextInput
              style={styles.modalInput}
              value={slipId}
              onChangeText={setSlipId}
              autoCapitalize="none"
            />

            <Text style={styles.modalLabel}>Destination Address</Text>
            <TextInput
              style={styles.modalInput}
              value={destAddress}
              onChangeText={setDestAddress}
              autoCapitalize="words"
            />

            {addError ? <Text style={styles.errorText}>{addError}</Text> : null}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.confirmButton, adding && styles.confirmDisabled]}
                onPress={handleAdd}
                disabled={adding}
              >
                {adding
                  ? <ActivityIndicator color="#000" />
                  : <Text style={styles.buttonText}>Confirm</Text>
                }
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Remove Delivery Confirmation ── */}
      <Modal visible={removeVisible} transparent animationType="fade" onRequestClose={() => !removing && setRemoveVisible(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => { if (!removing) setRemoveVisible(false); }}>
          <TouchableOpacity style={styles.modalCard} activeOpacity={1} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Remove Delivery</Text>
              <TouchableOpacity onPress={() => { if (!removing) setRemoveVisible(false); }} style={styles.xButton}>
                <Text style={styles.xButtonText}>x</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.confirmText}>
              Remove delivery <Text style={styles.bold}>{selectedDelivery?.packingSlipId}</Text> to{' '}
              <Text style={styles.bold}>{selectedDelivery?.destinationAddress}</Text>?
            </Text>

            {removeError ? <Text style={styles.errorText}>{removeError}</Text> : null}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.destructiveButton, removing && styles.confirmDisabled]}
                onPress={handleRemove}
                disabled={removing}
              >
                {removing
                  ? <ActivityIndicator color="#000" />
                  : <Text style={styles.buttonText}>Remove</Text>
                }
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Delete Warehouse Confirmation ── */}
      <Modal visible={deleteVisible} transparent animationType="fade" onRequestClose={() => !deleting && setDeleteVisible(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => { if (!deleting) setDeleteVisible(false); }}>
          <TouchableOpacity style={styles.modalCard} activeOpacity={1} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Delete Warehouse</Text>
              <TouchableOpacity onPress={() => { if (!deleting) setDeleteVisible(false); }} style={styles.xButton}>
                <Text style={styles.xButtonText}>x</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.confirmText}>
              Permanently delete warehouse at{' '}
              <Text style={styles.bold}>{warehouseAddress}</Text>?{'\n'}This will also remove all its deliveries.
            </Text>

            {deleteError ? <Text style={styles.errorText}>{deleteError}</Text> : null}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.destructiveButton, deleting && styles.confirmDisabled]}
                onPress={handleDeleteWarehouse}
                disabled={deleting}
              >
                {deleting
                  ? <ActivityIndicator color="#000" />
                  : <Text style={styles.buttonText}>Delete</Text>
                }
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5E7EB', paddingTop: 50, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerButton: { backgroundColor: '#A3A3A3', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 4 },
  deleteButton: { backgroundColor: '#EF4444' },
  buttonText: { color: '#000', fontSize: 14, fontWeight: '500' },
  titleContainer: { flex: 1, backgroundColor: '#FFFFFF', marginHorizontal: 8, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 4, alignItems: 'center' },
  titleText: { fontSize: 14, fontWeight: '600', color: '#000' },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  actionButton: { backgroundColor: '#A3A3A3', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 4 },
  actionDisabled: { opacity: 0.4 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, width: '100%' },
  searchLabel: { backgroundColor: '#A3A3A3', paddingVertical: 12, paddingHorizontal: 12, fontSize: 16, borderTopLeftRadius: 4, borderBottomLeftRadius: 4, overflow: 'hidden' },
  searchInput: { flex: 1, backgroundColor: '#D4D4D4', paddingVertical: 12, paddingHorizontal: 12, fontSize: 16, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  listContainer: { flex: 1, backgroundColor: '#FFFFFF', padding: 10, borderRadius: 8 },
  errorText: { color: '#DC2626', paddingHorizontal: 4, paddingBottom: 8, fontSize: 13 },
  card: { flexDirection: 'row', backgroundColor: '#F0F0F0', padding: 16, marginBottom: 8, alignItems: 'center', borderRadius: 4 },
  cardSelected: { backgroundColor: '#D1D5DB', borderWidth: 1, borderColor: '#6B7280' },
  addressText: { fontSize: 15, flex: 1, paddingRight: 8 },
  divider: { fontSize: 16, marginHorizontal: 8, color: '#9CA3AF' },
  deliveryNumberText: { fontSize: 16, width: 110, fontWeight: '600', textAlign: 'right' },
  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 8, padding: 20, width: '100%', maxWidth: 420 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  xButton: { padding: 4 },
  xButtonText: { fontSize: 18, color: '#374151', fontWeight: '600' },
  modalLabel: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  modalInput: { backgroundColor: '#E5E7EB', padding: 10, borderRadius: 4, fontSize: 15, marginBottom: 12 },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  confirmButton: { backgroundColor: '#A3A3A3', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 4, minWidth: 90, alignItems: 'center' },
  confirmDisabled: { opacity: 0.5 },
  destructiveButton: { backgroundColor: '#FCA5A5' },
  confirmText: { fontSize: 15, color: '#374151', marginBottom: 16, lineHeight: 22 },
  bold: { fontWeight: '700' },
});
