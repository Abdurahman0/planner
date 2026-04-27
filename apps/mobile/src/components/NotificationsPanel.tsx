import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Notification } from '@packages/shared';

interface NotificationsPanelProps {
  notifications: Notification[];
  unreadCount: number;
  onPressNotification: (notificationId: string) => void;
  onRefresh?: () => void;
  title?: string;
  emptyText?: string;
  maxItems?: number;
}

export function NotificationsPanel({
  notifications,
  unreadCount,
  onPressNotification,
  onRefresh,
  title = 'Notifications',
  emptyText = 'No notifications yet.',
  maxItems = 6,
}: NotificationsPanelProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.headerActions}>
          {onRefresh ? (
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          ) : null}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        </View>
      </View>

      {notifications.length === 0 ? (
        <Text style={styles.emptyText}>{emptyText}</Text>
      ) : (
        notifications.slice(0, maxItems).map((notification) => (
          <TouchableOpacity
            key={notification.id}
            style={[
              styles.item,
              notification.status === 'unread' ? styles.unreadItem : undefined,
            ]}
            onPress={() => onPressNotification(notification.id)}
          >
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>{notification.title}</Text>
              <Text style={styles.itemDate}>
                {notification.createdAt.toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.itemBody}>{notification.body}</Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222',
    padding: 20,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#1A1026',
    borderWidth: 1,
    borderColor: '#A855F744',
  },
  refreshButtonText: {
    color: '#C084FC',
    fontSize: 12,
    fontWeight: '700',
  },
  badge: {
    minWidth: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#A855F7',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
  },
  item: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#1A1A1A',
    gap: 8,
  },
  unreadItem: {
    borderColor: '#A855F744',
    backgroundColor: '#130C1D',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  itemDate: {
    color: '#777',
    fontSize: 12,
  },
  itemBody: {
    color: '#AAA',
    fontSize: 13,
    lineHeight: 18,
  },
});
