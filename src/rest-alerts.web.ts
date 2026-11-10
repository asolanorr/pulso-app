export function signalRestComplete() { /* The PWA uses the visible countdown and completion message. */ }
export async function prepareRestAlert(): Promise<string | null> {return 'El temporizador avisa en pantalla mientras Pulso esté abierto.';}
export async function scheduleRestAlert(id: string, _seconds: number) {return id;}
export async function cancelRestAlert(_id: string) {}
export async function clearRestAlerts() {}
