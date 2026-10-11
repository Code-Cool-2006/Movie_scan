import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScanResult } from '../types';

interface ResultCardModalProps {
  visible: boolean;
  result: ScanResult | null;
  onScanNext: () => void;
}

const { width } = Dimensions.get('window');

export const ResultCardModal: React.FC<ResultCardModalProps> = ({
  visible,
  result,
  onScanNext,
}) => {
  if (!result) return null;

  const isAdmit = result.status === 'ADMIT';
  const ticket = result.ticket;

  const formatSeats = () => {
    if (!ticket?.seats || ticket.seats.length === 0) return 'General';
    return ticket.seats.map((s) => `${s.rowLabel}${s.seatNumber}`).join(', ');
  };

  const formatShowTime = (iso?: string) => {
    if (!iso) return 'Today';
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onScanNext}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, isAdmit ? styles.cardAdmit : styles.cardReject]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {/* Header Status Badge */}
            <View style={styles.statusHeader}>
              <View
                style={[
                  styles.iconCircle,
                  isAdmit ? styles.iconCircleAdmit : styles.iconCircleReject,
                ]}>
                <Ionicons
                  name={isAdmit ? 'checkmark-circle' : 'close-circle'}
                  size={52}
                  color={isAdmit ? '#3FBF8A' : '#E5584F'}
                />
              </View>

              <Text
                style={[
                  styles.statusTitle,
                  isAdmit ? styles.titleAdmit : styles.titleReject,
                ]}>
                {isAdmit ? 'ADMIT ENTRY' : 'ENTRY REJECTED'}
              </Text>

              <Text style={styles.statusSubtitle}>{result.message}</Text>
            </View>

            {/* Reject Alert Box */}
            {!isAdmit && result.rejectReason && (
              <View style={styles.rejectAlertBox}>
                <Ionicons name="alert-circle-outline" size={20} color="#FCA5A5" />
                <View style={styles.rejectAlertContent}>
                  <Text style={styles.rejectAlertTitle}>
                    REASON: {result.rejectReason.replace(/_/g, ' ')}
                  </Text>
                  <Text style={styles.rejectAlertDetail}>{result.message}</Text>
                </View>
              </View>
            )}

            {/* Ticket Information Card */}
            {ticket ? (
              <View style={styles.ticketCard}>
                {/* Movie Header */}
                <View style={styles.ticketMovieRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.movieTitle}>{ticket.movieTitle}</Text>
                    <Text style={styles.theatreName}>{ticket.theatreName}</Text>
                  </View>
                  <View style={styles.attendeePill}>
                    <Text style={styles.attendeeCount}>{ticket.totalSeats}</Text>
                    <Text style={styles.attendeeLabel}>
                      {ticket.totalSeats === 1 ? 'PERSON' : 'PEOPLE'}
                    </Text>
                  </View>
                </View>

                {/* Dashed Separator */}
                <View style={styles.dashedDivider} />

                {/* Key Details Grid */}
                <View style={styles.detailsGrid}>
                  <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>SCREEN</Text>
                    <Text style={styles.gridValue}>{ticket.screenName}</Text>
                  </View>

                  <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>SHOW TIME</Text>
                    <Text style={styles.gridValue}>{formatShowTime(ticket.startTime)}</Text>
                  </View>

                  <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>SEATS</Text>
                    <Text style={[styles.gridValue, styles.seatsHighlight]}>
                      {formatSeats()}
                    </Text>
                  </View>

                  <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>CUSTOMER</Text>
                    <Text style={styles.gridValue} numberOfLines={1}>
                      {ticket.customerName}
                    </Text>
                  </View>
                </View>

                {/* Footer Code & Check-in Time */}
                <View style={styles.ticketFooter}>
                  <View>
                    <Text style={styles.ticketCodeLabel}>TICKET CODE</Text>
                    <Text style={styles.ticketCodeVal}>{ticket.ticketCode}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.ticketCodeLabel}>SCANNED AT</Text>
                    <Text style={styles.ticketTimeVal}>
                      {new Date(result.scannedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.noTicketCard}>
                <Text style={styles.noTicketText}>
                  No matching ticket details found for this QR code.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Action Button: Scan Next */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                isAdmit ? styles.btnAdmit : styles.btnReject,
              ]}
              onPress={onScanNext}
              activeOpacity={0.85}
              accessibilityLabel="Scan Next Ticket">
              <Ionicons
                name={isAdmit ? 'qr-code-outline' : 'refresh-outline'}
                size={22}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.actionBtnText}>
                {isAdmit ? 'SCAN NEXT TICKET' : 'DISMISS & SCAN NEXT'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 7, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: Math.min(width - 32, 420),
    maxHeight: '90%',
    backgroundColor: '#0B0B0F',
    borderRadius: 24,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  cardAdmit: {
    borderColor: '#3FBF8A',
  },
  cardReject: {
    borderColor: '#E5584F',
  },
  scrollContent: {
    padding: 20,
  },
  statusHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircleAdmit: {
    backgroundColor: 'rgba(63, 191, 138, 0.15)',
  },
  iconCircleReject: {
    backgroundColor: 'rgba(229, 88, 79, 0.15)',
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  titleAdmit: {
    color: '#3FBF8A',
  },
  titleReject: {
    color: '#E5584F',
  },
  statusSubtitle: {
    color: '#A3A3B0',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  rejectAlertBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(229, 88, 79, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(229, 88, 79, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
    gap: 10,
  },
  rejectAlertContent: {
    flex: 1,
  },
  rejectAlertTitle: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rejectAlertDetail: {
    color: '#FECACA',
    fontSize: 13,
    marginTop: 2,
  },
  ticketCard: {
    backgroundColor: '#16161C',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A33',
    padding: 16,
  },
  ticketMovieRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  movieTitle: {
    color: '#F7F4EC',
    fontSize: 18,
    fontWeight: '800',
  },
  theatreName: {
    color: '#A3A3B0',
    fontSize: 12,
    marginTop: 2,
  },
  attendeePill: {
    backgroundColor: '#0B0B0F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A33',
  },
  attendeeCount: {
    color: '#D4AF6A',
    fontSize: 18,
    fontWeight: '900',
  },
  attendeeLabel: {
    color: '#80808E',
    fontSize: 9,
    fontWeight: '700',
  },
  dashedDivider: {
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#2A2A33',
    marginVertical: 14,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
  },
  gridItem: {
    width: '50%',
  },
  gridLabel: {
    color: '#80808E',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  gridValue: {
    color: '#ECECF1',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  seatsHighlight: {
    color: '#E0A040',
    fontWeight: '700',
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2A33',
  },
  ticketCodeLabel: {
    color: '#80808E',
    fontSize: 9,
    fontWeight: '700',
  },
  ticketCodeVal: {
    color: '#D4AF6A',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  ticketTimeVal: {
    color: '#A3A3B0',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  noTicketCard: {
    padding: 20,
    backgroundColor: '#16161C',
    borderRadius: 12,
    alignItems: 'center',
  },
  noTicketText: {
    color: '#A3A3B0',
    fontSize: 13,
    textAlign: 'center',
  },
  bottomBar: {
    padding: 16,
    backgroundColor: '#0B0B0F',
    borderTopWidth: 1,
    borderTopColor: '#16161C',
  },
  actionBtn: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnAdmit: {
    backgroundColor: '#3FBF8A',
  },
  btnReject: {
    backgroundColor: '#E5584F',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
