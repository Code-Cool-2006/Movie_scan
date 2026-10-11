import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { HeaderBar } from '../../src/components/HeaderBar';
import { ResultCardModal } from '../../src/components/ResultCardModal';
import { useAuth } from '../../src/context/AuthContext';
import { getTicketDetails, scanTicket } from '../../src/services/scanService';
import { TicketDetails, ScanResult } from '../../src/types';

const PRESET_CODES = [
  { code: 'TKT-DUNE2-109', label: 'Valid Dune (2 Seats)' },
  { code: 'TKT-AVATAR-881', label: 'Valid Avatar (3 Seats)' },
  { code: 'TKT-OPPEN-442', label: 'Valid Oppenheimer' },
  { code: 'TKT-USED-999', label: 'Already Used (Reject)' },
  { code: 'TKT-WRONG-TH7', label: 'Wrong Theatre (Reject)' },
  { code: 'TKT-CANCEL-005', label: 'Cancelled (Reject)' },
];

export default function ManualEntryScreen() {
  const { user } = useAuth();
  const [ticketCode, setTicketCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [inspectedTicket, setInspectedTicket] = useState<TicketDetails | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // GET /scan/:ticketCode - Pre-check details
  const handleLookup = async (codeToUse?: string) => {
    const code = (codeToUse || ticketCode).trim().toUpperCase();
    if (!code) {
      setLookupError('Please enter a ticket code');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setLookupError(null);
    setInspectedTicket(null);

    try {
      const details = await getTicketDetails(code);
      setInspectedTicket(details);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (err: any) {
      setLookupError(err.message || 'Ticket not found');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } finally {
      setLoading(false);
    }
  };

  // POST /scan - Admit entry
  const handleAdmit = async (codeToUse?: string) => {
    const code = (codeToUse || ticketCode).trim().toUpperCase();
    if (!code || !user) return;

    Keyboard.dismiss();
    setLoading(true);

    try {
      const res = await scanTicket(code, user);
      if (Platform.OS !== 'web') {
        if (res.status === 'ADMIT') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
      setScanResult(res);
      setModalVisible(true);

      // Refresh inspected ticket details if matching
      if (inspectedTicket?.ticketCode === code && res.ticket) {
        setInspectedTicket(res.ticket);
      }
    } catch (err: any) {
      setScanResult({
        status: 'REJECT',
        rejectReason: 'NETWORK_ERROR',
        message: err.message || 'Admit request failed',
        scannedAt: new Date().toISOString(),
        scannerStaffId: user.id,
        scannerStaffName: user.name,
      });
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const selectPreset = (code: string) => {
    setTicketCode(code);
    handleLookup(code);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeContainer}>
      <HeaderBar />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* Title Section */}
        <View style={styles.headerSection}>
          <Text style={styles.screenTitle}>Manual Ticket Check-in</Text>
          <Text style={styles.screenSubtitle}>
            Lookup and validate tickets when QR code is unreadable or physically damaged.
          </Text>
        </View>

        {/* Input Card */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>TICKET CODE (e.g. TKT-DUNE2-109)</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="barcode-outline" size={24} color="#80808E" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="ENTER TICKET CODE..."
              placeholderTextColor="#4A4A56"
              value={ticketCode}
              onChangeText={(text) => {
                setTicketCode(text.toUpperCase());
                if (lookupError) setLookupError(null);
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={() => handleLookup()}
            />
            {ticketCode.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setTicketCode('');
                  setInspectedTicket(null);
                  setLookupError(null);
                }}
                style={styles.clearBtn}>
                <Ionicons name="close-circle" size={20} color="#80808E" />
              </TouchableOpacity>
            )}
          </View>

          {lookupError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#E5584F" />
              <Text style={styles.errorText}>{lookupError}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.lookupBtn]}
              onPress={() => handleLookup()}
              disabled={loading}
              activeOpacity={0.8}>
              {loading ? (
                <ActivityIndicator color="#0B0B0F" size="small" />
              ) : (
                <>
                  <Ionicons name="search" size={18} color="#0B0B0F" style={{ marginRight: 6 }} />
                  <Text style={styles.lookupBtnText}>LOOK UP TICKET</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.admitBtn]}
              onPress={() => handleAdmit()}
              disabled={loading}
              activeOpacity={0.8}>
              <Ionicons name="checkmark-done" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.admitBtnText}>ADMIT</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Test Presets */}
        <View style={styles.presetsSection}>
          <Text style={styles.presetsTitle}>TEST TICKET PRESETS</Text>
          <View style={styles.presetsWrap}>
            {PRESET_CODES.map((item) => (
              <TouchableOpacity
                key={item.code}
                style={[
                  styles.presetPill,
                  ticketCode === item.code && styles.presetPillActive,
                ]}
                onPress={() => selectPreset(item.code)}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.presetCode,
                    ticketCode === item.code && styles.presetCodeActive,
                  ]}>
                  {item.code}
                </Text>
                <Text style={styles.presetLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Inspected Ticket Preview Card */}
        {inspectedTicket && (
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View>
                <Text style={styles.previewMovie}>{inspectedTicket.movieTitle}</Text>
                <Text style={styles.previewTheatre}>{inspectedTicket.theatreName}</Text>
              </View>
              <View
                style={[
                  styles.statusTag,
                  inspectedTicket.status === 'CONFIRMED'
                    ? styles.statusTagConfirmed
                    : inspectedTicket.status === 'CHECKED_IN'
                    ? styles.statusTagUsed
                    : styles.statusTagInvalid,
                ]}>
                <Text
                  style={[
                    styles.statusTagText,
                    inspectedTicket.status === 'CONFIRMED'
                      ? styles.statusTextConfirmed
                      : inspectedTicket.status === 'CHECKED_IN'
                      ? styles.statusTextUsed
                      : styles.statusTextInvalid,
                  ]}>
                  {inspectedTicket.status}
                </Text>
              </View>
            </View>

            <View style={styles.previewGrid}>
              <View style={styles.previewGridItem}>
                <Text style={styles.gridLabel}>SCREEN</Text>
                <Text style={styles.gridVal}>{inspectedTicket.screenName}</Text>
              </View>

              <View style={styles.previewGridItem}>
                <Text style={styles.gridLabel}>SHOWTIME</Text>
                <Text style={styles.gridVal}>
                  {new Date(inspectedTicket.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              <View style={styles.previewGridItem}>
                <Text style={styles.gridLabel}>SEATS</Text>
                <Text style={[styles.gridVal, { color: '#E0A040' }]}>
                  {inspectedTicket.seats.map((s) => `${s.rowLabel}${s.seatNumber}`).join(', ')}
                </Text>
              </View>

              <View style={styles.previewGridItem}>
                <Text style={styles.gridLabel}>CUSTOMER</Text>
                <Text style={styles.gridVal} numberOfLines={1}>
                  {inspectedTicket.customerName}
                </Text>
              </View>
            </View>

            {/* Direct Admission Button inside Preview */}
            <TouchableOpacity
              style={styles.directAdmitBtn}
              onPress={() => handleAdmit(inspectedTicket.ticketCode)}
              disabled={loading}
              activeOpacity={0.85}>
              <Ionicons name="checkbox-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.directAdmitText}>CONFIRM ENTRY & ADMIT</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Result Card Modal */}
      <ResultCardModal
        visible={modalVisible}
        result={scanResult}
        onScanNext={() => {
          setModalVisible(false);
          setScanResult(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#0B0B0F',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 16,
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
    lineHeight: 18,
  },
  inputCard: {
    backgroundColor: '#16161C',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A33',
    marginBottom: 20,
  },
  inputLabel: {
    color: '#80808E',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B0B0F',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A33',
    paddingHorizontal: 12,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#F7F4EC',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  clearBtn: {
    padding: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 88, 79, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(229, 88, 79, 0.3)',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    gap: 8,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '600',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lookupBtn: {
    backgroundColor: '#D4AF6A',
  },
  lookupBtnText: {
    color: '#0B0B0F',
    fontSize: 13,
    fontWeight: '800',
  },
  admitBtn: {
    backgroundColor: '#3FBF8A',
  },
  admitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  presetsSection: {
    marginBottom: 20,
  },
  presetsTitle: {
    color: '#80808E',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  presetsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetPill: {
    backgroundColor: '#16161C',
    borderWidth: 1,
    borderColor: '#2A2A33',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: '48%',
  },
  presetPillActive: {
    borderColor: '#D4AF6A',
    backgroundColor: 'rgba(212, 175, 106, 0.1)',
  },
  presetCode: {
    color: '#D4AF6A',
    fontSize: 12,
    fontWeight: '800',
  },
  presetCodeActive: {
    color: '#E8CFA0',
  },
  presetLabel: {
    color: '#A3A3B0',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  previewCard: {
    backgroundColor: '#16161C',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D4AF6A',
    padding: 16,
    marginBottom: 20,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  previewMovie: {
    color: '#F7F4EC',
    fontSize: 18,
    fontWeight: '800',
  },
  previewTheatre: {
    color: '#A3A3B0',
    fontSize: 12,
    marginTop: 2,
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusTagConfirmed: {
    backgroundColor: 'rgba(63, 191, 138, 0.15)',
    borderColor: '#3FBF8A',
  },
  statusTagUsed: {
    backgroundColor: 'rgba(229, 88, 79, 0.15)',
    borderColor: '#E5584F',
  },
  statusTagInvalid: {
    backgroundColor: 'rgba(224, 160, 64, 0.15)',
    borderColor: '#E0A040',
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusTextConfirmed: {
    color: '#3FBF8A',
  },
  statusTextUsed: {
    color: '#E5584F',
  },
  statusTextInvalid: {
    color: '#E0A040',
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2A2A33',
  },
  previewGridItem: {
    width: '50%',
  },
  gridLabel: {
    color: '#80808E',
    fontSize: 10,
    fontWeight: '700',
  },
  gridVal: {
    color: '#ECECF1',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  directAdmitBtn: {
    flexDirection: 'row',
    backgroundColor: '#3FBF8A',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  directAdmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
