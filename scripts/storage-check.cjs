/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

async function check() {
  const data = new Map([
    ['@pulso/routines/v1', 'old routines'], ['@pulso/workout/v1', 'old workout'],
    ['@pulso/appearance/v1', 'old theme'], ['another-app/data', 'keep this'],
  ]);
  let release, signalStarted;
  const started = new Promise(resolve => {signalStarted = resolve;});
  const gate = new Promise(resolve => {release = resolve;});
  let hold = true;
  const storage = {
    getItem: async key => data.get(key) ?? null,
    setItem: async (key, value) => {if (hold) {signalStarted(); await gate;} data.set(key, value);},
    removeItem: async key => {data.delete(key);},
    getAllKeys: async () => [...data.keys()],
    multiRemove: async keys => {assert.ok(keys.every(key => key.startsWith('@pulso/'))); for (const key of keys) data.delete(key);},
  };
  const file = path.resolve(__dirname, '../src/app-storage.ts');
  const mod = new Module(file, module);
  mod.require = id => id === '@react-native-async-storage/async-storage' ? {__esModule: true, default: storage} : require(id);
  mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText, file);
  const api = mod.exports, oldEpoch = api.storageEpoch();
  await assert.rejects(api.removeApplicationData(), /requiere/);
  const inFlight = api.writeData('@pulso/routines/v1', 'in-flight routines', oldEpoch);
  await started;
  api.beginStorageReset();
  assert.throws(api.beginStorageReset, /curso/);
  const queued = api.writeData('@pulso/workout/v1', 'stale workout', oldEpoch);
  release(); hold = false;
  await Promise.all([inFlight, queued, api.waitForPendingWrites()]);
  await api.removeApplicationData();
  api.endStorageReset();
  assert.deepEqual([...data], [['another-app/data', 'keep this']], 'Reset must remove only Pulso data');
  await api.writeData('@pulso/routines/v1', 'resurrected routines', oldEpoch);
  assert.equal(await api.readData('@pulso/routines/v1'), null, 'Late writes from old providers must stay invalid after reset');
  await api.writeData('@pulso/routines/v1', 'new routine', api.storageEpoch());
  assert.equal(await api.readData('@pulso/routines/v1'), 'new routine', 'New providers must be able to save after reset');
  await assert.rejects(api.writeData('another-app/data', 'overwrite', api.storageEpoch()), /no válida/);
  assert.equal(data.get('another-app/data'), 'keep this');
  console.log('OK: reset waits for in-flight writes; prevents data resurrection; preserves other apps; allows new data afterward.');
}
check().catch(error => {console.error(error); process.exitCode = 1;});
