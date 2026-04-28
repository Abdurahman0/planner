import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.EXPO_PUBLIC_API_URL': JSON.stringify(env.EXPO_PUBLIC_API_URL ?? env.VITE_API_BASE_URL),
      'process.env.EXPO_PUBLIC_EXPO_PROJECT_ID': JSON.stringify(env.EXPO_PUBLIC_EXPO_PROJECT_ID ?? env.VITE_EXPO_PROJECT_ID),
      'process.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
      'process.env.VITE_EXPO_PROJECT_ID': JSON.stringify(env.VITE_EXPO_PROJECT_ID),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'react-native': 'react-native-web',
        'lucide-react-native': 'lucide-react',
        'expo-router': path.resolve(__dirname, './src/mocks/expo-router.ts'),
        'expo-constants': path.resolve(__dirname, './src/mocks/expo-constants.ts'),
        'expo-device': path.resolve(__dirname, './src/mocks/expo-device.ts'),
        'expo-secure-store': path.resolve(__dirname, './src/mocks/secure-store.ts'),
        'expo-notifications': path.resolve(__dirname, './src/mocks/expo-notifications.ts'),
        'react-native-edge-to-edge': path.resolve(__dirname, './src/mocks/react-native-edge-to-edge.tsx'),
        'react-native-safe-area-context': path.resolve(__dirname, './src/mocks/safe-area-context.tsx'),
        '@react-native-community/datetimepicker': path.resolve(__dirname, './src/mocks/datetimepicker.tsx'),
        '@packages/shared': path.resolve(__dirname, './packages/shared/src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
