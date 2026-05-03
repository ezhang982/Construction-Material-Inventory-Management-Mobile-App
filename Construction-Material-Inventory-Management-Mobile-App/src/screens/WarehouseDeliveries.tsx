import React, { useCallback, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, RefreshControl, Modal, ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import {
  getDeliveries, createDelivery, deleteWarehouse,
  DeliveryRow,
} from '../api/warehouses';
import { getJobsites, JobsiteRow } from '../api/jobsites';

type WarehouseDeliveriesRouteProp = RouteProp<RootStackParamList, 'WarehouseDeliveries'>;

export default function WarehouseDeliveries() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<WarehouseDeliveriesRouteProp>();
  const { warehouseId, warehouseName, warehouseAddress } = route.params;

  const [deliveries, setDeliveries]   = useState<DeliveryRow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [error, setError]             = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Add delivery modal
  const [addVisible, setAddVisible]             = useState(false);
  const [slipId, setSlipId]                     = useState('');
  const [jobsites, setJobsites]                 = useState<JobsiteRow[]>([]);
  const [jobsitesLoading, setJobsitesLoading]   = useState(false);
  const [jobsiteFilter, setJobsiteFilter]       = useState('');
  const [selectedJobsite, setSelectedJobsite]   = useState<JobsiteRow | null>(null);
  const [addError, setAddError]                 = useState('');
  const [adding, setAdding]                     = useState(false);

  // Delete warehouse confirmation modal
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleting, setDeleting]           = useState(false);
  const [deleteError, setDeleteError]     = useState('');

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
  const openAdd = async () => {
    setSlipId('');
    setSelectedJobsite(null);
    setJobsiteFilter('');
    setAddError('');
    setAddVisible(true);
    setJobsitesLoading(true);
    try {
      setJobsites(await getJobsites());
    } catch {
      setAddError('Could not load jobsites.');
    } finally {
      setJobsitesLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!slipId.trim()) { setAddError('Packing Slip ID is required.'); return; }
    if (!selectedJobsite) { setAddError('Please select a destination jobsite.'); return; }
    setAdding(true);
    setAddError('');
    try {
      const created = await createDelivery(Number(warehouseId), slipId.trim(), selectedJobsite.id);
      setDeliveries(prev => [created, ...prev]);
      setAddVisible(false);
      navigation.navigate('DeliveryInventory', {
        warehouseId,
        deliveryId:     created.id.toString(),
        packingSlipId:  created.packingSlipId,
        jobsiteId:      created.jobsiteId.toString(),
        jobsiteName:    selectedJobsite.jobsiteName,
        jobsiteAddress: selectedJobsite.jobsiteAddress,
      });
    } catch (err: any) {
      setAddError(err.message || 'Failed to add delivery.');
    } finally {
      setAdding(false);
    }
  };

  // ── Delete warehouse ────────────────────────────────────────────
  const openDelete = () => { setDeleteError(''); setDeleteVisible(true); };

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

  const filteredJobsites = jobsites.filter(j =>
    j.jobsiteName.toLowerCase().includes(jobsiteFilter.toLowerCase()) ||
    j.jobsiteAddress.toLowerCase().includes(jobsiteFilter.toLowerCase())
  );

  const filtered = deliveries.filter(d =>
    d.jobsiteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.jobsiteAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.packingSlipId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }: { item: DeliveryRow }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('DeliveryInventory', {
        warehouseId,
        deliveryId:     item.id.toString(),
        packingSlipId:  item.packingSlipId,
        jobsiteId:      item.jobsiteId.toString(),
        jobsiteName:    item.jobsiteName,
        jobsiteAddress: item.jobsiteAddress,
      })}
    >
      <View style={styles.cardLeft}>
        <Text style={styles.jobsiteNameText} numberOfLines={1}>{item.jobsiteName}</Text>
        <Text style={styles.jobsiteAddressText} numberOfLines={1}>{item.jobsiteAddress}</Text>
      </View>
      <Text style={styles.divider}>|</Text>
      <Text style={styles.deliveryNumberText}>{item.packingSlipId}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.titleText} numberOfLines={1}>{warehouseName}</Text>
          <Text style={styles.subtitleText} numberOfLines={1}>{warehouseAddress}</Text>
        </View>
        <TouchableOpacity style={[styles.headerButton, styles.deleteButton]} onPress={openDelete}>
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Action row */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton} onPress={openAdd}>
          <Text style={styles.buttonText}>Add Delivery</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchLabel}>Search</Text>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Jobsite or packing slip..."
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

            <Text style={styles.modalLabel}>Destination Jobsite</Text>
            <TextInput
              style={styles.modalInput}
              value={jobsiteFilter}
              onChangeText={text => { setJobsiteFilter(text); setSelectedJobsite(null); }}
              placeholder="Search jobsites..."
              placeholderTextColor="#999"
            />
            <View style={styles.dropdownContainer}>
              {jobsitesLoading ? (
                <ActivityIndicator style={{ margin: 12 }} />
              ) : (
                <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                  {filteredJobsites.length === 0
                    ? <Text style={styles.emptyText}>No jobsites found.</Text>
                    : filteredJobsites.map(j => {
                        const isSel = selectedJobsite?.id === j.id;
                        return (
                          <TouchableOpacity
                            key={j.id}
                            style={[styles.dropdownRow, isSel && styles.dropdownRowSelected]}
                            onPress={() => { setSelectedJobsite(j); setJobsiteFilter(`${j.jobsiteName} — ${j.jobsiteAddress}`); }}
                          >
                            <Text style={styles.dropdownName}>{j.jobsiteName}</Text>
                            <Text style={styles.dropdownAddress}>{j.jobsiteAddress}</Text>
                          </TouchableOpacity>
                        );
                      })
                  }
                </ScrollView>
              )}
            </View>

            {addError ? <Text style={styles.errorText}>{addError}</Text> : null}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.confirmButton, (!selectedJobsite || !slipId.trim() || adding) && styles.confirmDisabled]}
                onPress={handleAdd}
                disabled={!selectedJobsite || !slipId.trim() || adding}
              >
                {adding ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Confirm</Text>}
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
              Permanently delete <Text style={styles.bold}>{warehouseName}</Text>?{'\n'}
              This will also remove all its deliveries.
            </Text>
            {deleteError ? <Text style={styles.errorText}>{deleteError}</Text> : null}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.destructiveButton, deleting && styles.confirmDisabled]}
                onPress={handleDeleteWarehouse}
                disabled={deleting}
              >
                {deleting ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Delete</Text>}
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
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  headerButton: { backgroundColor: '#A3A3A3', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 4, marginTop: 2 },
  deleteButton: { backgroundColor: '#EF4444' },
  buttonText: { color: '#000', fontSize: 14, fontWeight: '500' },
  titleContainer: { flex: 1, marginHorizontal: 8 },
  titleText: { fontSize: 15, fontWeight: '700', color: '#111827' },
  subtitleText: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  actionButton: { backgroundColor: '#A3A3A3', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 4 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, width: '100%' },
  searchLabel: { backgroundColor: '#A3A3A3', paddingVertical: 12, paddingHorizontal: 12, fontSize: 16, borderTopLeftRadius: 4, borderBottomLeftRadius: 4, overflow: 'hidden' },
  searchInput: { flex: 1, backgroundColor: '#D4D4D4', paddingVertical: 12, paddingHorizontal: 12, fontSize: 16, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  listContainer: { flex: 1, backgroundColor: '#FFFFFF', padding: 10, borderRadius: 8 },
  errorText: { color: '#DC2626', paddingHorizontal: 4, paddingBottom: 8, fontSize: 13 },
  card: { flexDirection: 'row', backgroundColor: '#F0F0F0', padding: 16, marginBottom: 8, alignItems: 'center', borderRadius: 4 },
  cardLeft: { flex: 1, paddingRight: 8 },
  jobsiteNameText: { fontSize: 15, fontWeight: '600', color: '#111827' },
  jobsiteAddressText: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  divider: { fontSize: 16, marginHorizontal: 8, color: '#9CA3AF' },
  deliveryNumberText: { fontSize: 15, fontWeight: '600', textAlign: 'right', maxWidth: 120 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 8, padding: 20, width: '100%', maxWidth: 420, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  xButton: { padding: 4 },
  xButtonText: { fontSize: 18, color: '#374151', fontWeight: '600' },
  modalLabel: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  modalInput: { backgroundColor: '#E5E7EB', padding: 10, borderRadius: 4, fontSize: 15, marginBottom: 8 },
  dropdownContainer: { backgroundColor: '#F9FAFB', borderRadius: 4, borderWidth: 1, borderColor: '#D1D5DB', maxHeight: 180, marginBottom: 12 },
  dropdownRow: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  dropdownRowSelected: { backgroundColor: '#D1D5DB' },
  dropdownName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  dropdownAddress: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  emptyText: { padding: 16, color: '#9CA3AF', textAlign: 'center' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  confirmButton: { backgroundColor: '#A3A3A3', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 4, minWidth: 90, alignItems: 'center' },
  confirmDisabled: { opacity: 0.5 },
  destructiveButton: { backgroundColor: '#FCA5A5' },
  confirmText: { fontSize: 15, color: '#374151', marginBottom: 16, lineHeight: 22 },
  bold: { fontWeight: '700' },
});
