import type { ExpoConfig } from '@expo/config-types';

const config: ExpoConfig = {
  name: 'AI Planner',
  slug: 'ai-planner',
  scheme: 'aiplanner',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  assetBundlePatterns: ['**/*'],
  plugins: [
    [
      'expo-router',
      {
        root: './apps/mobile/app',
      },
    ],
    'expo-notifications',
    'expo-secure-store',
  ],
  experiments: {
    typedRoutes: true,
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.aiplanner.mobile',
  },
  android: {
    package: 'com.aiplanner.mobile',
    adaptiveIcon: {
      backgroundColor: '#000000',
    },
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001',
    eas: {
      projectId: '31e8fec1-33ed-4650-88e4-fb7b51ec2760',
    },
  },
};

export default config;
