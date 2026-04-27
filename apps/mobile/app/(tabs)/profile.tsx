import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/useStore';
import { SubscriptionPlan } from '@packages/shared';
import { Crown, Settings, LogOut, ChevronRight, BellRing, TestTube2 } from 'lucide-react-native';
import { NotificationsPanel } from '../../src/components/NotificationsPanel';
import { FLOATING_CTA_CLEARANCE, FloatingTabCta } from '../../src/components/FloatingTabCta';

export default function ProfileScreen() {
  const user = useStore((state) => state.user);
  const notifications = useStore((state) => state.notifications);
  const notificationSummary = useStore((state) => state.notificationSummary);
  const pushDebug = useStore((state) => state.pushDebug);
  const logout = useStore((state) => state.logout);
  const fetchNotifications = useStore((state) => state.fetchNotifications);
  const fetchNotificationSummary = useStore((state) => state.fetchNotificationSummary);
  const markNotificationRead = useStore((state) => state.markNotificationRead);
  const refreshNotifications = useStore((state) => state.refreshNotifications);
  const sendTestPush = useStore((state) => state.sendTestPush);
  const isPremium = user?.subscriptionPlan !== SubscriptionPlan.FREE;
  const router = useRouter();
  const [isSendingTestPush, setIsSendingTestPush] = useState(false);

  useEffect(() => {
    void Promise.all([fetchNotifications(), fetchNotificationSummary()]);
  }, [fetchNotificationSummary, fetchNotifications]);

  const handleLogout = async () => {
    await logout();
    router.replace('/auth');
  };

  const handleRefreshNotifications = async () => {
    try {
      await refreshNotifications();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to refresh notifications';
      Alert.alert('Refresh Failed', message);
    }
  };

  const handleSendTestPush = async () => {
    setIsSendingTestPush(true);

    try {
      const result = await sendTestPush();
      Alert.alert(
        'Test Notification Sent',
        `Devices: ${result.deviceCount}\nAttempted: ${result.pushesAttempted}\nSent: ${result.sentCount}\nInvalid tokens: ${result.invalidTokenCount}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send test notification';
      Alert.alert('Test Notification Failed', message);
    } finally {
      setIsSendingTestPush(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: FLOATING_CTA_CLEARANCE }]}
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
            <Text style={styles.sectionTitle}>Push Notifications</Text>
            <View style={styles.pushCard}>
              <View style={styles.pushCardHeader}>
                <View style={styles.pushIconWrap}>
                  <BellRing size={18} color="#C084FC" />
                </View>
                <View style={styles.pushCardContent}>
                  <Text style={styles.pushCardTitle}>System notifications are primary</Text>
                  <Text style={styles.pushCardBody}>
                    Planner reminders should arrive through Android system push, not just inside this profile page.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.testPushButton, isSendingTestPush && styles.testPushButtonDisabled]}
                onPress={() => void handleSendTestPush()}
                disabled={isSendingTestPush}
              >
                <TestTube2 size={18} color="#fff" />
                <Text style={styles.testPushButtonText}>
                  {isSendingTestPush ? 'Sending test notification...' : 'Send test notification'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Push Debug</Text>
            <View style={styles.debugCard}>
              <DebugRow label="Permission" value={pushDebug.permissionStatus} />
              <DebugRow label="Project ID" value={pushDebug.projectIdPresent ? 'present' : 'missing'} />
              <DebugRow label="Token created" value={pushDebug.tokenCreated ? 'yes' : 'no'} />
              <DebugRow label="Backend registration" value={pushDebug.registrationSucceeded ? 'successful' : 'not confirmed'} />
              <DebugRow
                label="Backend device count"
                value={pushDebug.registeredDeviceCount === null ? 'unknown' : String(pushDebug.registeredDeviceCount)}
              />
              <DebugRow label="Last issue" value={pushDebug.lastError ?? 'none'} multiline />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Backend Records</Text>
            <NotificationsPanel
              notifications={notifications}
              unreadCount={notificationSummary?.unreadCount ?? 0}
              onRefresh={() => void handleRefreshNotifications()}
              onPressNotification={(notificationId) => {
                void markNotificationRead(notificationId);
              }}
              title="Recent records"
              emptyText="No recent backend notification records."
              maxItems={4}
            />
          </View>
        </View>
      </ScrollView>
      <FloatingTabCta
        label="Test push"
        icon={<BellRing size={18} color="#fff" />}
        onPress={() => void handleSendTestPush()}
        disabled={isSendingTestPush}
      />
    </View>
  );
}

function DebugRow({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <View style={[styles.debugRow, multiline && styles.debugRowMultiline]}>
      <Text style={styles.debugLabel}>{label}</Text>
      <Text style={[styles.debugValue, multiline && styles.debugValueMultiline]}>{value}</Text>
    </View>
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
  pushCard: {
    backgroundColor: '#111',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222',
    padding: 18,
    gap: 16,
  },
  pushCardHeader: {
    flexDirection: 'row',
    gap: 14,
  },
  pushIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1026',
    borderWidth: 1,
    borderColor: '#A855F744',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pushCardContent: {
    flex: 1,
    gap: 4,
  },
  pushCardTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  pushCardBody: {
    color: '#9A9A9A',
    fontSize: 13,
    lineHeight: 19,
  },
  testPushButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#A855F7',
    borderRadius: 16,
    paddingVertical: 15,
  },
  testPushButtonDisabled: {
    opacity: 0.6,
  },
  testPushButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  debugCard: {
    backgroundColor: '#0C0C0C',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#222',
    padding: 16,
    gap: 12,
  },
  debugRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  debugRowMultiline: {
    alignItems: 'flex-start',
  },
  debugLabel: {
    color: '#7A7A7A',
    fontSize: 13,
    fontWeight: '600',
  },
  debugValue: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  debugValueMultiline: {
    maxWidth: '65%',
  },
});
