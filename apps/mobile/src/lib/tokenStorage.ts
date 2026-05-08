import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { User } from '@packages/shared';

const TOKEN_KEY = 'ai-planner-auth-token';
const USER_KEY = 'ai-planner-auth-user';

export async function getStoredToken() {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.sessionStorage.getItem(TOKEN_KEY);
  }

  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getStoredUser() {
  const rawValue = Platform.OS === 'web'
    ? (typeof window === 'undefined' ? null : window.sessionStorage.getItem(USER_KEY))
    : await SecureStore.getItemAsync(USER_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as {
      id: string;
      email: string;
      subscriptionPlan: User['subscriptionPlan'];
      createdAt?: string;
      updatedAt?: string;
    };

    return {
      ...parsedValue,
      createdAt: parsedValue.createdAt ? new Date(parsedValue.createdAt) : undefined,
      updatedAt: parsedValue.updatedAt ? new Date(parsedValue.updatedAt) : undefined,
    } satisfies User;
  } catch {
    await clearStoredUser();
    return null;
  }
}

export async function storeToken(token: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(TOKEN_KEY, token);
    }
    return;
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function storeUser(user: User) {
  const serializedUser = JSON.stringify({
    ...user,
    createdAt: user.createdAt?.toISOString(),
    updatedAt: user.updatedAt?.toISOString(),
  });

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(USER_KEY, serializedUser);
    }
    return;
  }

  await SecureStore.setItemAsync(USER_KEY, serializedUser);
}

export async function clearStoredToken() {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(TOKEN_KEY);
    }
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function clearStoredUser() {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(USER_KEY);
    }
    return;
  }

  await SecureStore.deleteItemAsync(USER_KEY);
}
