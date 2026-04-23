import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useStore } from '../../src/store/useStore';
import { PlannerHeader, PlannerView } from '../../src/components/PlannerHeader';
import { MonthView } from '../../src/components/MonthView';
import { WeekView } from '../../src/components/WeekView';
import { DayView } from '../../src/components/DayView';

export default function CalendarScreen() {
  const { tasks, goals, availability } = useStore();
  const [view, setView] = useState<PlannerView>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handlePrev = () => {
    const newDate = new Date(selectedDate);
    if (view === 'month') newDate.setMonth(newDate.getMonth() - 1);
    else if (view === 'week') newDate.setDate(newDate.getDate() - 7);
    else newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(selectedDate);
    if (view === 'month') newDate.setMonth(newDate.getMonth() + 1);
    else if (view === 'week') newDate.setDate(newDate.getDate() + 7);
    else newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const renderView = () => {
    switch (view) {
      case 'month':
        return (
          <MonthView
            selectedDate={selectedDate}
            tasks={tasks}
            goals={goals}
            onDateSelect={(date) => {
              setSelectedDate(date);
              setView('day');
            }}
          />
        );
      case 'week':
        return <WeekView selectedDate={selectedDate} tasks={tasks} />;
      case 'day':
        return <DayView selectedDate={selectedDate} tasks={tasks} availability={availability} />;
    }
  };

  return (
    <View style={styles.container}>
      <PlannerHeader
        view={view}
        setView={setView}
        selectedDate={selectedDate}
        onPrev={handlePrev}
        onNext={handleNext}
      />
      <View style={styles.content}>
        {renderView()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
  },
});
