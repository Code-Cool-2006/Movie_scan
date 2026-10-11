import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScanLog } from '../types';

interface ScanLogItemProps {
  log: ScanLog;
}

export const ScanLogItem: React.FC<ScanLogItemProps> = ({ log }) => {
  const isAdmit = log.result === 'ADMIT';

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getReasonBadge = () => {
    switch (log.result) {
      case 'ADMIT':
        return { label: 'ADMIT', color: '#3FBF8A', bg: 'rgba(63, 191, 138, 0.15)' };
      case 'REJECT_USED':
        return { label: 'ALREADY USED', color: '#E5584F', bg: 'rgba(229, 88, 79, 0.15)' };
      case 'REJECT_WRONG_THEATRE':
        return { label: 'WRONG THEATRE', color: '#E0A040', bg: 'rgba(224, 160, 64, 0.15)' };
      case 'REJECT_CANCELLED':
        return { label: 'CANCELLED', color: '#E5584F', bg: 'rgba(229, 88, 79, 0.15)' };
      case 'REJECT_EXPIRED':
        return { label: 'EXPIRED', color: '#E5584F', bg: 'rgba(229, 88, 79, 0.15)' };
      default:
        return { label: 'INVALID', color: '#E5584F', bg: 'rgba(229, 88, 79, 0.15)' };
    }
  };

  const badge = getReasonBadge();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Ionicons
            name={isAdmit ? 'checkmark-circle' : 'alert-circle'}
            size={14}
            color={badge.color}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
        </View>

        <Text style={styles.timestamp}>{formatTime(log.scannedAt)}</Text>
      </View>

      <View style={styles.contentRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.ticketCode}>{log.ticketCode}</Text>
          <Text style={styles.movieTitle} numberOfLines={1}>
            {log.movieTitle} • {log.screenName}
          </Text>
        </View>

        <View style={styles.seatsPill}>
          <Text style={styles.seatsText}>{log.seatsText}</Text>
        </View>
      </View>

      {log.reasonText && !isAdmit && (
        <View style={styles.reasonBox}>
          <Text style={styles.reasonText} numberOfLines={2}>
            {log.reasonText}
          </Text>
        </View>
      )}

      <View style={styles.footerRow}>
        <Text style={styles.guardLabel}>
          Scanned by: <Text style={{ color: '#ECECF1' }}>{log.staffName}</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#16161C',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2A2A33',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timestamp: {
    color: '#80808E',
    fontSize: 12,
    fontWeight: '600',
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketCode: {
    color: '#D4AF6A',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  movieTitle: {
    color: '#D6D6DE',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  seatsPill: {
    backgroundColor: '#0B0B0F',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A33',
  },
  seatsText: {
    color: '#E0A040',
    fontSize: 12,
    fontWeight: '700',
  },
  reasonBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2A2A33',
  },
  reasonText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '500',
  },
  footerRow: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(42, 42, 51, 0.5)',
  },
  guardLabel: {
    color: '#80808E',
    fontSize: 11,
    fontWeight: '500',
  },
});
