import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const FRAME_SIZE = width * 0.72;

interface ScannerOverlayProps {
  torchOn: boolean;
  onToggleTorch: () => void;
  onFlipCamera?: () => void;
  isScanning: boolean;
}

export const ScannerOverlay: React.FC<ScannerOverlayProps> = ({
  torchOn,
  onToggleTorch,
  onFlipCamera,
  isScanning,
}) => {
  const laserAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    if (isScanning) {
      animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: FRAME_SIZE - 4,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ])
      );
      animLoop.start();
    } else {
      laserAnim.setValue(0);
    }

    return () => {
      animLoop?.stop();
    };
  }, [isScanning, laserAnim]);

  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      {/* Top Dimmed Area */}
      <View style={styles.topDimmed}>
        <View style={styles.pillGuide}>
          <Text style={styles.pillGuideText}>Align QR Ticket inside frame</Text>
        </View>
      </View>

      {/* Middle Row with Frame */}
      <View style={styles.middleRow} pointerEvents="box-none">
        <View style={styles.sideDimmed} />

        {/* Focus Box */}
        <View style={styles.frame}>
          {/* 4 Corner Markers */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          {/* Animated Laser Scanning Line */}
          {isScanning && (
            <Animated.View
              style={[
                styles.laserLine,
                {
                  transform: [{ translateY: laserAnim }],
                },
              ]}
            />
          )}
        </View>

        <View style={styles.sideDimmed} />
      </View>

      {/* Bottom Dimmed Area */}
      <View style={styles.bottomDimmed}>
        {/* Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.controlBtn, torchOn && styles.controlBtnActive]}
            onPress={onToggleTorch}
            activeOpacity={0.8}
            accessibilityLabel="Toggle Torch">
            <Ionicons
              name={torchOn ? 'flash' : 'flash-outline'}
              size={24}
              color={torchOn ? '#E0A040' : '#F7F4EC'}
            />
            <Text style={[styles.controlText, torchOn && styles.controlTextActive]}>
              {torchOn ? 'Torch On' : 'Torch Off'}
            </Text>
          </TouchableOpacity>

          {onFlipCamera && (
            <TouchableOpacity
              style={styles.controlBtn}
              onPress={onFlipCamera}
              activeOpacity={0.8}
              accessibilityLabel="Switch Camera">
              <Ionicons name="camera-reverse-outline" size={24} color="#F7F4EC" />
              <Text style={styles.controlText}>Flip</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  topDimmed: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 7, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
  },
  pillGuide: {
    backgroundColor: 'rgba(22, 22, 28, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pillGuideText: {
    color: '#ECECF1',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  middleRow: {
    flexDirection: 'row',
    height: FRAME_SIZE,
  },
  sideDimmed: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 7, 0.65)',
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderColor: '#D4AF6A',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 6,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 6,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 6,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 6,
  },
  laserLine: {
    position: 'absolute',
    top: 0,
    left: 4,
    right: 4,
    height: 3,
    backgroundColor: '#D4AF6A',
    borderRadius: 2,
    shadowColor: '#D4AF6A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },
  bottomDimmed: {
    flex: 1.3,
    backgroundColor: 'rgba(5, 5, 7, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  controlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: 'rgba(22, 22, 28, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    minWidth: 88,
  },
  controlBtnActive: {
    backgroundColor: 'rgba(224, 160, 64, 0.2)',
    borderColor: '#E0A040',
  },
  controlText: {
    color: '#A3A3B0',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  controlTextActive: {
    color: '#E0A040',
  },
});
