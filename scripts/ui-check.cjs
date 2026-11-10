/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const catalog = require('../src/catalog.json');
const h = React.createElement;
const Box = ({children}) => h('div', null, children);
const Text = ({children}) => h('span', null, children);
const buttonActions = new Map();
const Button = ({label, onPress}) => {buttonActions.set(label, onPress); return h('button', {'aria-label': label}, label);};
const routine = {id: 'test-plan', name: 'Rutina de prueba', entries: [{id: 'test-entry', exerciseId: catalog[0].id, sets: '3', reps: '10–12', rest: '90', notes: 'Control de técnica'}]};
let mode = 'view';
let themeMode = 'light', palette = 'green';
const themeFile = path.resolve(__dirname, '../src/theme-model.ts');
const themeModule = new Module(themeFile, module);
themeModule._compile(ts.transpileModule(fs.readFileSync(themeFile, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText, themeFile);
const themeModel = themeModule.exports;
const dependencies = {
  'react-native': {
    ActivityIndicator: Box, KeyboardAvoidingView: Box, Platform: {OS: 'ios'}, ScrollView: Box, View: Box, Text,
    Alert: {alert() {}}, Linking: {openURL: async () => {}}, Share: {share: async () => {}},
    Pressable: ({children, accessibilityLabel}) => h('button', {'aria-label': accessibilityLabel}, children),
    TextInput: ({accessibilityLabel}) => h('input', {'aria-label': accessibilityLabel}),
    Modal: ({visible, children}) => visible ? h(Box, null, children) : null,
    StyleSheet: {create: value => value},
    FlatList: ({data, renderItem, ListHeaderComponent, ListFooterComponent, ListEmptyComponent}) => h(Box, null,
      ListHeaderComponent, data.length ? data.map((item, index) => h(React.Fragment, {key: item.id}, renderItem({item, index}))) : ListEmptyComponent, ListFooterComponent),
  },
  'react-native-safe-area-context': {SafeAreaView: Box},
  'expo-router': {router: {}, useLocalSearchParams: () => ({routineId: routine.id, mode})},
  './src/dialogs': {Alert: {alert() {}}},
  './src/share-routines': {shareRoutines: async () => {}},
  './src/import-file': {ImportFile: () => null},
  './src/catalog.json': catalog,
  './src/examples/monday-chest-triceps.json': require('../src/examples/monday-chest-triceps.json'),
  './src/screen-modal': {ScreenModal: ({visible, children}) => visible ? h(Box, null, children) : null},
  './src/model': {uid: () => 'test', parseRoutines: () => []},
  './src/catalog-utils': {getGroupOptions: () => [], filterExercises: () => [], groupLabel: value => value, ALL_GROUPS: '__all__'},
  './src/ui': {Button, IconButton: Button, ExerciseImage: () => h('img', {src: 'test.gif', alt: 'Ejemplo de ejercicio'}), Icon: () => null, colors: {}, fonts: {}},
  './src/theme': {useTheme: () => ({colors: themeModel.themeColors(palette, themeMode), mode: themeMode})},
  './src/routine-store': {useRoutines: () => ({routines: [routine], setRoutines() {}, ready: true, blocked: false, saveError: false})},
  './src/workout-store': {useWorkout: () => ({workout: null, ready: true, blocked: false})},
};
const file = path.resolve(__dirname, '../App.tsx');
const app = new Module(file, module);
app.require = id => Object.hasOwn(dependencies, id) ? dependencies[id] : require(id);
app._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true}}).outputText, file);
const view = renderToStaticMarkup(h(app.exports.default));
assert.ok(!view.includes('<input'), 'Opening a routine must not show editable fields');
assert.ok(view.includes('Editar rutina') && view.includes('Iniciar rutina'));
assert.ok(view.includes('10–12') && view.includes('90 s') && view.includes('Control de técnica'));
assert.ok(!view.includes('Quitar ') && !view.includes('Subir '));
mode = 'edit';
const editor = renderToStaticMarkup(h(app.exports.default));
assert.equal((editor.match(/<input/g) || []).length, 4, 'Edit mode must show series, reps, rest and notes');
assert.ok(editor.includes('Añadir ejercicios') && editor.includes('Listo · Ver rutina'));
assert.ok(editor.includes('Subir ') && editor.includes('Quitar '));
for (const option of themeModel.PALETTES) for (const selectedMode of ['light', 'dark']) {
  palette = option.id; themeMode = selectedMode; mode = 'view';
  const themedView = renderToStaticMarkup(h(app.exports.default));
  assert.ok(!themedView.includes('<input') && themedView.includes('Ajustes') && themedView.includes('Iniciar rutina'));
}
console.log('OK: ficha informativa sin inputs; edición explícita con campos y controles de orden.');

