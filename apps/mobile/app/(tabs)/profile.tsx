import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../src/store/useStore';
import { SubscriptionPlan } from '@packages/shared';
import { Crown, Settings, LogOut, ChevronRight } from 'lucide-react-native';
import { NotificationsPanel } from '../../src/components/NotificationsPanel';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = useStore((state) => state.user);
  const notifications = useStore((state) => state.notifications);
  const notificationSummary = useStore((state) => state.notificationSummary);
  const logout = useStore((state) => state.logout);
  const fetchNotifications = useStore((state) => state.fetchNotifications);
  const fetchNotificationSummary = useStore((state) => state.fetchNotificationSummary);
  const markNotificationRead = useStore((state) => state.markNotificationRead);
  const isPremium = user?.subscriptionPlan !== SubscriptionPlan.FREE;
  const router = useRouter();

  useEffect(() => {
    void Promise.all([fetchNotifications(), fetchNotificationSummary()]);
  }, [fetchNotificationSummary, fetchNotifications]);

  const handleLogout = async () => {
    await logout();
    router.replace('/auth');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
    >
      <View style={styles.innerContainer}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.email[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={[styles.badge, isPremium ? styles.premiumBadge : styles.freeBadge]}>
            <Text style={styles.badgeText}>
              {isPremium ? 'PREMIUM' : 'FREE PLAN'}
            </Text>
          </View>
        </View>

        {!isPremium && (
          <TouchableOpacity style={styles.upgradeCard}>
            <Crown color="#F59E0B" size={24} />
            <View style={styles.upgradeContent}>
              <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
              <Text style={styles.upgradeSubtitle}>Get AI-managed goals and smart replanning</Text>
            </View>
            <ChevronRight color="#F59E0B" size={20} />
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Settings size={20} color="#888" />
            <Text style={styles.menuText}>Account Settings</Text>
            <ChevronRight size={20} color="#444" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => void handleLogout()}>
            <LogOut size={20} color="#EF4444" />
            <Text style={[styles.menuText, { color: '#EF4444' }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <NotificationsPanel
            notifications={notifications}
            unreadCount={notificationSummary?.unreadCount ?? 0}
            onPressNotification={(notificationId) => {
              void markNotificationRead(notificationId);
            }}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    alignItems: 'center',
  },
  innerContainer: {
    width: '100%',
    maxWidth: 600,
  },
  header: {
    alignItems: 'center',
    padding: 40,
    paddingTop: 80,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumBadge: {
    backgroundColor: '#F59E0B22',
    borderWidth: 1,
    borderColor: '#F59E0B44',
  },
  freeBadge: {
    backgroundColor: '#222',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B11',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F59E0B22',
    gap: 16,
  },
  upgradeContent: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  upgradeSubtitle: {
    fontSize: 12,
    color: '#F59E0B88',
    marginTop: 2,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 12,
    color: '#444',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#111',
    gap: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
});
