const expoConfig = {
  extra: {
    apiUrl:
      typeof process !== 'undefined'
        ? process.env?.EXPO_PUBLIC_API_URL
          ?? process.env?.EXPO_PUBLIC_API_BASE_URL
          ?? process.env?.VITE_API_BASE_URL
        : undefined,
  },
};

export default {
  expoConfig,
};
