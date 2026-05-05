import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SubscriptionPlan } from '@packages/shared';
import { Crown, LogOut, Settings } from 'lucide-react-native';
import { useStore } from '../../src/store/useStore';

export default function ProfileScreen() {
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);
  const router = useRouter();
  const isPremium = user?.subscriptionPlan !== SubscriptionPlan.FREE;

  const handleLogout = async () => {
    await logout();
    router.replace('/auth');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.email[0]?.toUpperCase()}</Text>
          </View>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={[styles.badge, isPremium ? styles.premiumBadge : styles.freeBadge]}>
            <Text style={styles.badgeText}>{isPremium ? 'PREMIUM' : 'FREE PLAN'}</Text>
          </View>
        </View>

        {!isPremium ? (
          <View style={styles.upgradeCard}>
            <Crown color="#F59E0B" size={22} />
            <View style={styles.upgradeContent}>
              <Text style={styles.upgradeTitle}>Premium unlocks AI-managed goals</Text>
              <Text style={styles.upgradeSubtitle}>Upgrade when you need AI planning and smarter replanning.</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Settings size={20} color="#888" />
            <Text style={styles.menuText}>App settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => void handleLogout()}>
            <LogOut size={20} color="#EF4444" />
            <Text style={[styles.menuText, styles.dangerText]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 20,
    paddingTop: 80,
    gap: 24,
  },
  header: {
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  email: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  premiumBadge: {
    backgroundColor: '#F59E0B22',
    borderWidth: 1,
    borderColor: '#F59E0B44',
  },
  freeBadge: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#222',
  },
  badgeText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  upgradeCard: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    backgroundColor: '#111',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#222',
    padding: 18,
  },
  upgradeContent: {
    flex: 1,
  },
  upgradeTitle: {
    color: '#F59E0B',
    fontWeight: '700',
  },
  upgradeSubtitle: {
    color: '#8A8A8A',
    marginTop: 4,
    lineHeight: 19,
  },
  section: {
    backgroundColor: '#0B0B0B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    padding: 18,
  },
  sectionTitle: {
    color: '#666',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#151515',
  },
  menuText: {
    color: '#fff',
    fontSize: 16,
  },
  dangerText: {
    color: '#EF4444',
  },
});
