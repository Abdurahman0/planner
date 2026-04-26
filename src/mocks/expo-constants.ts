const expoConfig = {
  extra: {
    apiUrl:
      typeof process !== 'undefined'
        ? process.env?.EXPO_PUBLIC_API_URL
          ?? process.env?.EXPO_PUBLIC_API_BASE_URL
          ?? process.env?.VITE_API_BASE_URL
        : undefined,
    eas: {
      projectId:
        typeof process !== 'undefined'
          ? process.env?.EXPO_PUBLIC_EXPO_PROJECT_ID
            ?? process.env?.VITE_EXPO_PROJECT_ID
          : undefined,
    },
  },
};

export default {
  expoConfig,
};
