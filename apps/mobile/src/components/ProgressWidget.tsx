import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { motion } from 'motion/react';

export const ProgressWidget: React.FC = () => {
  // Mock data for now
  const completionRate = 0.65;
  const streak = 5;

  return (
    <View style={styles.container}>
      <View style={styles.stat}>
        <Text style={styles.label}>Today's Progress</Text>
        <Text style={styles.value}>{Math.round(completionRate * 100)}%</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${completionRate * 100}%` }]} />
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.stat}>
        <Text style={styles.label}>Current Streak</Text>
        <View style={styles.streakContainer}>
          <Text style={styles.value}>{streak}</Text>
          <Text style={styles.unit}>days</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#111',
    margin: 20,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  stat: {
    flex: 1,
    gap: 8,
  },
  label: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#222',
    borderRadius: 2,
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#A855F7',
    borderRadius: 2,
  },
  divider: {
    width: 1,
    backgroundColor: '#222',
    marginHorizontal: 20,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  unit: {
    fontSize: 14,
    color: '#888',
  },
});
