export async function clearImageCache() {
  if (!('caches' in window)) return true;
  const names = (await caches.keys()).filter(name => name.startsWith('pulso-gifs-'));
  await Promise.all(names.map(name => caches.delete(name)));
  return true;
}
