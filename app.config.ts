import fs from 'node:fs';
import path from 'node:path';
import type { ExpoConfig } from '@expo/config-types';

const googleServicesFile = resolveGoogleServicesFile();

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
    [
      'expo-notifications',
      {
        defaultChannel: 'planner-reminders',
        color: '#A855F7',
      },
    ],
    [
      'react-native-edge-to-edge',
      {
        android: {
          parentTheme: 'Default',
          enforceNavigationBarContrast: false,
        },
      },
    ],
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
    ...(googleServicesFile ? { googleServicesFile } : {}),
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001',
    eas: {
      projectId: '31e8fec1-33ed-4650-88e4-fb7b51ec2760',
    },
  },
};

export default config;

function resolveGoogleServicesFile() {
  const configuredPath = process.env.GOOGLE_SERVICES_FILE?.trim();
  const candidates = [configuredPath, './google-services.json'].filter(
    (value): value is string => Boolean(value),
  );

  for (const candidate of candidates) {
    const resolvedCandidate = path.resolve(process.cwd(), candidate);

    if (fs.existsSync(resolvedCandidate)) {
      return candidate;
    }
  }

  return undefined;
}
