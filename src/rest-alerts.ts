import {Platform, Vibration} from 'react-native';
import * as Notifications from 'expo-notifications';
import {AndroidImportance} from 'expo-notifications';
Notifications.setNotificationHandler({handleNotification: async () => ({shouldShowBanner: false, shouldShowList: false, shouldPlaySound: false, shouldSetBadge: false})});
export const signalRestComplete = () => Vibration.vibrate();
export async function prepareRestAlert(): Promise<string | null> {
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('pulso-rest', {name: 'Descanso de entrenamiento', importance: AndroidImportance.HIGH, vibrationPattern: [0, 400, 200, 400], enableVibrate: true, sound: 'default'});
  let permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted && permissions.canAskAgain) permissions = await Notifications.requestPermissionsAsync({ios: {allowAlert: true, allowSound: true, allowBadge: false}});
  return permissions.granted ? null : 'Mantén la app abierta para recibir la vibración. Puedes activar notificaciones en los ajustes del teléfono.';
}
export const scheduleRestAlert = (identifier: string, seconds: number) => Notifications.scheduleNotificationAsync({identifier, content: {title: 'Descanso terminado', body: 'Puedes continuar con tu siguiente serie.', sound: 'default'}, trigger: {type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, repeats: false, ...(Platform.OS === 'android' ? {channelId: 'pulso-rest'} : {})}});
export const cancelRestAlert = (id: string) => Notifications.cancelScheduledNotificationAsync(id);
export async function clearRestAlerts() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(scheduled.filter(item => item.identifier.startsWith('pulso-rest-')).map(item => cancelRestAlert(item.identifier)));
  const presented = await Notifications.getPresentedNotificationsAsync();
  await Promise.all(presented.filter(item => item.request.identifier.startsWith('pulso-rest-')).map(item => Notifications.dismissNotificationAsync(item.request.identifier)));
}
