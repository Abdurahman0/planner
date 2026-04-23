import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/useStore';
import { GoalType, Priority, GoalStatus, SubscriptionPlan, Goal } from '@packages/shared';
import { ChevronLeft, Calendar as CalendarIcon, Brain, Target, Info, AlertCircle } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  targetDate: z.date().min(new Date(), 'Target date must be in the future'),
  priority: z.nativeEnum(Priority),
  type: z.nativeEnum(GoalType),
  // AI specific fields
  availableTime: z.string().optional(),
  difficulty: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CreateGoalScreen() {
  const router = useRouter();
  const { user, goals, addGoal } = useStore();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isPremium = user?.subscriptionPlan !== SubscriptionPlan.FREE;
  const aiGoalsCount = goals.filter(g => g.type === GoalType.AI_MANAGED).length;
  const canCreateAiGoal = isPremium && aiGoalsCount < 3;

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 1 week from now
      priority: Priority.MEDIUM,
      type: GoalType.MANUAL,
      availableTime: '1-2 hours',
      difficulty: 'Moderate',
      notes: '',
    },
  });

  const selectedType = watch('type');

  const onSubmit = (data: FormData) => {
    if (data.type === GoalType.AI_MANAGED && !canCreateAiGoal) {
      if (!isPremium) {
        Alert.alert('Premium Feature', 'AI-managed goals are only available for premium users.');
      } else {
        Alert.alert('Goal Limit Reached', 'You can have at most 3 AI-managed goals at a time.');
      }
      return;
    }

    const newGoal: Goal = {
      id: Math.random().toString(36).substring(7),
      userId: user?.id || 'u1',
      title: data.title,
      description: data.description,
      type: data.type,
      priority: data.priority,
      status: GoalStatus.IN_PROGRESS,
      targetDate: data.targetDate,
      projectedDate: data.targetDate, // Initially same as target
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addGoal(newGoal);
    router.replace('/(tabs)/goals');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Goal</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.innerContainer}>
          {/* Goal Type Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Goal Type</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity 
                style={[styles.typeOption, selectedType === GoalType.MANUAL && styles.typeOptionActive]}
                onPress={() => setValue('type', GoalType.MANUAL)}
              >
                <Target size={20} color={selectedType === GoalType.MANUAL ? '#fff' : '#666'} />
                <Text style={[styles.typeOptionText, selectedType === GoalType.MANUAL && styles.typeOptionTextActive]}>Manual</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.typeOption, 
                  selectedType === GoalType.AI_MANAGED && styles.typeOptionActive,
                  !canCreateAiGoal && styles.typeOptionDisabled
                ]}
                onPress={() => {
                  if (canCreateAiGoal) {
                    setValue('type', GoalType.AI_MANAGED);
                  } else {
                    Alert.alert(
                      !isPremium ? 'Premium Feature' : 'Limit Reached',
                      !isPremium 
                        ? 'Upgrade to Premium to unlock AI-managed goals.' 
                        : 'You have reached the limit of 3 AI goals.'
                    );
                  }
                }}
              >
                <Brain size={20} color={selectedType === GoalType.AI_MANAGED ? '#fff' : '#666'} />
                <Text style={[styles.typeOptionText, selectedType === GoalType.AI_MANAGED && styles.typeOptionTextActive]}>AI Managed</Text>
                {!isPremium && <View style={styles.lockBadge}><Text style={styles.lockText}>PRO</Text></View>}
              </TouchableOpacity>
            </View>
            {selectedType === GoalType.AI_MANAGED && (
              <View style={styles.aiInfo}>
                <Info size={14} color="#A855F7" />
                <Text style={styles.aiInfoText}>AI will generate a structured plan based on your schedule.</Text>
              </View>
            )}
          </View>

          {/* Common Fields */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Goal Title</Text>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.title && styles.inputError]}
                  placeholder="e.g., Learn Spanish, Run a Marathon"
                  placeholderTextColor="#444"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Description (Optional)</Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="What do you want to achieve?"
                  placeholderTextColor="#444"
                  multiline
                  numberOfLines={3}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.section, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.sectionLabel}>Target Date</Text>
              <Controller
                control={control}
                name="targetDate"
                render={({ field: { value } }) => (
                  <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
                    <CalendarIcon size={18} color="#A855F7" />
                    <Text style={styles.dateText}>{value.toLocaleDateString()}</Text>
                  </TouchableOpacity>
                )}
              />
              {showDatePicker && (
                <DateTimePicker
                  value={watch('targetDate')}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setValue('targetDate', selectedDate);
                    }
                  }}
                />
              )}
              {errors.targetDate && <Text style={styles.errorText}>{errors.targetDate.message}</Text>}
            </View>

            <View style={[styles.section, { flex: 1 }]}>
              <Text style={styles.sectionLabel}>Priority</Text>
              <View style={styles.prioritySelector}>
                {Object.values(Priority).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityOption,
                      watch('priority') === p && styles.priorityOptionActive,
                      watch('priority') === p && { backgroundColor: p === Priority.HIGH ? '#EF4444' : p === Priority.MEDIUM ? '#F59E0B' : '#10B981' }
                    ]}
                    onPress={() => setValue('priority', p)}
                  >
                    <Text style={[styles.priorityText, watch('priority') === p && styles.priorityTextActive]}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* AI Specific Fields */}
          {selectedType === GoalType.AI_MANAGED && (
            <View style={styles.aiSection}>
              <Text style={styles.aiSectionTitle}>AI Planning Context</Text>
              
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Daily Available Time</Text>
                <View style={styles.chipContainer}>
                  {['< 30m', '1 hour', '1-2 hours', '3+ hours'].map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[styles.chip, watch('availableTime') === time && styles.chipActive]}
                      onPress={() => setValue('availableTime', time)}
                    >
                      <Text style={[styles.chipText, watch('availableTime') === time && styles.chipTextActive]}>{time}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Difficulty Preference</Text>
                <View style={styles.chipContainer}>
                  {['Easy', 'Moderate', 'Intense'].map((diff) => (
                    <TouchableOpacity
                      key={diff}
                      style={[styles.chip, watch('difficulty') === diff && styles.chipActive]}
                      onPress={() => setValue('difficulty', diff)}
                    >
                      <Text style={[styles.chipText, watch('difficulty') === diff && styles.chipTextActive]}>{diff}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Additional Notes for AI</Text>
                <Controller
                  control={control}
                  name="notes"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="e.g., I'm a beginner, I have weekends off..."
                      placeholderTextColor="#444"
                      multiline
                      numberOfLines={3}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
              </View>
            </View>
          )}

          <TouchableOpacity 
            style={styles.submitBtn} 
            onPress={handleSubmit(onSubmit)}
          >
            <Text style={styles.submitBtnText}>
              {selectedType === GoalType.AI_MANAGED ? 'Generate AI Plan' : 'Create Manual Goal'}
            </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
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
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 6,
    gap: 6,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  typeOptionActive: {
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#333',
  },
  typeOptionDisabled: {
    opacity: 0.5,
  },
  typeOptionText: {
    color: '#666',
    fontWeight: '600',
  },
  typeOptionTextActive: {
    color: '#fff',
  },
  lockBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  lockText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#000',
  },
  aiInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  aiInfoText: {
    fontSize: 12,
    color: '#A855F7',
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  dateText: {
    color: '#fff',
    fontSize: 16,
  },
  prioritySelector: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 6,
    gap: 6,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityOptionActive: {
    // Background color set dynamically
  },
  priorityText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  priorityTextActive: {
    color: '#fff',
  },
  aiSection: {
    backgroundColor: '#A855F708',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#A855F722',
  },
  aiSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#A855F7',
    marginBottom: 20,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#111',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  chipActive: {
    backgroundColor: '#A855F722',
    borderColor: '#A855F7',
  },
  chipText: {
    color: '#666',
    fontSize: 14,
  },
  chipTextActive: {
    color: '#A855F7',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#A855F7',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
