import React, {createContext, useContext, useRef, useState} from 'react';
import {ActivityIndicator, Alert, Platform, StyleSheet, Text, View} from 'react-native';
import {Image} from 'expo-image';
import * as Notifications from 'expo-notifications';
import {beginStorageReset, endStorageReset, removeApplicationData, waitForPendingWrites} from './app-storage';

const Context = createContext<{resetting: boolean; resetAll: () => Promise<void>} | null>(null);
export function DataResetProvider({children}: {children: React.ReactNode}) {
  const [generation, setGeneration] = useState(0), [resetting, setResetting] = useState(false);
  const running = useRef(false);
  const resetAll = async () => {
    if (running.current) return;
    running.current = true; setResetting(true);
    const warnings: string[] = [];
    let failure = false;
    beginStorageReset();
    try {
      await waitForPendingWrites();
      if (Platform.OS !== 'web') {
        try {
          const scheduled = await Notifications.getAllScheduledNotificationsAsync();
          await Promise.all(scheduled.filter(item => item.identifier.startsWith('pulso-rest-')).map(item => Notifications.cancelScheduledNotificationAsync(item.identifier)));
          const presented = await Notifications.getPresentedNotificationsAsync();
          await Promise.all(presented.filter(item => item.request.identifier.startsWith('pulso-rest-')).map(item => Notifications.dismissNotificationAsync(item.request.identifier)));
        } catch {warnings.push('No se pudieron retirar todos los avisos de descanso del sistema.');}
      }
      await removeApplicationData();
      if (Platform.OS !== 'web') {
        try {
          const cleared = await Promise.all([Image.clearMemoryCache(), Image.clearDiskCache()]);
          if (cleared.some(value => !value)) warnings.push('Parte de la caché de imágenes puede permanecer.');
        } catch {warnings.push('No se pudo vaciar la caché de imágenes.');}
      }
    } catch {failure = true;}
    finally {
      endStorageReset();
      // Remount providers so no routine, session or preference remains in memory.
      setGeneration(value => value + 1); setResetting(false); running.current = false;
    }
    if (failure) Alert.alert('No se completó el borrado', 'No pudimos eliminar todos los datos guardados. Vuelve a intentarlo.');
    else Alert.alert('Datos restablecidos', ['Se borraron tus rutinas, el entrenamiento guardado y las preferencias. El catálogo de ejercicios sigue disponible.', ...warnings].join('\n\n'));
  };
  return <Context.Provider value={{resetting, resetAll}}>
    <React.Fragment key={generation}>{children}</React.Fragment>
    {resetting && <View accessibilityViewIsModal style={styles.overlay}><ActivityIndicator color="#ffffff"/><Text accessibilityRole="alert" style={styles.message}>Restableciendo tus datos…</Text></View>}
  </Context.Provider>;
}
export function useDataReset() {
  const value = useContext(Context);
  if (!value) throw Error('DataResetProvider missing');
  return value;
}
const styles = StyleSheet.create({overlay: {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#101715ee', alignItems: 'center', justifyContent: 'center', gap: 16}, message: {color: '#ffffff', fontSize: 16}});
