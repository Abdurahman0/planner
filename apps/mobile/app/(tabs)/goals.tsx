import { Alert, View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../src/store/useStore';
import { GoalCard } from '../../src/components/GoalCard';
import { Plus } from 'lucide-react-native';

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const goals = useStore((state) => state.goals);
  const isLoading = useStore((state) => state.isLoading);
  const fetchGoals = useStore((state) => state.fetchGoals);
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      try {
        await fetchGoals();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load goals';
        Alert.alert('Load Failed', message);
      }
    })();
  }, [fetchGoals]);

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Goals</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/goals/create')}
          >
            <Plus size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={goals}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <GoalCard goal={item} />}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{isLoading ? 'Loading goals...' : 'No goals yet. Start by creating one!'}</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  innerContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  emptyState: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
  },
});
