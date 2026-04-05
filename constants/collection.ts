import AsyncStorage from '@react-native-async-storage/async-storage';
import { Perfume } from '../data/perfumes';

const KEY = 'sillage_collection';

export async function getCollection(): Promise<Perfume[]> {
  try {
    const json = await AsyncStorage.getItem(KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

export async function saveToCollection(perfume: Perfume): Promise<void> {
  try {
    const current = await getCollection();
    const exists = current.find(p => p.id === perfume.id);
    if (!exists) {
      await AsyncStorage.setItem(KEY, JSON.stringify([...current, perfume]));
    }
  } catch {}
}

export async function removeFromCollection(id: string): Promise<void> {
  try {
    const current = await getCollection();
    const updated = current.filter(p => p.id !== id);
    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
  } catch {}
}

export async function isInCollection(id: string): Promise<boolean> {
  try {
    const current = await getCollection();
    return current.some(p => p.id === id);
  } catch {
    return false;
  }
}