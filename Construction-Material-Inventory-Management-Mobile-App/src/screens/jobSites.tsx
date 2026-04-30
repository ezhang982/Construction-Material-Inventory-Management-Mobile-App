import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getJobsites, JobsiteRow } from '../api/jobsites';

export default function JobsiteInventories() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [jobsites, setJobsites]     = useState<JobsiteRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchJobsites = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const data = await getJobsites();
      setJobsites(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load jobsites.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchJobsites(); }, [fetchJobsites]));

  const filtered = jobsites.filter(site =>
    site.jobsiteAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.id.toString().includes(searchQuery)
  );

  const renderItem = ({ item }: { item: JobsiteRow }) => (
    <TouchableOpacity style={styles.jobsiteCard}>
      <Text style={styles.jobsiteId}>#{item.id}</Text>
      <Text style={styles.divider}>|</Text>
      <Text style={styles.jobsiteAddress}>{item.jobsiteAddress}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <Text style={styles.buttonText}>Add Jobsite</Text>
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
              <RefreshControl refreshing={refreshing} onRefresh={() => fetchJobsites(true)} />
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
  jobsiteCard: { flexDirection: 'row', backgroundColor: '#F0F0F0', padding: 16, marginBottom: 8, alignItems: 'center', borderRadius: 4 },
  jobsiteId: { fontSize: 16, width: 80, fontWeight: '600' },
  divider: { fontSize: 16, marginHorizontal: 12, color: '#9CA3AF' },
  jobsiteAddress: { fontSize: 16, flex: 1 },
});