const actions = new Map();
const settingsFile = path.resolve(__dirname, '../src/app/settings.tsx');
const settingsModule = new Module(settingsFile, module);
let lastAlert, resetCalls = 0;
const settingsDependencies = {
  ...dependencies,
  'react-native': {...dependencies['react-native'], Pressable: ({children, accessibilityLabel, accessibilityState, onPress}) => {
    actions.set(accessibilityLabel, onPress);
    return h('button', {'aria-label': accessibilityLabel, 'aria-checked': accessibilityState?.checked}, children);
  }, Alert: {alert: (title, message, buttons) => {lastAlert = {title, message, buttons};}}},
  'expo-constants': {__esModule: true, default: {executionEnvironment: 'storeClient'}, ExecutionEnvironment: {StoreClient: 'storeClient'}},
  '../dialogs': {Alert: {alert: (title, message, buttons) => {lastAlert = {title, message, buttons};}}},
  '../pwa-settings': {PwaSettings: () => null},
  '../ui': dependencies['./src/ui'], '../theme-model': themeModel,
  '../data-reset': {useDataReset: () => ({resetting: false, resetAll: async () => {resetCalls++;}})},
  '../theme': {useTheme: () => ({preferences: {mode: themeMode, palette}, mode: themeModel.resolveThemeMode(themeMode, 'light'), colors: themeModel.themeColors(palette, themeModel.resolveThemeMode(themeMode, 'light')),
    saveError: false, setMode: value => {themeMode = value;}, setPalette: value => {palette = value;}})},
};
settingsModule.require = id => Object.hasOwn(settingsDependencies, id) ? settingsDependencies[id] : require(id);
settingsModule._compile(ts.transpileModule(fs.readFileSync(settingsFile, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true}}).outputText, settingsFile);
themeMode = 'light'; palette = 'green';
const settingsHtml = renderToStaticMarkup(h(settingsModule.exports.default));
assert.equal((settingsHtml.match(/aria-checked=/g) || []).length, 7, 'Settings must expose 3 modes and 4 palettes');
assert.ok(!settingsHtml.includes('Avisos de descanso') && !settingsHtml.includes('Ver guía de Expo'), 'Settings must not show the removed notification notice');
actions.get('Tema Oscuro')(); assert.equal(themeMode, 'dark');
actions.get('Paleta Azul')(); assert.equal(palette, 'blue');
const darkBlue = renderToStaticMarkup(h(settingsModule.exports.default));
assert.match(darkBlue, /aria-label="Tema Oscuro" aria-checked="true"/);
assert.match(darkBlue, /aria-label="Paleta Azul" aria-checked="true"/);
actions.get('Tema Sistema')(); assert.equal(themeMode, 'system');
buttonActions.get('Borrar todos mis datos')();
assert.equal(resetCalls, 0, 'Reset must not run before confirmation');
assert.ok(lastAlert.message.includes('No se puede deshacer'));
assert.ok(lastAlert.buttons.some(button => button.style === 'cancel'));
lastAlert.buttons.find(button => button.style === 'destructive').onPress();
assert.equal(resetCalls, 1, 'Confirmed reset must run once');
console.log('OK: ajustes con 3 modos y 4 paletas; selección de oscuro y azul; modo sistema; aviso retirado.');
console.log('OK: borrar todos los datos exige confirmación destructiva y ofrece cancelar.');
