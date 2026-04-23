import { create } from 'zustand';

interface NavigationState {
  currentPath: string;
  navigate: (path: string) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentPath: '/(tabs)/dashboard',
  navigate: (path) => {
    console.log('Navigating to:', path);
    set({ currentPath: path });
  },
}));

export const useRouter = () => {
  const navigate = useNavigationStore((state) => state.navigate);
  return {
    push: (url: string) => navigate(url),
    replace: (url: string) => navigate(url),
    back: () => console.log('Go back'),
  };
};

export const useLocalSearchParams = () => ({});

export const Tabs = {
  Screen: () => null,
};

export default {
  useRouter,
  useLocalSearchParams,
  Tabs,
};
