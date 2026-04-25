import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export function useAppBootstrap() {
  const initializeAuth = useStore((state) => state.initializeAuth);

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);
}
