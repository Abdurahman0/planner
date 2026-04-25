import { create } from 'zustand';

interface NavigationState {
  currentPath: string;
  history: string[];
  navigate: (path: string) => void;
  replace: (path: string) => void;
  back: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentPath: '/auth',
  history: ['/auth'],
  navigate: (path) => {
    set((state) => ({
      currentPath: path,
      history: [...state.history, path],
    }));
  },
  replace: (path) => {
    set((state) => ({
      currentPath: path,
      history: [...state.history.slice(0, -1), path],
    }));
  },
  back: () => {
    set((state) => {
      if (state.history.length <= 1) {
        return state;
      }

      const history = state.history.slice(0, -1);
      return {
        currentPath: history[history.length - 1],
        history,
      };
    });
  },
}));

export const useRouter = () => {
  const navigate = useNavigationStore((state) => state.navigate);
  const replace = useNavigationStore((state) => state.replace);
  const back = useNavigationStore((state) => state.back);
  return {
    push: (url: string) => navigate(url),
    replace: (url: string) => replace(url),
    back: () => back(),
  };
};

export const useLocalSearchParams = () => {
  const currentPath = useNavigationStore((state) => state.currentPath);
  const goalMatch = currentPath.match(/^\/goals\/([^/]+)$/);

  if (goalMatch) {
    return { id: goalMatch[1] };
  }

  return {};
};

export const Tabs = {
  Screen: () => null,
};

export default {
  useRouter,
  useLocalSearchParams,
  Tabs,
};
