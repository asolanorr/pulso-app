import type {AlertButton} from 'react-native';

export type WebDialog = {title: string; message: string; buttons: AlertButton[]};
const queue: WebDialog[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(listener => listener());
export const dialogSnapshot = () => queue[0] ?? null;
export const serverDialogSnapshot = () => null;
export function subscribeDialogs(listener: () => void) {listeners.add(listener); return () => {listeners.delete(listener);};}
export function answerDialog(index: number) {
  const dialog = queue.shift(); emit();
  dialog?.buttons[index]?.onPress?.();
}
export function cancelDialog() {
  const current = queue[0];
  if (!current) return;
  const index = current.buttons.findIndex(button => button.style === 'cancel');
  if (index >= 0) answerDialog(index);
  else if (current.buttons.length === 1) answerDialog(0);
}
export const Alert = {
  alert(title: string, message = '', buttons: AlertButton[] = [{text: 'Aceptar'}]) {
    queue.push({title, message, buttons: buttons.length ? buttons : [{text: 'Aceptar'}]}); emit();
  },
};
