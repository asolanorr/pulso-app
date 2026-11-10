/* global __dirname, process, Buffer */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const base = `/${(process.env.PULSO_BASE_PATH || '').split('/').filter(Boolean).join('/')}${process.env.PULSO_BASE_PATH?.split('/').filter(Boolean).length ? '/' : ''}`;
const result = spawnSync(process.execPath, [require.resolve('expo/bin/cli'), 'export', '--platform', 'web', '--max-workers', '1'], {cwd: root, stdio: 'inherit', env: {...process.env, PULSO_BASE_PATH: base, EXPO_NO_TELEMETRY: '1', __UNSAFE_EXPO_HOME_DIRECTORY: path.join(root, '.expo-local')}});
if (result.status !== 0) process.exit(result.status || 1);
const out = path.join(root, 'dist');
// Small original Pulso mark, encoded without image-processing dependencies.
function crc(bytes) {let n = 0xffffffff; for (const b of bytes) {n ^= b; for (let i = 0; i < 8; i++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;} return (n ^ 0xffffffff) >>> 0;}
function chunk(type, data) {const t = Buffer.from(type), size = Buffer.alloc(4), sum = Buffer.alloc(4); size.writeUInt32BE(data.length); sum.writeUInt32BE(crc(Buffer.concat([t, data]))); return Buffer.concat([size, t, data, sum]);}
function icon(size) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const a = x / size, b = y / size;
    const white = [[.28,.39,.39,.65],[.445,.555,.28,.65],[.61,.72,.46,.65]].some(([l,r,t,d]) => a >= l && a <= r && b >= t && b <= d);
    const index = y * (size * 3 + 1) + 1 + x * 3;
    raw.set(white ? [255,255,255] : [46,91,68], index);
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(size); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 2;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
for (const size of [180,192,512]) fs.writeFileSync(path.join(out, `icon-${size}.png`), icon(size));
fs.writeFileSync(path.join(out,'manifest.webmanifest'), JSON.stringify({id: base, name:'Pulso · Mis rutinas',short_name:'Pulso',lang:'es',start_url:base,scope:base,display:'standalone',background_color:'#efe9e0',theme_color:'#2e5b44',icons:[192,512].map(size=>({src:`icon-${size}.png`,sizes:`${size}x${size}`,type:'image/png',purpose:'any maskable'}))},null,2));
let html = fs.readFileSync(path.join(out,'index.html'),'utf8').replace(/<html[^>]*>/,'<html lang="es">').replace('width=device-width, initial-scale=1','width=device-width, initial-scale=1, viewport-fit=cover');
html = html.replace('</head>',`<link rel="manifest" href="${base}manifest.webmanifest"><link rel="apple-touch-icon" href="${base}icon-180.png"><meta name="theme-color" content="#2e5b44"><meta name="apple-mobile-web-app-capable" content="yes"></head>`);
fs.writeFileSync(path.join(out,'index.html'),html);
fs.writeFileSync(path.join(out,'404.html'),html);
for (const route of ['settings','workout']) {fs.mkdirSync(path.join(out,route),{recursive:true}); fs.writeFileSync(path.join(out,route,'index.html'),html);}
function walk(dir) {return fs.readdirSync(dir,{withFileTypes:true}).flatMap(item => item.isDirectory() ? walk(path.join(dir,item.name)) : [path.relative(out,path.join(dir,item.name)).replaceAll('\\','/')]);}
const files = walk(out).filter(file=>file!=='sw.js' && !file.endsWith('.map'));
const version = crypto.createHash('sha256').update(files.map(file=>file+fs.readFileSync(path.join(out,file)).toString('base64')).join('')).digest('hex').slice(0,16);
const worker = `const BASE=${JSON.stringify(base)}, SHELL='pulso-shell-${version}', GIFS='pulso-gifs-v1';
const FILES=${JSON.stringify(files.map(file=>base+file))};
self.addEventListener('install',event=>event.waitUntil(caches.open(SHELL).then(cache=>cache.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys()) if(key.startsWith('pulso-shell-')&&key!==SHELL) await caches.delete(key); await self.clients.claim();})()));
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING') self.skipWaiting();});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url); if(request.method!=='GET') return;
 if(url.origin===self.location.origin&&url.pathname.startsWith(BASE)) {
   if(request.mode==='navigate') {event.respondWith(caches.open(SHELL).then(cache=>cache.match(BASE+'index.html')).then(hit=>hit||fetch(request)));return;}
   event.respondWith(caches.open(SHELL).then(cache=>cache.match(request)).then(hit=>hit||fetch(request)));return;
 }
 if((url.hostname==='fitcron.com'||url.hostname==='www.fitcron.com')&&url.pathname.startsWith('/wp-content/uploads/')&&/\\.gif$/i.test(url.pathname)) {
   event.respondWith((async()=>{const cache=await caches.open(GIFS),hit=await cache.match(request); if(hit)return hit;
     const response=await fetch(request); if(response.ok||response.type==='opaque') {try {await cache.put(request,response.clone()); const keys=await cache.keys();for(const key of keys.slice(0,Math.max(0,keys.length-24))) await cache.delete(key);}catch{}}
     return response;})());
 }
});`;
fs.writeFileSync(path.join(out,'sw.js'),worker);
fs.writeFileSync(path.join(out,'.nojekyll'),'');
console.log(`PWA preparada: dist/ · ruta ${base} · versión ${version}`);
