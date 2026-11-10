import React, {useEffect, useState} from 'react';
import {Text, View} from 'react-native';
import {Button, fonts} from './ui';
import {useTheme} from './theme';
import {useWorkout} from './workout-store';
export function PwaSettings() {
  const {colors} = useTheme(), {workout} = useWorkout();
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>();
  const [waiting, setWaiting] = useState(false), [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    let alive = true;
    const poll = async () => {
      const value = await navigator.serviceWorker?.getRegistration();
      if (alive) {setRegistration(value); setWaiting(!!value?.waiting); setOffline(!navigator.onLine);}
    };
    void poll(); const timer = setInterval(() => {void poll();}, 2000);
    return () => {alive = false; clearInterval(timer);};
  }, []);
  const active = !!workout && workout.finishedAt === null;
  const update = () => {
    if (!registration?.waiting || active) return;
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), {once: true});
    registration.waiting.postMessage('SKIP_WAITING');
  };
  return <View style={{gap: 16, padding: 20, borderRadius: 24, backgroundColor: colors.soft}}>
    <Text accessibilityRole="header" style={{fontFamily: fonts.display, fontSize: 23, color: colors.ink}}>Pulso en este dispositivo</Text>
    <Text style={{fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.ink}}>iPhone: abre Pulso en Safari y elige Compartir → Añadir a pantalla de inicio. Android y computadora: busca Instalar aplicación en el menú del navegador.</Text>
    <Text accessibilityLiveRegion="polite" style={{color: colors.muted, fontFamily: fonts.body}}>{offline ? 'Sin conexión. Solo estarán disponibles los GIFs guardados.' : registration?.active ? 'Preparada para abrir sin conexión.' : 'Abre la versión publicada con conexión para preparar el uso offline.'}</Text>
    {waiting && <><Text style={{color: colors.ink}}>{active ? 'Hay una actualización. Finaliza tu entrenamiento para aplicarla.' : 'Hay una nueva versión de Pulso.'}</Text><Button label="Actualizar Pulso" disabled={active} onPress={update}/></>}
  </View>;
}
