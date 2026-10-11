import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeaderBar } from '../../src/components/HeaderBar';
import { ShowProgressCard } from '../../src/components/ShowProgressCard';
import { getTodayShows } from '../../src/services/scanService';
import { ShowSummary } from '../../src/types';

export default function ShowsScreen() {
  const [shows, setShows] = useState<ShowSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchShows = useCallback(async () => {
    try {
      const data = await getTodayShows();
      setShows(data);
    } catch (err) {
      console.warn('Failed to load shows:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchShows();
  }, [fetchShows]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchShows();
  };

  const totalBooked = shows.reduce((sum, s) => sum + s.bookedSeats, 0);
  const totalAdmitted = shows.reduce((sum, s) => sum + s.admittedSeats, 0);
  const overallPercentage = totalBooked > 0 ? Math.round((totalAdmitted / totalBooked) * 100) : 0;

  return (
    <SafeAreaView edges={['top']} style={styles.safeContainer}>
      <HeaderBar />

      <View style={styles.container}>
        {/* Screen Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.screenTitle}>{"Today's Door Attendance"}</Text>
            <Text style={styles.screenSubtitle}>
              {"Live check-in progress across all screens for today's shows."}
            </Text>
          </View>
        </View>

        {/* Aggregate Overview Card */}
        <View style={styles.summaryBanner}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{shows.length}</Text>
            <Text style={styles.summaryLabel}>TOTAL SHOWS</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{totalBooked}</Text>
            <Text style={styles.summaryLabel}>BOOKED GUESTS</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: '#3FBF8A' }]}>{totalAdmitted}</Text>
            <Text style={styles.summaryLabel}>CHECKED IN</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: '#D4AF6A' }]}>{overallPercentage}%</Text>
            <Text style={styles.summaryLabel}>OVERALL</Text>
          </View>
        </View>

        {/* Shows List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#D4AF6A" />
            <Text style={styles.loadingText}>{"Loading today's schedules..."}</Text>
          </View>
        ) : (
          <FlatList
            data={shows}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <ShowProgressCard show={item} />}
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
                <Text style={styles.emptyText}>No shows scheduled for today.</Text>
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
    marginBottom: 14,
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
  summaryBanner: {
    flexDirection: 'row',
    backgroundColor: '#16161C',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#2A2A33',
    marginBottom: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    color: '#F7F4EC',
    fontSize: 18,
    fontWeight: '900',
  },
  summaryLabel: {
    color: '#80808E',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#2A2A33',
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
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#80808E',
    fontSize: 14,
  },
});
