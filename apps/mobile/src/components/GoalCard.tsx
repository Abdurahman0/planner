import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Goal, GoalType } from '@packages/shared';
import { Sparkles, Calendar } from 'lucide-react-native';
import { getPriorityColor, getPriorityLabel } from '../lib/planner';

interface GoalCardProps {
  goal: Goal;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal }) => {
  const isAi = goal.type === GoalType.AI_MANAGED;
  const router = useRouter();
  const priorityColor = getPriorityColor(goal.priority);
  const isBehind = goal.projectedDate > goal.targetDate;

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push(`/goals/${goal.id}`)}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{goal.title}</Text>
          <View style={styles.headerBadges}>
            <View style={[styles.priorityPill, { backgroundColor: `${priorityColor}22`, borderColor: `${priorityColor}55` }]}>
              <Text style={[styles.priorityPillText, { color: priorityColor }]}>
                {getPriorityLabel(goal.priority)}
              </Text>
            </View>
            {isAi && <Sparkles size={16} color="#A855F7" />}
          </View>
        </View>
        
        <View style={styles.footer}>
          <View style={styles.meta}>
            <Calendar size={12} color="#888" />
            <Text style={styles.dateText}>
              Target: {new Date(goal.targetDate).toLocaleDateString()}
            </Text>
          </View>
          
          <View style={styles.projection}>
            <Text style={styles.projectionLabel}>{isBehind ? 'Behind' : 'On track'}</Text>
            <Text style={[
              styles.projectionDate,
              isBehind ? styles.delayed : styles.onTrack
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
    gap: 12,
  },
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  priorityPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priorityPillText: {
    fontSize: 11,
    fontWeight: '700',
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
