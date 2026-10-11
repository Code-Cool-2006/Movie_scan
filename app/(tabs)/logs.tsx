import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HeaderBar } from '../../src/components/HeaderBar';
import { ScanLogItem } from '../../src/components/ScanLogItem';
import { getStaffScanLogs } from '../../src/services/scanService';
import { ScanLog } from '../../src/types';

export default function LogsScreen() {
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<'ALL' | 'ADMIT' | 'REJECT'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchLogs = useCallback(async () => {
    try {
      const data = await getStaffScanLogs();
      setLogs(data);
    } catch (err) {
      console.warn('Failed to load scan logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const filteredLogs = logs.filter((log) => {
    const matchesFilter =
      filterType === 'ALL' ||
      (filterType === 'ADMIT' && log.result === 'ADMIT') ||
      (filterType === 'REJECT' && log.result !== 'ADMIT');

    const matchesSearch =
      searchQuery.trim() === '' ||
      log.ticketCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.movieTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.staffName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const totalAdmitted = logs.filter((l) => l.result === 'ADMIT').length;
  const totalRejected = logs.filter((l) => l.result !== 'ADMIT').length;

  return (
    <SafeAreaView edges={['top']} style={styles.safeContainer}>
      <HeaderBar />

      <View style={styles.container}>
        {/* Header Title */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.screenTitle}>Scan History</Text>
            <Text style={styles.screenSubtitle}>
              GET /staff/scan-logs • Complete real-time door scanning history.
            </Text>
          </View>
        </View>

        {/* Counter Pills */}
        <View style={styles.countersRow}>
          <TouchableOpacity
            style={[styles.counterCard, filterType === 'ALL' && styles.counterCardActive]}
            onPress={() => setFilterType('ALL')}
            activeOpacity={0.8}>
            <Text style={styles.counterNumber}>{logs.length}</Text>
            <Text style={styles.counterLabel}>TOTAL SCANS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.counterCard, filterType === 'ADMIT' && styles.counterCardActiveAdmit]}
            onPress={() => setFilterType('ADMIT')}
            activeOpacity={0.8}>
            <Text style={[styles.counterNumber, { color: '#3FBF8A' }]}>{totalAdmitted}</Text>
            <Text style={styles.counterLabel}>ADMITTED</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.counterCard, filterType === 'REJECT' && styles.counterCardActiveReject]}
            onPress={() => setFilterType('REJECT')}
            activeOpacity={0.8}>
            <Text style={[styles.counterNumber, { color: '#E5584F' }]}>{totalRejected}</Text>
            <Text style={styles.counterLabel}>REJECTED</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={18} color="#80808E" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search ticket code, movie, or guard..."
            placeholderTextColor="#4A4A56"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={18} color="#80808E" />
            </TouchableOpacity>
          )}
        </View>

        {/* Scan Logs List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#D4AF6A" />
            <Text style={styles.loadingText}>Loading scan history...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredLogs}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <ScanLogItem log={item} />}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#D4AF6A"
                colors={['#D4AF6A']}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={44} color="#2A2A33" />
                <Text style={styles.emptyTitle}>No Scan Logs Found</Text>
                <Text style={styles.emptyText}>
                  {searchQuery ? 'Try adjusting your search query.' : 'Scanned tickets will appear here.'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#0B0B0F',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerRow: {
    marginBottom: 12,
  },
  screenTitle: {
    color: '#F7F4EC',
    fontSize: 22,
    fontWeight: '800',
  },
  screenSubtitle: {
    color: '#A3A3B0',
    fontSize: 13,
    marginTop: 4,
  },
  countersRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  counterCard: {
    flex: 1,
    backgroundColor: '#16161C',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A33',
  },
  counterCardActive: {
    borderColor: '#D4AF6A',
    backgroundColor: 'rgba(212, 175, 106, 0.1)',
  },
  counterCardActiveAdmit: {
    borderColor: '#3FBF8A',
    backgroundColor: 'rgba(63, 191, 138, 0.1)',
  },
  counterCardActiveReject: {
    borderColor: '#E5584F',
    backgroundColor: 'rgba(229, 88, 79, 0.1)',
  },
  counterNumber: {
    color: '#F7F4EC',
    fontSize: 18,
    fontWeight: '900',
  },
  counterLabel: {
    color: '#80808E',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16161C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A33',
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 14,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F7F4EC',
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#A3A3B0',
    fontSize: 14,
    marginTop: 10,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#A3A3B0',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptyText: {
    color: '#80808E',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
});
