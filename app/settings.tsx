import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../src/context/AuthContext';
import { resetMockData } from '../src/services/scanService';
import { MOCK_STAFF_USERS } from '../src/services/mockData';

export default function SettingsScreen() {
  const router = useRouter();
  const {
    user,
    isMockMode,
    baseUrl,
    setBaseUrlConfig,
    toggleMockMode,
    loginAsDemoGuard,
    logout,
  } = useAuth();

  const [inputUrl, setInputUrl] = useState<string>(baseUrl);
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);

  const handleSaveUrl = async () => {
    await setBaseUrlConfig(inputUrl.trim());
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert('Saved', 'API Base URL updated successfully.');
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${inputUrl.replace(/\/$/, '')}/api/movies`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        setConnectionStatus('Connected successfully! Server is online.');
      } else {
        setConnectionStatus(`Server reachable, returned HTTP ${res.status}`);
      }
    } catch (err: any) {
      setConnectionStatus(`Connection failed: ${err.message || 'Server unreachable'}`);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleResetData = () => {
    resetMockData();
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert('Reset Complete', 'Mock tickets, shows, and scan logs have been restored to initial state.');
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#F7F4EC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Guard App Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Guard Profile Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>ACTIVE GUARD PROFILE</Text>
          <View style={styles.profileRow}>
            <View style={styles.avatarCircle}>
              <Ionicons name="shield-checkmark" size={28} color="#D4AF6A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{user?.name || 'Security Staff'}</Text>
              <Text style={styles.profileRole}>
                Role: <Text style={{ color: '#D4AF6A' }}>{user?.role.toUpperCase()}</Text> • ID #{user?.id}
              </Text>
              <Text style={styles.profileTheatre}>{user?.assignedTheatreName}</Text>
            </View>
          </View>

          {/* Quick Profile Switcher */}
          <View style={styles.switchProfileSection}>
            <Text style={styles.switchProfileLabel}>Switch Demo Guard:</Text>
            <View style={styles.guardButtonsRow}>
              {MOCK_STAFF_USERS.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={[
                    styles.guardChoiceBtn,
                    user?.id === g.id && styles.guardChoiceBtnActive,
                  ]}
                  onPress={() => loginAsDemoGuard(g.id)}
                  activeOpacity={0.8}>
                  <Text
                    style={[
                      styles.guardChoiceText,
                      user?.id === g.id && styles.guardChoiceTextActive,
                    ]}>
                    {g.name.split(' ')[0]} (#{g.id})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Backend & Connectivity Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>API & SERVER CONNECTIVITY</Text>

          {/* Mock Mode Switch */}
          <View style={styles.switchRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.switchTitle}>Mock / Demo Engine</Text>
              <Text style={styles.switchSubtitle}>
                Simulates tickets, scanning, duplicate rejection, and logs locally with zero backend dependencies.
              </Text>
            </View>
            <Switch
              value={isMockMode}
              onValueChange={(val) => toggleMockMode(val)}
              trackColor={{ false: '#2A2A33', true: '#A8864A' }}
              thumbColor={isMockMode ? '#D4AF6A' : '#A3A3B0'}
            />
          </View>

          <View style={styles.divider} />

          {/* Live Base URL */}
          <Text style={styles.inputLabel}>LIVE BACKEND BASE URL</Text>
          <View style={styles.urlInputRow}>
            <TextInput
              style={styles.urlInput}
              value={inputUrl}
              onChangeText={setInputUrl}
              placeholder="http://192.168.1.5:5000"
              placeholderTextColor="#4A4A56"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.saveUrlBtn} onPress={handleSaveUrl}>
              <Text style={styles.saveUrlBtnText}>Save</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.testBtn}
            onPress={handleTestConnection}
            disabled={testingConnection}>
            <Ionicons name="flash-outline" size={16} color="#D4AF6A" style={{ marginRight: 6 }} />
            <Text style={styles.testBtnText}>
              {testingConnection ? 'Testing Connection...' : 'Ping Live Backend'}
            </Text>
          </TouchableOpacity>

          {connectionStatus && (
            <View style={styles.statusBox}>
              <Text style={styles.statusBoxText}>{connectionStatus}</Text>
            </View>
          )}
        </View>

        {/* Maintenance Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>MAINTENANCE & TESTING</Text>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={handleResetData}
            activeOpacity={0.8}>
            <Ionicons name="refresh-circle-outline" size={20} color="#E0A040" style={{ marginRight: 8 }} />
            <Text style={styles.resetBtnText}>Restore Initial Demo Data</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={async () => {
            await logout();
            router.replace('/(auth)/login');
          }}
          activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color="#E5584F" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Log Out Guard Session</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#0B0B0F',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#16161C',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#16161C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#F7F4EC',
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#16161C',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A33',
    marginBottom: 16,
  },
  cardSectionTitle: {
    color: '#80808E',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(212, 175, 106, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#D4AF6A',
  },
  profileName: {
    color: '#F7F4EC',
    fontSize: 18,
    fontWeight: '800',
  },
  profileRole: {
    color: '#A3A3B0',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  profileTheatre: {
    color: '#D6D6DE',
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  switchProfileSection: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#2A2A33',
  },
  switchProfileLabel: {
    color: '#A3A3B0',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  guardButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  guardChoiceBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#0B0B0F',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A33',
  },
  guardChoiceBtnActive: {
    borderColor: '#D4AF6A',
    backgroundColor: 'rgba(212, 175, 106, 0.1)',
  },
  guardChoiceText: {
    color: '#A3A3B0',
    fontSize: 13,
    fontWeight: '700',
  },
  guardChoiceTextActive: {
    color: '#D4AF6A',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchTitle: {
    color: '#F7F4EC',
    fontSize: 15,
    fontWeight: '700',
  },
  switchSubtitle: {
    color: '#A3A3B0',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2A33',
    marginVertical: 14,
  },
  inputLabel: {
    color: '#80808E',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  urlInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  urlInput: {
    flex: 1,
    backgroundColor: '#0B0B0F',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    color: '#F7F4EC',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2A2A33',
  },
  saveUrlBtn: {
    backgroundColor: '#D4AF6A',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveUrlBtnText: {
    color: '#0B0B0F',
    fontSize: 13,
    fontWeight: '800',
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 175, 106, 0.1)',
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 106, 0.3)',
  },
  testBtnText: {
    color: '#D4AF6A',
    fontSize: 13,
    fontWeight: '700',
  },
  statusBox: {
    backgroundColor: '#0B0B0F',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#2A2A33',
  },
  statusBoxText: {
    color: '#A3A3B0',
    fontSize: 12,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(224, 160, 64, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(224, 160, 64, 0.3)',
  },
  resetBtnText: {
    color: '#E0A040',
    fontSize: 14,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229, 88, 79, 0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(229, 88, 79, 0.3)',
    marginTop: 10,
  },
  logoutBtnText: {
    color: '#E5584F',
    fontSize: 14,
    fontWeight: '800',
  },
});
