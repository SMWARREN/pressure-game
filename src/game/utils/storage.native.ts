// Native storage — in-memory for now, swap for MMKV/AsyncStorage later.
// Achievements won't persist between app restarts until a native build is set up.
const store = new Map<string, string>();

export const nativeStorage = {
  getItem: (key: string): string | null => store.get(key) ?? null,
  setItem: (key: string, value: string): void => {
    store.set(key, value);
  },
  removeItem: (key: string): void => {
    store.delete(key);
  },
};
