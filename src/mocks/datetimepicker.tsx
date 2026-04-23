import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function DateTimePicker({ value, onChange, mode }: any) {
  // Simple mock that just shows the current value and allows "changing" it
  return (
    <View style={{ padding: 20, backgroundColor: '#111', borderRadius: 10, margin: 10 }}>
      <Text style={{ color: '#fff', marginBottom: 10 }}>Mock Date Picker ({mode})</Text>
      <Text style={{ color: '#A855F7', fontWeight: 'bold' }}>{value.toLocaleDateString()}</Text>
      <TouchableOpacity 
        onPress={() => onChange({ type: 'set' }, new Date())}
        style={{ marginTop: 10, padding: 10, backgroundColor: '#222', borderRadius: 5 }}
      >
        <Text style={{ color: '#fff' }}>Set to Today (Mock)</Text>
      </TouchableOpacity>
    </View>
  );
}
