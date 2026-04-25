const memoryStore = new Map<string, string>();

export async function getItemAsync(key: string) {
  if (typeof window === 'undefined') {
    return memoryStore.get(key) ?? null;
  }

  return window.sessionStorage.getItem(key);
}

export async function setItemAsync(key: string, value: string) {
  memoryStore.set(key, value);

  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(key, value);
  }
}

export async function deleteItemAsync(key: string) {
  memoryStore.delete(key);

  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(key);
  }
}
