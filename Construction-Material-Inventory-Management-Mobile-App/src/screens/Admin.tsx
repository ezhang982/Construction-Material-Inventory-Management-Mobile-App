import React, { useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, RefreshControl, Modal, KeyboardAvoidingView, Platform,
  ScrollView, Dimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { listUsers, updateUserPermission, deleteUserByEmail, User } from '../api/auth';

const PERMISSION_LEVELS = [
  { level: 1, label: 'Admin' },
  { level: 2, label: 'Project Manager' },
  { level: 3, label: 'Logistics' },
  { level: 4, label: 'Foreman' },
];

export default function Admin() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Dropdown state for each user
  const [dropdownOpen, setDropdownOpen] = useState<Record<string, boolean>>({});

  // Delete confirmation modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Permission update loading state
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const fetchedUsers = await listUsers();
      setUsers(fetchedUsers);
    } catch (err: any) {
      setError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchUsers(); }, [fetchUsers]));

  const toggleDropdown = (email: string) => {
    setDropdownOpen(prev => ({
      ...prev,
      [email]: !prev[email],
    }));
  };

  const handlePermissionChange = async (user: User, newLevel: number) => {
    setUpdatingUser(user.email);
    try {
      const updated = await updateUserPermission(user.email, newLevel);
      setUsers(prev =>
        prev.map(u =>
          u.email === user.email ? { ...u, permissionLevel: updated.permissionLevel, role: updated.role } : u
        )
      );
      setDropdownOpen(prev => ({ ...prev, [user.email]: false }));
    } catch (err: any) {
      setError(err.message || 'Failed to update user permission');
    } finally {
      setUpdatingUser(null);
    }
  };

  const openDeleteModal = (user: User) => {
    setUserToDelete(user);
    setDeleteError('');
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    setDeleteError('');
    try {
      await deleteUserByEmail(userToDelete.email);
      setUsers(prev => prev.filter(u => u.email !== userToDelete.email));
      setDeleteModalVisible(false);
      setUserToDelete(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userRole}>{item.role}</Text>
      </View>

      <View style={styles.userActions}>
        {/* Permission Dropdown */}
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => toggleDropdown(item.email)}
            disabled={updatingUser === item.email}
          >
            {updatingUser === item.email ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <>
                <Text style={styles.permissionButtonText}>{item.role}</Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </>
            )}
          </TouchableOpacity>

          {dropdownOpen[item.email] && updatingUser !== item.email && (
            <View style={styles.dropdownMenu}>
              {PERMISSION_LEVELS.map(({ level, label }) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.dropdownItem,
                    item.permissionLevel === level && styles.dropdownItemActive,
                  ]}
                  onPress={() => handlePermissionChange(item, level)}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      item.permissionLevel === level && styles.dropdownItemTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => openDeleteModal(item)}
          disabled={updatingUser === item.email}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>User Management</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 32 }} size="large" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : users.length === 0 ? (
          <Text style={styles.emptyText}>No users found</Text>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.email}
            renderItem={renderUserItem}
            showsVerticalScrollIndicator
            contentContainerStyle={{ paddingBottom: 20 }}
            scrollEnabled={true}
            nestedScrollEnabled={true}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => fetchUsers(true)} />
            }
          />
        )}
      </View>

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteModalVisible} transparent animationType="fade" onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Delete User</Text>
              <Text style={styles.modalMessage}>
                Are you sure you want to delete {userToDelete?.email}?
              </Text>

              {deleteError ? <Text style={styles.errorText}>{deleteError}</Text> : null}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setDeleteModalVisible(false)}
                  disabled={deleting}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmDeleteButton}
                  onPress={handleDeleteConfirm}
                  disabled={deleting}
                >
                  {deleting ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.deleteConfirmText}>Delete</Text>
                  )}
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
  container: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    overflow: 'visible',
  },
  errorText: {
    color: '#DC2626',
    padding: 12,
    marginBottom: 8,
    borderRadius: 4,
    backgroundColor: '#FEE2E2',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
  userCard: {
    backgroundColor: '#F0F0F0',
    padding: 12,
    marginBottom: 8,
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'visible',
  },
  userInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#6B7280',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 10,
  },
  permissionButton: {
    backgroundColor: '#D1D5DB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 120,
    justifyContent: 'space-between',
  },
  permissionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000',
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#666',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 38,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    overflow: 'hidden',
    zIndex: 1000,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 5,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dropdownItemActive: {
    backgroundColor: '#E0E7FF',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#374151',
  },
  dropdownItemTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFF',
  },
  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#D1D5DB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  confirmDeleteButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  deleteConfirmText: {
    color: '#FFF',
    fontWeight: '500',
  },
});
