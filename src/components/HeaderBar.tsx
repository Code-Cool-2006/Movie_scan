import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

interface HeaderBarProps {
  title?: string;
  showSettings?: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ title, showSettings = true }) => {
  const { user, isMockMode } = useAuth();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.badgeRow}>
          <View style={[styles.statusDot, isMockMode ? styles.dotMock : styles.dotLive]} />
          <Text style={styles.modeText}>{isMockMode ? 'DEMO / MOCK' : 'LIVE API'}</Text>
        </View>
        <Text style={styles.theatreText} numberOfLines={1}>
          {user?.assignedTheatreName || 'Cinema Security'}
        </Text>
      </View>

      <View style={styles.right}>
        {user && (
          <View style={styles.guardInfo}>
            <Text style={styles.guardName} numberOfLines={1}>
              {user.name.split(' ')[0]}
            </Text>
            <Text style={styles.guardBadge}>GUARD #{user.id}</Text>
          </View>
        )}
        {showSettings && (
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
            activeOpacity={0.7}
            accessibilityLabel="Open Settings">
            <Ionicons name="settings-sharp" size={20} color="#A3A3B0" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0B0B0F',
    borderBottomWidth: 1,
    borderBottomColor: '#16161C',
  },
  left: {
    flex: 1,
    marginRight: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  dotLive: {
    backgroundColor: '#3FBF8A',
  },
  dotMock: {
    backgroundColor: '#E0A040',
  },
  modeText: {
    color: '#A3A3B0',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  theatreText: {
    color: '#F7F4EC',
    fontSize: 15,
    fontWeight: '700',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guardInfo: {
    alignItems: 'flex-end',
  },
  guardName: {
    color: '#ECECF1',
    fontSize: 13,
    fontWeight: '600',
  },
  guardBadge: {
    color: '#80808E',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16161C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A33',
  },
});
