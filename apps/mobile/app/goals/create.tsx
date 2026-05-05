import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ChevronLeft, Calendar as CalendarIcon, Brain, Target } from 'lucide-react-native';
import { GoalPriority, GoalType, SubscriptionPlan } from '@packages/shared';
import { useStore } from '../../src/store/useStore';
import { getPriorityColor, getPriorityLabel } from '../../src/lib/planner';

export default function CreateGoalScreen() {
  const router = useRouter();
  const user = useStore((state) => state.user);
  const goals = useStore((state) => state.goals);
  const createGoal = useStore((state) => state.createGoal);
  const isLoading = useStore((state) => state.isLoading);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [type, setType] = useState<GoalType>(GoalType.MANUAL);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [priority, setPriority] = useState<GoalPriority>(GoalPriority.MEDIUM);

  const isPremium = user?.subscriptionPlan !== SubscriptionPlan.FREE;
  const activeAiGoalsCount = goals.filter((goal) => goal.type === GoalType.AI_MANAGED).length;
  const canCreateAiGoal = isPremium && activeAiGoalsCount < 3;

  const handleSubmit = async () => {
    if (title.trim().length < 3) {
      Alert.alert('Invalid Goal', 'Title must be at least 3 characters.');
      return;
    }

    if (type === GoalType.AI_MANAGED && !canCreateAiGoal) {
      Alert.alert(
        !isPremium ? 'Premium Feature' : 'AI Goal Limit Reached',
        !isPremium
          ? 'AI-managed goals require a premium subscription.'
          : 'You can have at most 3 active AI-managed goals.',
      );
      return;
    }

    try {
      await createGoal({
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        targetDate,
        priority,
      });
      router.replace('/(tabs)/goals');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create goal';
      Alert.alert('Create Goal Failed', message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Goal</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.innerContainer}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Goal Type</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeOption, type === GoalType.MANUAL && styles.typeOptionActive]}
                onPress={() => setType(GoalType.MANUAL)}
              >
                <Target size={18} color={type === GoalType.MANUAL ? '#fff' : '#666'} />
                <Text style={[styles.typeOptionText, type === GoalType.MANUAL && styles.typeOptionTextActive]}>Manual</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  type === GoalType.AI_MANAGED && styles.typeOptionActive,
                  !canCreateAiGoal && styles.typeOptionDisabled,
                ]}
                onPress={() => setType(GoalType.AI_MANAGED)}
                disabled={!canCreateAiGoal}
              >
                <Brain size={18} color={type === GoalType.AI_MANAGED ? '#fff' : '#666'} />
                <Text style={[styles.typeOptionText, type === GoalType.AI_MANAGED && styles.typeOptionTextActive]}>
                  AI Managed
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="What do you want to achieve?"
              placeholderTextColor="#444"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Optional context"
              placeholderTextColor="#444"
              multiline
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.section, styles.rowField]}>
              <Text style={styles.sectionLabel}>Target Date</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                <CalendarIcon size={18} color="#A855F7" />
                <Text style={styles.dateText}>{targetDate.toLocaleDateString()}</Text>
              </TouchableOpacity>
              {showDatePicker ? (
                <DateTimePicker
                  value={targetDate}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(_event, nextDate) => {
                    setShowDatePicker(Platform.OS === 'ios');

                    if (nextDate) {
                      setTargetDate(nextDate);
                    }
                  }}
                />
              ) : null}
            </View>

            <View style={[styles.section, styles.rowField]}>
              <Text style={styles.sectionLabel}>Priority</Text>
              <View style={styles.prioritySelector}>
                {[GoalPriority.HIGH, GoalPriority.MEDIUM, GoalPriority.LOW].map((option) => {
                  const color = getPriorityColor(option);

                  return (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.priorityOption,
                        priority === option && { backgroundColor: `${color}22`, borderColor: color },
                      ]}
                      onPress={() => setPriority(option)}
                    >
                      <Text style={[styles.priorityText, priority === option && { color: '#fff' }]}>
                        {getPriorityLabel(option)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
            onPress={() => void handleSubmit()}
            disabled={isLoading}
          >
            <Text style={styles.submitBtnText}>{isLoading ? 'Saving...' : 'Create Goal'}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  innerContainer: {
    width: '100%',
    maxWidth: 600,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 22,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowField: {
    flex: 1,
  },
  sectionLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 6,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
  },
  typeOptionActive: {
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#333',
  },
  typeOptionDisabled: {
    opacity: 0.45,
  },
  typeOptionText: {
    color: '#666',
    fontWeight: '600',
  },
  typeOptionTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dateText: {
    color: '#fff',
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 6,
  },
  priorityOption: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingVertical: 10,
    alignItems: 'center',
  },
  priorityText: {
    color: '#777',
    fontWeight: '700',
    fontSize: 12,
  },
  submitBtn: {
    backgroundColor: '#A855F7',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
