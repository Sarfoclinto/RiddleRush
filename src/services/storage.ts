import type { StorageKeys } from "@/types/common";

export const saveToStorage = (key: StorageKeys, data: unknown) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const getFromStorage = (key: StorageKeys): unknown => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

export const removeFromStorage = (key: StorageKeys) => {
  localStorage.removeItem(key);
};
