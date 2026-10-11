import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../src/context/AuthContext';
import { MOCK_STAFF_USERS } from '../../src/services/mockData';

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginAsDemoGuard } = useAuth();

  const [email, setEmail] = useState<string>('alice@cinema.com');
  const [password, setPassword] = useState<string>('guard123');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim()) {
      setErrorMsg('Please enter your staff email');
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    try {
      await login(email, password);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.replace('/(tabs)');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (staffId: number) => {
    setLoading(true);
    try {
      await loginAsDemoGuard(staffId);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {/* Header & Logo */}
          <View style={styles.headerArea}>
            <View style={styles.logoBadge}>
              <Ionicons name="scan-circle" size={56} color="#D4AF6A" />
            </View>
            <Text style={styles.appTitle}>CINEMA DOOR SCAN</Text>
            <Text style={styles.appSubtitle}>Staff Ticket Verification & Access Control</Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>SECURITY STAFF LOGIN</Text>

            {errorMsg && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#E5584F" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>STAFF EMAIL / ID</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#80808E" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="alice@cinema.com"
                  placeholderTextColor="#4A4A56"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#80808E"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#4A4A56"
                  secureTextEntry
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}>
              {loading ? (
                <ActivityIndicator color="#0B0B0F" />
              ) : (
                <Text style={styles.loginBtnText}>SIGN IN TO GUARD APP</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Quick Demo Staff Logins */}
          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>QUICK DEMO GUARD LOGIN</Text>
            <View style={styles.demoRow}>
              {MOCK_STAFF_USERS.map((guard) => (
                <TouchableOpacity
                  key={guard.id}
                  style={styles.demoGuardBtn}
                  onPress={() => handleQuickDemo(guard.id)}
                  activeOpacity={0.8}>
                  <Ionicons name="shield-checkmark" size={18} color="#D4AF6A" style={{ marginRight: 6 }} />
                  <Text style={styles.demoGuardText}>{guard.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#0B0B0F',
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    flexGrow: 1,
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(212, 175, 106, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 106, 0.3)',
    marginBottom: 16,
  },
  appTitle: {
    color: '#F7F4EC',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  appSubtitle: {
    color: '#A3A3B0',
    fontSize: 13,
    marginTop: 6,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#16161C',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A33',
  },
  cardTitle: {
    color: '#F7F4EC',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 88, 79, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(229, 88, 79, 0.3)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    color: '#80808E',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B0B0F',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A33',
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#F7F4EC',
    fontSize: 15,
  },
  loginBtn: {
    backgroundColor: '#D4AF6A',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  loginBtnText: {
    color: '#0B0B0F',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  demoSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  demoTitle: {
    color: '#80808E',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  demoRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  demoGuardBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16161C',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A33',
  },
  demoGuardText: {
    color: '#ECECF1',
    fontSize: 13,
    fontWeight: '700',
  },
});
