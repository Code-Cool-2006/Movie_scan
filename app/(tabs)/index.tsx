import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { HeaderBar } from '../../src/components/HeaderBar';
import { ScannerOverlay } from '../../src/components/ScannerOverlay';
import { ResultCardModal } from '../../src/components/ResultCardModal';
import { useAuth } from '../../src/context/AuthContext';
import { scanTicket } from '../../src/services/scanService';
import { ScanResult } from '../../src/types';

export default function ScannerScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();

  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [busy, setBusy] = useState<boolean>(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(true);

  // Resume camera when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setIsActive(true);
      return () => {
        setIsActive(false);
        setTorchOn(false);
      };
    }, [])
  );

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (busy || modalVisible || !isActive) return;
    setBusy(true);

    try {
      if (!user) {
        throw new Error('No staff guard logged in');
      }

      // Execute POST /scan validation
      const scanRes = await scanTicket(data, user);

      // Trigger tactile haptics
      if (Platform.OS !== 'web') {
        if (scanRes.status === 'ADMIT') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }

      setResult(scanRes);
      setModalVisible(true);
    } catch (err: any) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setResult({
        status: 'REJECT',
        rejectReason: 'NETWORK_ERROR',
        message: err.message || 'Scan error occurred',
        scannedAt: new Date().toISOString(),
        scannerStaffId: user?.id || 0,
        scannerStaffName: user?.name || 'Staff',
      });
      setModalVisible(true);
    }
  };

  const handleScanNext = () => {
    setModalVisible(false);
    setResult(null);
    // Small timeout to allow modal animation to finish before re-enabling camera listener
    setTimeout(() => {
      setBusy(false);
    }, 400);
  };

  if (!permission) {
    return (
      <SafeAreaView edges={['top']} style={styles.darkContainer}>
        <HeaderBar />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#D4AF6A" />
          <Text style={styles.statusText}>Initializing Camera System...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView edges={['top']} style={styles.darkContainer}>
        <HeaderBar />
        <View style={styles.centerContainer}>
          <View style={styles.permissionIconCircle}>
            <Ionicons name="camera-outline" size={48} color="#E0A040" />
          </View>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionDesc}>
            Camera access is needed to scan ticket QR codes at the door.
          </Text>
          <TouchableOpacity
            style={styles.grantBtn}
            onPress={requestPermission}
            activeOpacity={0.8}>
            <Text style={styles.grantBtnText}>Grant Camera Permission</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.manualFallbackBtn}
            onPress={() => router.push('/(tabs)/manual')}
            activeOpacity={0.8}>
            <Text style={styles.manualFallbackText}>Or Enter Ticket Code Manually</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.darkContainer}>
      <SafeAreaView edges={['top']} style={styles.safeHeaderArea}>
        <HeaderBar />
      </SafeAreaView>

      <View style={styles.cameraWrapper}>
        {isActive ? (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing={facing}
            enableTorch={torchOn}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={busy || modalVisible ? undefined : handleBarcodeScanned}>
            <ScannerOverlay
              torchOn={torchOn}
              onToggleTorch={() => setTorchOn(!torchOn)}
              onFlipCamera={() => setFacing(facing === 'back' ? 'front' : 'back')}
              isScanning={!busy && !modalVisible}
            />
          </CameraView>
        ) : (
          <View style={styles.cameraStandby}>
            <Text style={styles.statusText}>Scanner Paused</Text>
          </View>
        )}

        {/* Floating Quick Action Bar */}
        <View style={styles.floatingActions}>
          <TouchableOpacity
            style={styles.quickManualBtn}
            onPress={() => router.push('/(tabs)/manual')}
            activeOpacity={0.85}>
            <Ionicons name="keypad-outline" size={20} color="#F7F4EC" style={{ marginRight: 6 }} />
            <Text style={styles.quickManualText}>Manual Code Entry</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Result Card Modal */}
      <ResultCardModal
        visible={modalVisible}
        result={result}
        onScanNext={handleScanNext}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  darkContainer: {
    flex: 1,
    backgroundColor: '#0B0B0F',
  },
  safeHeaderArea: {
    backgroundColor: '#0B0B0F',
    zIndex: 20,
  },
  cameraWrapper: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#050507',
  },
  cameraStandby: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  statusText: {
    color: '#A3A3B0',
    fontSize: 15,
    marginTop: 12,
    fontWeight: '500',
  },
  permissionIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(224, 160, 64, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(224, 160, 64, 0.3)',
  },
  permissionTitle: {
    color: '#F7F4EC',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  permissionDesc: {
    color: '#A3A3B0',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  grantBtn: {
    backgroundColor: '#D4AF6A',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  grantBtnText: {
    color: '#0B0B0F',
    fontSize: 16,
    fontWeight: '800',
  },
  manualFallbackBtn: {
    marginTop: 16,
    paddingVertical: 12,
  },
  manualFallbackText: {
    color: '#A3A3B0',
    fontSize: 14,
    fontWeight: '600',
  },
  floatingActions: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 30,
  },
  quickManualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 11, 15, 0.9)',
    borderWidth: 1,
    borderColor: '#2A2A33',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  quickManualText: {
    color: '#F7F4EC',
    fontSize: 14,
    fontWeight: '700',
  },
});
