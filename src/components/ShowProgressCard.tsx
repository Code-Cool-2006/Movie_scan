import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShowSummary } from '../types';

interface ShowProgressCardProps {
  show: ShowSummary;
}

export const ShowProgressCard: React.FC<ShowProgressCardProps> = ({ show }) => {
  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const percentage = show.bookedSeats > 0
    ? Math.round((show.admittedSeats / show.bookedSeats) * 100)
    : 0;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.movieTitle}>{show.movieTitle}</Text>
          <Text style={styles.screenText}>{show.screenName}</Text>
        </View>

        <View style={styles.timeBadge}>
          <Text style={styles.timeText}>{formatTime(show.startTime)}</Text>
          {show.isCurrentWindow && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>ENTRY OPEN</Text>
            </View>
          )}
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.admittedLabel}>
            <Text style={styles.admittedCount}>{show.admittedSeats}</Text> / {show.bookedSeats} Admitted
          </Text>
          <Text style={styles.percentageText}>{percentage}%</Text>
        </View>

        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.min(100, percentage)}%` },
              percentage === 100 ? styles.barFull : styles.barActive,
            ]}
          />
        </View>
      </View>

      {/* Capacity Breakdown */}
      <View style={styles.footerRow}>
        <Text style={styles.capacityMeta}>
          Total Screen Capacity: <Text style={{ color: '#ECECF1' }}>{show.totalSeats}</Text>
        </Text>
        <Text style={styles.capacityMeta}>
          Unadmitted: <Text style={{ color: '#E0A040' }}>{Math.max(0, show.bookedSeats - show.admittedSeats)}</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#16161C',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A33',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  movieTitle: {
    color: '#F7F4EC',
    fontSize: 16,
    fontWeight: '800',
  },
  screenText: {
    color: '#A3A3B0',
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  timeBadge: {
    alignItems: 'flex-end',
  },
  timeText: {
    color: '#D4AF6A',
    fontSize: 15,
    fontWeight: '800',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(63, 191, 138, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(63, 191, 138, 0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3FBF8A',
    marginRight: 4,
  },
  liveText: {
    color: '#3FBF8A',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  admittedLabel: {
    color: '#A3A3B0',
    fontSize: 13,
    fontWeight: '600',
  },
  admittedCount: {
    color: '#3FBF8A',
    fontWeight: '800',
  },
  percentageText: {
    color: '#D4AF6A',
    fontSize: 13,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#0B0B0F',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  barActive: {
    backgroundColor: '#D4AF6A',
  },
  barFull: {
    backgroundColor: '#3FBF8A',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2A2A33',
  },
  capacityMeta: {
    color: '#80808E',
    fontSize: 11,
    fontWeight: '600',
  },
});
