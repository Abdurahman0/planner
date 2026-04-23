import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Goal, GoalType } from '@packages/shared';
import { Sparkles, Calendar } from 'lucide-react-native';

interface GoalCardProps {
  goal: Goal;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal }) => {
  const isAi = goal.type === GoalType.AI_MANAGED;
  const router = useRouter();

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push(`/goals/${goal.id}`)}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{goal.title}</Text>
          {isAi && <Sparkles size={16} color="#A855F7" />}
        </View>
        
        <View style={styles.footer}>
          <View style={styles.meta}>
            <Calendar size={12} color="#888" />
            <Text style={styles.dateText}>
              Target: {new Date(goal.targetDate).toLocaleDateString()}
            </Text>
          </View>
          
          <View style={styles.projection}>
            <Text style={styles.projectionLabel}>Projected:</Text>
            <Text style={[
              styles.projectionDate,
              goal.projectedDate > goal.targetDate ? styles.delayed : styles.onTrack
            ]}>
              {new Date(goal.projectedDate).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  content: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#888',
  },
  projection: {
    alignItems: 'flex-end',
  },
  projectionLabel: {
    fontSize: 10,
    color: '#888',
    textTransform: 'uppercase',
  },
  projectionDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  delayed: {
    color: '#EF4444',
  },
  onTrack: {
    color: '#10B981',
  },
});
