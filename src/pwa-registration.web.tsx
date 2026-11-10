import {useEffect} from 'react';
export function PwaSettingsRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    // The manifest is emitted only by the production PWA build.
    const manifest = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!manifest) return;
    const base = new URL('.', manifest.href);
    navigator.serviceWorker.register(new URL('sw.js', base), {scope: base.pathname})
      .catch(error => console.warn('No se pudo preparar Pulso sin conexión.', error));
  }, []);
  return null;
}
