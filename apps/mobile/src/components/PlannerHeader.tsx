import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

export type PlannerView = 'day' | 'week' | 'month';

interface PlannerHeaderProps {
  view: PlannerView;
  setView: (view: PlannerView) => void;
  selectedDate: Date;
  onPrev: () => void;
  onNext: () => void;
}

export const PlannerHeader: React.FC<PlannerHeaderProps> = ({
  view,
  setView,
  selectedDate,
  onPrev,
  onNext,
}) => {
  const getTitle = () => {
    if (view === 'month') {
      return selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    }
    if (view === 'week') {
      const start = new Date(selectedDate);
      start.setDate(start.getDate() - start.getDay());
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${start.getDate()} - ${end.getDate()} ${start.toLocaleString('default', { month: 'short' })}`;
    }
    return selectedDate.toLocaleString('default', { day: 'numeric', month: 'long' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.title}>{getTitle()}</Text>
        <View style={styles.nav}>
          <TouchableOpacity onPress={onPrev} style={styles.navBtn}>
            <ChevronLeft size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onNext} style={styles.navBtn}>
            <ChevronRight size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.viewSwitcher}>
        {(['day', 'week', 'month'] as PlannerView[]).map((v) => (
          <TouchableOpacity
            key={v}
            onPress={() => setView(v)}
            style={[styles.viewBtn, view === v && styles.viewBtnActive]}
          >
            <Text style={[styles.viewBtnText, view === v && styles.viewBtnTextActive]}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  nav: {
    flexDirection: 'row',
    gap: 8,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  viewSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 4,
  },
  viewBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  viewBtnActive: {
    backgroundColor: '#A855F7',
  },
  viewBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  viewBtnTextActive: {
    color: '#fff',
  },
});
