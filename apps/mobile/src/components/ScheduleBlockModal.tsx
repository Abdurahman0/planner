import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AvailabilitySlot, AvailabilityType } from '@packages/shared';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addMinutesToTime } from '../lib/planner';

interface ScheduleBlockModalProps {
  visible: boolean;
  selectedDate: Date;
  slot?: AvailabilitySlot | null;
  initialStartTime?: string;
  onClose: () => void;
  onSave: (input: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    type: AvailabilityType;
    label?: string;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
  isLoading?: boolean;
}

const availabilityTypes = [
  AvailabilityType.SLEEP,
  AvailabilityType.EATING,
  AvailabilityType.WORK,
  AvailabilityType.STUDY,
  AvailabilityType.AVAILABLE,
  AvailabilityType.BLOCKED,
  AvailabilityType.CUSTOM,
];

export function ScheduleBlockModal({
  visible,
  selectedDate,
  slot,
  initialStartTime,
  onClose,
  onSave,
  onDelete,
  isLoading = false,
}: ScheduleBlockModalProps) {
  const insets = useSafeAreaInsets();
  const footerPaddingBottom = insets.bottom + 16;
  const scrollContentPaddingBottom = footerPaddingBottom + 48;
  const defaultEndTime = useMemo(() => {
    if (!initialStartTime) {
      return '10:00';
    }

    return addMinutesToTime(initialStartTime, 60);
  }, [initialStartTime]);

  const [label, setLabel] = useState('');
  const [type, setType] = useState<AvailabilityType>(AvailabilityType.WORK);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  useEffect(() => {
    if (!visible) {
      return;
    }

    setLabel(slot?.label ?? '');
    setType(slot?.type ?? AvailabilityType.WORK);
    setStartTime(slot?.startTime ?? initialStartTime ?? '09:00');
    setEndTime(slot?.endTime ?? defaultEndTime);
  }, [defaultEndTime, initialStartTime, slot, visible]);

  const handleSave = async () => {
    await onSave({
      dayOfWeek: selectedDate.getDay(),
      startTime,
      endTime,
      type,
      label: label.trim() || undefined,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <View style={styles.sheet}>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>{slot ? 'Edit Schedule Block' : 'Add Schedule Block'}</Text>
                <Text style={styles.subtitle}>
                  {selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' })}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={[styles.content, { paddingBottom: scrollContentPaddingBottom }]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.field}>
                <Text style={styles.label}>Label</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Sleep, Work, Gym..."
                  placeholderTextColor="#555"
                  value={label}
                  onChangeText={setLabel}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Type</Text>
                <View style={styles.chips}>
                  {availabilityTypes.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[styles.chip, type === option && styles.chipActive]}
                      onPress={() => setType(option)}
                    >
                      <Text style={[styles.chipText, type === option && styles.chipTextActive]}>
                        {option.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.field, styles.rowField]}>
                  <Text style={styles.label}>Start</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="08:00"
                    placeholderTextColor="#555"
                    value={startTime}
                    onChangeText={setStartTime}
                    autoCapitalize="none"
                  />
                </View>
                <View style={[styles.field, styles.rowField]}>
                  <Text style={styles.label}>End</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="09:00"
                    placeholderTextColor="#555"
                    value={endTime}
                    onChangeText={setEndTime}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: footerPaddingBottom }]}>
              {slot && onDelete ? (
                <TouchableOpacity style={styles.deleteButton} onPress={() => void onDelete()} disabled={isLoading}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={styles.saveButton} onPress={() => void handleSave()} disabled={isLoading}>
                <Text style={styles.saveButtonText}>{isLoading ? 'Saving...' : 'Save Block'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#050505',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 0,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: '#1F1F1F',
  },
  scrollArea: {
    flexGrow: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: '#7C7C7C',
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
  content: {
    gap: 18,
  },
  field: {
    gap: 10,
  },
  label: {
    color: '#A3A3A3',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#fff',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
  },
  chipActive: {
    backgroundColor: '#A855F722',
    borderColor: '#A855F7',
  },
  chipText: {
    color: '#8A8A8A',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowField: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#220D0D',
    borderWidth: 1,
    borderColor: '#5A1B1B',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  deleteButtonText: {
    color: '#F87171',
    fontWeight: '700',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#A855F7',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
