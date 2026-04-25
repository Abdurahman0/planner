import { Redirect } from 'expo-router';
import { useStore } from '../src/store/useStore';

export default function IndexScreen() {
  const user = useStore((state) => state.user);
  const isInitialized = useStore((state) => state.isInitialized);

  if (!isInitialized) {
    return null;
  }

  return <Redirect href={user ? '/(tabs)' : '/auth'} />;
}
