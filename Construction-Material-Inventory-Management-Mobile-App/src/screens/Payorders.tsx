import React, { useCallback, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, RefreshControl, Modal, ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getPayorders, createPayorder, PayorderRow, FulfillmentStatus } from '../api/payorders';
import { getJobsites, JobsiteRow } from '../api/jobsites';

export default function Payorders() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [payorders, setPayorders]     = useState<PayorderRow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [error, setError]             = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Payorder modal state
  const [modalVisible, setModalVisible]     = useState(false);
  const [jobsites, setJobsites]             = useState<JobsiteRow[]>([]);
  const [jobsitesLoading, setJobsitesLoading] = useState(false);
  const [jobsiteFilter, setJobsiteFilter]   = useState('');
  const [selectedJobsite, setSelectedJobsite] = useState<JobsiteRow | null>(null);
  const [submitError, setSubmitError]       = useState('');
  const [submitting, setSubmitting]         = useState(false);

  const fetchPayorders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      setPayorders(await getPayorders());
    } catch (err: any) {
      setError(err.message || 'Failed to load payorders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchPayorders(); }, [fetchPayorders]));

  const openModal = async () => {
    setSelectedJobsite(null);
    setJobsiteFilter('');
    setSubmitError('');
    setModalVisible(true);
    setJobsitesLoading(true);
    try {
      setJobsites(await getJobsites());
    } catch {
      setSubmitError('Could not load jobsites.');
    } finally {
      setJobsitesLoading(false);
    }
  };

  const closeModal = () => {
    if (submitting) return;
    setModalVisible(false);
  };

  const handleConfirm = async () => {
    if (!selectedJobsite) {
      setSubmitError('Please select a jobsite.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const created = await createPayorder(selectedJobsite.id);
      // createPayorder returns the raw payorder row — enrich it with jobsite fields for display
      const enriched: PayorderRow = {
        ...created,
        jobsiteName:    selectedJobsite.jobsiteName,
        jobsiteAddress: selectedJobsite.jobsiteAddress,
      };
      setPayorders(prev => [...prev, enriched]);
      setModalVisible(false);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to create payorder.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredJobsites = jobsites.filter(j =>
    j.jobsiteName.toLowerCase().includes(jobsiteFilter.toLowerCase()) ||
    j.jobsiteAddress.toLowerCase().includes(jobsiteFilter.toLowerCase())
  );

  const filtered = payorders.filter(order =>
    order.jobsiteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.jobsiteAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.payorderNumber.includes(searchQuery)
  );

  const statusColor: Record<FulfillmentStatus, string> = {
    pending:   '#9CA3AF',
    partial:   '#F59E0B',
    fulfilled: '#10B981',
  };
  const statusLabel: Record<FulfillmentStatus, string> = {
    pending:   'Pending',
    partial:   'Partial',
    fulfilled: 'Fulfilled',
  };

  const renderPayorder = ({ item }: { item: PayorderRow }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('PayorderInventory', {
        payorderId:        item.id.toString(),
        payorderNumber:    item.payorderNumber,
        jobsiteAddress:    item.jobsiteAddress,
        fulfillmentStatus: item.fulfillmentStatus,
      })}
    >
      <Text style={styles.addressText} numberOfLines={2}>{item.jobsiteAddress}</Text>
      <Text style={styles.divider}>|</Text>
      <View style={styles.rightCol}>
        <Text style={styles.orderNumberText}>{item.payorderNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor[item.fulfillmentStatus] }]}>
          <Text style={styles.statusBadgeText}>{statusLabel[item.fulfillmentStatus]}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={openModal}>
          <Text style={styles.buttonText}>Add Payorder</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchLabel}>Search</Text>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search for a payorder..."
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
            renderItem={renderPayorder}
            showsVerticalScrollIndicator
            contentContainerStyle={{ paddingBottom: 20 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => fetchPayorders(true)} />
            }
          />
        )}
      </View>

      {/* Add Payorder Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        {/* Tapping the backdrop closes the modal per UI doc §2.2 */}
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeModal}>
          <TouchableOpacity style={styles.modalCard} activeOpacity={1} onPress={() => {}}>

            {/* Header row: title + x */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Payorder</Text>
              <TouchableOpacity onPress={closeModal} style={styles.xButton}>
                <Text style={styles.xButtonText}>x</Text>
              </TouchableOpacity>
            </View>

            {/* Jobsite search filter */}
            <Text style={styles.modalLabel}>Jobsite Address</Text>
            <View style={styles.filterRow}>
              <TextInput
                style={styles.filterInput}
                value={jobsiteFilter}
                onChangeText={text => {
                  setJobsiteFilter(text);
                  setSelectedJobsite(null);
                }}
                autoCapitalize="none"
              />
            </View>

            {/* Jobsite dropdown list */}
            <View style={styles.dropdownContainer}>
              {jobsitesLoading ? (
                <ActivityIndicator style={{ marginTop: 16 }} />
              ) : (
                <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                  {filteredJobsites.length === 0 ? (
                    <Text style={styles.emptyText}>No jobsites found.</Text>
                  ) : (
                    filteredJobsites.map(j => {
                      const isSelected = selectedJobsite?.id === j.id;
                      return (
                        <TouchableOpacity
                          key={j.id}
                          style={[styles.dropdownRow, isSelected && styles.dropdownRowSelected]}
                          onPress={() => {
                            setSelectedJobsite(j);
                            setJobsiteFilter(`${j.jobsiteName} — ${j.jobsiteAddress}`);
                          }}
                        >
                          <Text style={styles.dropdownName}>{j.jobsiteName}</Text>
                          <Text style={styles.dropdownAddress}>{j.jobsiteAddress}</Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              )}
            </View>

            {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

            {/* Confirm bottom-right per UI doc */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.confirmButton, (!selectedJobsite || submitting) && styles.confirmDisabled]}
                onPress={handleConfirm}
                disabled={!selectedJobsite || submitting}
              >
                {submitting
                  ? <ActivityIndicator color="#000" />
                  : <Text style={styles.buttonText}>Confirm</Text>
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  headerButton: { backgroundColor: '#A3A3A3', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 4 },
  buttonText: { color: '#000', fontSize: 16, fontWeight: '500' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, width: '100%' },
  searchLabel: { backgroundColor: '#A3A3A3', paddingVertical: 12, paddingHorizontal: 12, fontSize: 16, borderTopLeftRadius: 4, borderBottomLeftRadius: 4, overflow: 'hidden' },
  searchInput: { flex: 1, backgroundColor: '#D4D4D4', paddingVertical: 12, paddingHorizontal: 12, fontSize: 16, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  listContainer: { flex: 1, backgroundColor: '#FFFFFF', padding: 10, borderRadius: 8 },
  errorText: { color: '#DC2626', paddingHorizontal: 4, paddingBottom: 8, fontSize: 13 },
  card: { flexDirection: 'row', backgroundColor: '#F0F0F0', padding: 16, marginBottom: 8, alignItems: 'center', borderRadius: 4 },
  addressText: { fontSize: 15, flex: 1, paddingRight: 8 },
  divider: { fontSize: 16, marginHorizontal: 8, color: '#9CA3AF' },
  rightCol: { alignItems: 'flex-end', gap: 6 },
  orderNumberText: { fontSize: 16, fontWeight: '600', textAlign: 'right' },
  statusBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 10 },
  statusBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 8, padding: 20, width: '100%', maxWidth: 420, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  xButton: { padding: 4 },
  xButtonText: { fontSize: 18, color: '#374151', fontWeight: '600' },
  modalLabel: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  filterRow: { marginBottom: 8 },
  filterInput: { backgroundColor: '#E5E7EB', padding: 10, borderRadius: 4, fontSize: 15 },
  dropdownContainer: { backgroundColor: '#F9FAFB', borderRadius: 4, borderWidth: 1, borderColor: '#D1D5DB', maxHeight: 200, marginBottom: 12 },
  dropdownRow: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  dropdownRowSelected: { backgroundColor: '#D1D5DB' },
  dropdownName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  dropdownAddress: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  emptyText: { padding: 16, color: '#9CA3AF', textAlign: 'center' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  confirmButton: { backgroundColor: '#A3A3A3', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 4, minWidth: 90, alignItems: 'center' },
  confirmDisabled: { opacity: 0.5 },
});
