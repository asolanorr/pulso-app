import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@pulso/';
let epoch = 0;
let resetting = false;
let writes: Promise<void> = Promise.resolve();
export const storageEpoch = () => epoch;
export const readData = (key: string) => AsyncStorage.getItem(key);
export function writeData(key: string, value: string | null, sourceEpoch: number): Promise<void> {
  if (!key.startsWith(PREFIX)) return Promise.reject(Error('Clave de almacenamiento no válida'));
  const operation = writes.then(async () => {
    // A reset invalidates writes from old providers, including late async callbacks.
    if (resetting || sourceEpoch !== epoch) return;
    if (value === null) await AsyncStorage.removeItem(key);
    else await AsyncStorage.setItem(key, value);
  });
  writes = operation.catch(() => {});
  return operation;
}
export function beginStorageReset() {
  if (resetting) throw Error('Ya hay un restablecimiento en curso');
  resetting = true; epoch++;
}
export const waitForPendingWrites = () => writes;
export async function removeApplicationData() {
  if (!resetting) throw Error('El borrado requiere iniciar el restablecimiento');
  const keys = (await AsyncStorage.getAllKeys()).filter(key => key.startsWith(PREFIX));
  if (keys.length) await AsyncStorage.multiRemove(keys);
}
export function endStorageReset() {resetting = false;}
