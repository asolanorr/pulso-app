/* global __dirname, process */
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '../dist');
const manifest = JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
const base = manifest.scope;
assert.equal(manifest.start_url,base);
assert.equal(manifest.display,'standalone');
assert.ok(fs.readFileSync(path.join(root,'index.html'),'utf8').includes(`${base}manifest.webmanifest`));
const events = {}, stores = new Map();
let network = true, skipped = 0, claimed = 0;
const keyOf = req => typeof req === 'string' ? new URL(req,'https://pulso.test').href : req.url;
const caches = {
  keys: async()=>[...stores.keys()], delete: async key=>stores.delete(key),
  open: async name=>{
    if(!stores.has(name)) stores.set(name,new Map()); const data=stores.get(name);
    return {match: async req=>data.get(keyOf(req)), put: async(req,value)=>data.set(keyOf(req),value),
      keys: async()=>[...data.keys()].map(url=>({url})), delete: async req=>data.delete(keyOf(req)),
      addAll: async files=>{for(const url of files) {
        const relative=decodeURIComponent(new URL(url,'https://pulso.test').pathname.slice(base.length));
        assert.ok(fs.existsSync(path.join(root,relative)),`Missing precache asset: ${url}`);
        data.set(keyOf(url),{cached:url});
      }}};
  },
};
const self = {location:{origin:'https://pulso.test'},clients:{claim:async()=>{claimed++;}},skipWaiting:()=>{skipped++;},addEventListener:(name,fn)=>{events[name]=fn;}};
vm.runInNewContext(fs.readFileSync(path.join(root,'sw.js'),'utf8'),{self,caches,URL,fetch:async req=>{if(!network) throw Error('offline'); return {ok:true,type:'basic',url:keyOf(req),clone(){return this;}};}});
async function lifecycle(name) {let task;events[name]({waitUntil:value=>{task=value;}});await task;}
async function request(url,mode='cors') {let task;events.fetch({request:{url,method:'GET',mode},respondWith:value=>{task=value;}});return task;}
(async()=>{
  await lifecycle('install'); assert.equal(skipped,0,'Updates must wait for user approval');
  stores.set('pulso-shell-old',new Map()); stores.set('unrelated-app',new Map());
  await lifecycle('activate');assert.equal(claimed,1);assert.ok(!stores.has('pulso-shell-old'));assert.ok(stores.has('unrelated-app'));
  const shell=[...stores.keys()].find(key=>key.startsWith('pulso-shell-'));
  assert.ok(stores.get(shell).size>10,'Lazy chunks and fonts must be precached');
  network=false;
  assert.equal((await request(`https://pulso.test${base}workout`,'navigate')).cached,`${base}index.html`);
  for(const url of stores.get(shell).keys()) if(url.endsWith('.js')||url.endsWith('.ttf')) assert.ok(await request(url));
  network=true;
  for(let i=0;i<30;i++) await request(`https://fitcron.com/wp-content/uploads/test-${i}.gif`);
  assert.equal(stores.get('pulso-gifs-v1').size,24);
  network=false; assert.ok(await request('https://fitcron.com/wp-content/uploads/test-29.gif'));
  await assert.rejects(request('https://fitcron.com/wp-content/uploads/never-seen.gif'));
  events.message({data:'SKIP_WAITING'});assert.equal(skipped,1);
  console.log(`OK: PWA ${base}; assets completos; navegación y chunks offline; 24 GIFs; actualización explícita; cachés ajenas intactas.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
