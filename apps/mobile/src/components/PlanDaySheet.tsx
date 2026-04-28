import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarClock, ListTodo, MoonStar, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PlanDaySheetProps {
  visible: boolean;
  selectedDate: Date;
  onClose: () => void;
  onAddScheduledTask: () => void;
  onAddUnscheduledTask: () => void;
  onAddRoutineBlock: () => void;
}

export function PlanDaySheet({
  visible,
  selectedDate,
  onClose,
  onAddScheduledTask,
  onAddUnscheduledTask,
  onAddRoutineBlock,
}: PlanDaySheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Plan Day</Text>
              <Text style={styles.subtitle}>
                {selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' })}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.primaryAction} onPress={onAddScheduledTask}>
            <CalendarClock size={20} color="#fff" />
            <View style={styles.actionContent}>
              <Text style={styles.primaryActionTitle}>Schedule a task</Text>
              <Text style={styles.primaryActionSubtitle}>Drop a new task directly into today's timeline.</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.secondaryAction} onPress={onAddRoutineBlock}>
              <MoonStar size={18} color="#A855F7" />
              <Text style={styles.secondaryActionTitle}>Add routine block</Text>
              <Text style={styles.secondaryActionSubtitle}>Sleep, work, study, meals, or custom blocks.</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryAction} onPress={onAddUnscheduledTask}>
              <ListTodo size={18} color="#fff" />
              <Text style={styles.secondaryActionTitle}>Add unscheduled task</Text>
              <Text style={styles.secondaryActionSubtitle}>Capture work first, place it later.</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#050505',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: '#1F1F1F',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: '#7A7A7A',
    marginTop: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#A855F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  actionContent: {
    flex: 1,
  },
  primaryActionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  primaryActionSubtitle: {
    color: '#F3E8FF',
    marginTop: 4,
    fontSize: 13,
  },
  secondaryActions: {
    gap: 12,
    marginTop: 14,
  },
  secondaryAction: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  secondaryActionTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  secondaryActionSubtitle: {
    color: '#8A8A8A',
    marginTop: 4,
    fontSize: 13,
  },
});
