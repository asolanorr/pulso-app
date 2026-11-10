import {Image} from 'expo-image';
export async function clearImageCache() {
  const cleared = await Promise.all([Image.clearMemoryCache(), Image.clearDiskCache()]);
  return cleared.every(Boolean);
}
