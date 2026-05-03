import React, { useCallback, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, RefreshControl, Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import {
  getDeliveryInventory, addDeliveryItem, removeDeliveryItem, deleteDelivery,
  DeliveryInventory, DeliveryMaterialItem, DeliveryEquipmentItem, DeliveryToolItem,
  ItemType, AddItemPayload,
} from '../api/warehouses';

type RouteProps = RouteProp<RootStackParamList, 'DeliveryInventory'>;

type SelectedItem = { itemType: ItemType; id: number; label: string } | null;

export default function DeliveryInventoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProps>();
  const { warehouseId, deliveryId, packingSlipId, jobsiteName, jobsiteAddress } = route.params;

  const [inventory, setInventory]   = useState<DeliveryInventory | null>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState('');
  const [selected, setSelected]     = useState<SelectedItem>(null);

  // Add item modal
  const [addVisible, setAddVisible]     = useState(false);
  const [itemType, setItemType]         = useState<ItemType>('material');
  const [iName, setIName]               = useState('');
  const [iDescription, setIDescription] = useState('');
  const [iAmount, setIAmount]           = useState('');
  const [iItemId, setIItemId]           = useState('');
  const [addError, setAddError]         = useState('');
  const [adding, setAdding]             = useState(false);

  // Remove confirmation modal
  const [removeVisible, setRemoveVisible] = useState(false);
  const [removing, setRemoving]           = useState(false);
  const [removeError, setRemoveError]     = useState('');

  // Delete delivery confirmation modal
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleting, setDeleting]           = useState(false);
  const [deleteError, setDeleteError]     = useState('');

  const fetchInventory = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      setInventory(await getDeliveryInventory(Number(warehouseId), Number(deliveryId)));
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [warehouseId, deliveryId]);

  useFocusEffect(useCallback(() => { fetchInventory(); }, [fetchInventory]));

  // ── Add item ──────────────────────────────────────────────────────
  const openAdd = () => {
    setItemType('material');
    setIName(''); setIDescription(''); setIAmount(''); setIItemId('');
    setAddError('');
    setAddVisible(true);
  };

  const handleAdd = async () => {
    if (!iName.trim()) { setAddError('Name is required.'); return; }
    const payload: AddItemPayload = {
      itemType,
      name: iName.trim(),
      description: iDescription.trim() || undefined,
      amount: iAmount ? Number(iAmount) : undefined,
      itemId: iItemId.trim() || undefined,
    };
    setAdding(true);
    setAddError('');
    try {
      await addDeliveryItem(Number(warehouseId), Number(deliveryId), payload);
      setAddVisible(false);
      fetchInventory();
    } catch (err: any) {
      setAddError(err.message || 'Failed to add item.');
    } finally {
      setAdding(false);
    }
  };

  // ── Remove selected item ──────────────────────────────────────────
  const openRemove = () => { if (!selected) return; setRemoveError(''); setRemoveVisible(true); };

  const handleRemove = async () => {
    if (!selected) return;
    setRemoving(true);
    setRemoveError('');
    try {
      await removeDeliveryItem(Number(warehouseId), Number(deliveryId), selected.itemType, selected.id);
      setSelected(null);
      setRemoveVisible(false);
      fetchInventory();
    } catch (err: any) {
      setRemoveError(err.message || 'Failed to remove item.');
    } finally {
      setRemoving(false);
    }
  };

  // ── Delete delivery ───────────────────────────────────────────────
  const openDelete = () => { setDeleteError(''); setDeleteVisible(true); };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteDelivery(Number(warehouseId), Number(deliveryId));
      setDeleteVisible(false);
      navigation.goBack();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete delivery.');
    } finally {
      setDeleting(false);
    }
  };

  const selectItem = (type: ItemType, id: number, label: string) =>
    setSelected(prev => prev?.id === id && prev?.itemType === type ? null : { itemType: type, id, label });

  const isSelected = (type: ItemType, id: number) =>
    selected?.itemType === type && selected?.id === id;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.titleText} numberOfLines={1}>Packing Slip #{packingSlipId}</Text>
          <Text style={styles.subtitleText} numberOfLines={1}>{jobsiteName} — {jobsiteAddress}</Text>
        </View>
        <TouchableOpacity style={[styles.headerButton, styles.deleteButton]} onPress={openDelete}>
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton} onPress={openAdd}>
          <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, !selected && styles.actionDisabled]}
          onPress={openRemove}
          disabled={!selected}
        >
          <Text style={styles.buttonText}>Remove</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} size="large" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <ScrollView
          style={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchInventory(true)} />}
        >
          {/* Materials */}
          <Text style={styles.sectionHeader}>Materials</Text>
          {(inventory?.materials ?? []).length === 0
            ? <Text style={styles.emptyText}>No materials.</Text>
            : inventory!.materials.map((item: DeliveryMaterialItem) => (
              <TouchableOpacity
                key={`mat-${item.id}`}
                style={[styles.card, isSelected('material', item.id) && styles.cardSelected]}
                onPress={() => selectItem('material', item.id, item.name)}
              >
                <View style={styles.cardRow}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <View style={styles.amountBadge}>
                    <Text style={styles.amountBadgeText}>×{item.amount}</Text>
                  </View>
                </View>
                {item.description ? <Text style={styles.itemSub}>{item.description}</Text> : null}
              </TouchableOpacity>
            ))
          }

          {/* Equipment */}
          <Text style={styles.sectionHeader}>Equipment</Text>
          {(inventory?.equipment ?? []).length === 0
            ? <Text style={styles.emptyText}>No equipment.</Text>
            : inventory!.equipment.map((item: DeliveryEquipmentItem) => (
              <TouchableOpacity
                key={`equip-${item.id}`}
                style={[styles.card, isSelected('equipment', item.id) && styles.cardSelected]}
                onPress={() => selectItem('equipment', item.id, item.name)}
              >
                <View style={styles.cardRow}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <View style={styles.amountBadge}>
                    <Text style={styles.amountBadgeText}>×{item.amount}</Text>
                  </View>
                </View>
                {item.serialNumber ? <Text style={styles.itemDetail}>S/N: {item.serialNumber}</Text> : null}
                {item.description ? <Text style={styles.itemSub}>{item.description}</Text> : null}
              </TouchableOpacity>
            ))
          }

          {/* Tools */}
          <Text style={styles.sectionHeader}>Tools</Text>
          {(inventory?.tools ?? []).length === 0
            ? <Text style={styles.emptyText}>No tools.</Text>
            : inventory!.tools.map((item: DeliveryToolItem) => (
              <TouchableOpacity
                key={`tool-${item.id}`}
                style={[styles.card, isSelected('tool', item.id) && styles.cardSelected]}
                onPress={() => selectItem('tool', item.id, item.name)}
              >
                <View style={styles.cardRow}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <View style={styles.amountBadge}>
                    <Text style={styles.amountBadgeText}>×{item.amount}</Text>
                  </View>
                </View>
                {item.idNumber ? <Text style={styles.itemDetail}>ID: {item.idNumber}</Text> : null}
              </TouchableOpacity>
            ))
          }
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── Add Item Modal ── */}
      <Modal visible={addVisible} transparent animationType="fade" onRequestClose={() => !adding && setAddVisible(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => { if (!adding) setAddVisible(false); }}>
          <TouchableOpacity style={styles.modalCard} activeOpacity={1} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Item</Text>
              <TouchableOpacity onPress={() => { if (!adding) setAddVisible(false); }} style={styles.xButton}>
                <Text style={styles.xButtonText}>x</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Type</Text>
            <View style={styles.typePicker}>
              {(['material', 'equipment', 'tool'] as ItemType[]).map(t => (
                <TouchableOpacity key={t} style={[styles.typeBtn, itemType === t && styles.typeBtnActive]} onPress={() => setItemType(t)}>
                  <Text style={styles.typeBtnText}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Name</Text>
            <TextInput style={styles.modalInput} value={iName} onChangeText={setIName} />

            {(itemType === 'material' || itemType === 'equipment') && (
              <>
                <Text style={styles.modalLabel}>Description</Text>
                <TextInput style={styles.modalInput} value={iDescription} onChangeText={setIDescription} />
              </>
            )}
            <Text style={styles.modalLabel}>Amount</Text>
            <TextInput style={styles.modalInput} value={iAmount} onChangeText={setIAmount} keyboardType="numeric" />
            {itemType === 'equipment' && (
              <>
                <Text style={styles.modalLabel}>Serial Number</Text>
                <TextInput style={styles.modalInput} value={iItemId} onChangeText={setIItemId} autoCapitalize="none" />
              </>
            )}
            {itemType === 'tool' && (
              <>
                <Text style={styles.modalLabel}>ID Number</Text>
                <TextInput style={styles.modalInput} value={iItemId} onChangeText={setIItemId} autoCapitalize="none" />
              </>
            )}

            {addError ? <Text style={styles.errorText}>{addError}</Text> : null}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.confirmButton, adding && styles.confirmDisabled]} onPress={handleAdd} disabled={adding}>
                {adding ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Confirm</Text>}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Remove Confirmation ── */}
      <Modal visible={removeVisible} transparent animationType="fade" onRequestClose={() => !removing && setRemoveVisible(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => { if (!removing) setRemoveVisible(false); }}>
          <TouchableOpacity style={styles.modalCard} activeOpacity={1} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Remove Item</Text>
              <TouchableOpacity onPress={() => { if (!removing) setRemoveVisible(false); }} style={styles.xButton}>
                <Text style={styles.xButtonText}>x</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.confirmText}>Remove <Text style={styles.bold}>{selected?.label}</Text>?</Text>
            {removeError ? <Text style={styles.errorText}>{removeError}</Text> : null}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.destructiveButton, removing && styles.confirmDisabled]}
                onPress={handleRemove}
                disabled={removing}
              >
                {removing ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Remove</Text>}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Delete Delivery Confirmation ── */}
      <Modal visible={deleteVisible} transparent animationType="fade" onRequestClose={() => !deleting && setDeleteVisible(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => { if (!deleting) setDeleteVisible(false); }}>
          <TouchableOpacity style={styles.modalCard} activeOpacity={1} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Delete Delivery</Text>
              <TouchableOpacity onPress={() => { if (!deleting) setDeleteVisible(false); }} style={styles.xButton}>
                <Text style={styles.xButtonText}>x</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.confirmText}>
              Permanently delete packing slip <Text style={styles.bold}>#{packingSlipId}</Text>?{'\n'}
              All associated inventory will be removed.
            </Text>
            {deleteError ? <Text style={styles.errorText}>{deleteError}</Text> : null}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.destructiveButton, deleting && styles.confirmDisabled]}
                onPress={handleDelete}
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
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  actionButton: { backgroundColor: '#A3A3A3', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 4 },
  actionDisabled: { opacity: 0.4 },
  scroll: { flex: 1 },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: '#374151', backgroundColor: '#D1D5DB', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 4, marginBottom: 6, marginTop: 8 },
  emptyText: { fontSize: 13, color: '#9CA3AF', paddingHorizontal: 4, marginBottom: 4 },
  card: { backgroundColor: '#FFFFFF', padding: 12, marginBottom: 6, borderRadius: 4 },
  cardSelected: { backgroundColor: '#DBEAFE', borderWidth: 1, borderColor: '#93C5FD' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1, paddingRight: 8 },
  itemDetail: { fontSize: 13, color: '#374151', marginTop: 2 },
  itemSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  amountBadge: { backgroundColor: '#6B7280', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 10 },
  amountBadgeText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  errorText: { color: '#DC2626', paddingHorizontal: 4, paddingBottom: 8, fontSize: 13 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 8, padding: 20, width: '100%', maxWidth: 420 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  xButton: { padding: 4 },
  xButtonText: { fontSize: 18, color: '#374151', fontWeight: '600' },
  modalLabel: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  modalInput: { backgroundColor: '#E5E7EB', padding: 10, borderRadius: 4, fontSize: 15, marginBottom: 10 },
  typePicker: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  typeBtn: { flex: 1, backgroundColor: '#E5E7EB', padding: 8, borderRadius: 4, alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#A3A3A3' },
  typeBtnText: { fontSize: 13, fontWeight: '600' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  confirmButton: { backgroundColor: '#A3A3A3', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 4, minWidth: 90, alignItems: 'center' },
  confirmDisabled: { opacity: 0.5 },
  destructiveButton: { backgroundColor: '#FCA5A5' },
  confirmText: { fontSize: 15, color: '#374151', marginBottom: 16, lineHeight: 22 },
  bold: { fontWeight: '700' },
});
