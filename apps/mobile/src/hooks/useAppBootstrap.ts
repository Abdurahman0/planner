import { useEffect } from 'react';
import { testConnection } from '../lib/api';
import { useStore } from '../store/useStore';

export function useAppBootstrap() {
  const initializeAuth = useStore((state) => state.initializeAuth);

  useEffect(() => {
    void testConnection().catch(() => {});
    void initializeAuth();
  }, [initializeAuth]);
}
