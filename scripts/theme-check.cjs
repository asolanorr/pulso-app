/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const file = path.resolve(__dirname, '../src/theme-model.ts');
const model = new Module(file, module);
model._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText, file);
const {DEFAULT_APPEARANCE, PALETTES, parseAppearance, resolveThemeMode, themeColors} = model.exports;
assert.equal(new Set(PALETTES.map(palette => palette.id)).size, 4);
for (const raw of ['null', '{}', 'invalid', '{"version":2,"mode":"dark","palette":"blue"}', '{"version":1,"mode":"wrong","palette":"green"}', '{"version":1,"mode":"dark","palette":"missing"}']) assert.deepEqual(parseAppearance(raw), DEFAULT_APPEARANCE);
assert.equal(resolveThemeMode('system', 'dark'), 'dark');
assert.equal(resolveThemeMode('system', 'light'), 'light');
assert.equal(resolveThemeMode('system', null), 'light');
assert.equal(resolveThemeMode('light', 'dark'), 'light');
assert.equal(resolveThemeMode('dark', 'light'), 'dark');
function luminance(hex) {
  const [r, g, b] = hex.slice(1).match(/../g).map(value => {
    const channel = parseInt(value, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {const x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);}
for (const palette of PALETTES) {
  for (const mode of ['light', 'dark', 'system']) {
    const settings = {mode, palette: palette.id};
    assert.deepEqual(parseAppearance(JSON.stringify({version: 1, ...settings})), settings, 'Stored preferences must round-trip');
  }
  for (const mode of ['light', 'dark']) {
    const colors = themeColors(palette.id, mode);
    for (const background of ['background', 'soft', 'surface', 'selected']) {
      assert.ok(contrast(colors.ink, colors[background]) >= 4.5, `${palette.id}/${mode}: body contrast on ${background}`);
      assert.ok(contrast(colors.muted, colors[background]) >= 4.5, `${palette.id}/${mode}: metadata contrast on ${background}`);
    }
    assert.ok(contrast(colors.onAccent, colors.accent) >= 4.5, `${palette.id}/${mode}: button contrast`);
    assert.ok(contrast(colors.accent, colors.selected) >= 4.5, `${palette.id}/${mode}: selected-state contrast`);
    assert.ok(contrast(colors.danger, colors.dangerSoft) >= 4.5, `${palette.id}/${mode}: error contrast`);
    assert.equal(colors.white, '#ffffff', 'GIF backgrounds must retain their original white background');
  }
}
console.log('OK: 4 paletas × 2 temas; persistencia; modo sistema; recuperación de preferencias inválidas; contraste mínimo 4.5:1.');
