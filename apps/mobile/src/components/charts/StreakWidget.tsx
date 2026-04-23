import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame, Trophy } from 'lucide-react-native';

interface StreakWidgetProps {
  currentStreak: number;
  bestStreak: number;
}

export const StreakWidget: React.FC<StreakWidgetProps> = ({ currentStreak, bestStreak }) => {
  return (
    <View style={styles.container}>
      <View style={styles.streakCard}>
        <View style={styles.iconContainer}>
          <Flame size={32} color="#F59E0B" fill="#F59E0B" />
        </View>
        <View>
          <Text style={styles.label}>Current Streak</Text>
          <Text style={styles.value}>{currentStreak} Days</Text>
        </View>
      </View>

      <View style={styles.streakCard}>
        <View style={[styles.iconContainer, styles.bestIcon]}>
          <Trophy size={32} color="#A855F7" fill="#A855F7" />
        </View>
        <View>
          <Text style={styles.label}>Best Streak</Text>
          <Text style={styles.value}>{bestStreak} Days</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  streakCard: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bestIcon: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
  },
  label: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  value: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
