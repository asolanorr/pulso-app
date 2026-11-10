export type ThemeMode = 'system' | 'light' | 'dark';
export type PaletteId = 'green' | 'blue' | 'orange' | 'pink';
export type AppearancePreferences = {mode: ThemeMode; palette: PaletteId};
export type ThemeColors = {
  background: string; surface: string; soft: string; ink: string; muted: string;
  accent: string; onAccent: string; selected: string; line: string;
  white: string; imageInk: string; danger: string; dangerSoft: string; overlay: string;
};
export const DEFAULT_APPEARANCE: AppearancePreferences = {mode: 'light', palette: 'green'};
export const PALETTES: {id: PaletteId; name: string; swatch: string}[] = [
  {id: 'green', name: 'Verde pino', swatch: '#2e5b44'},
  {id: 'blue', name: 'Azul', swatch: '#2459a6'},
  {id: 'orange', name: 'Naranja', swatch: '#a54416'},
  {id: 'pink', name: 'Rosada', swatch: '#a13065'},
];
const lightBase = {white: '#ffffff', imageInk: '#424a48', onAccent: '#ffffff', danger: '#963c36', dangerSoft: '#f5e7e2', overlay: '#22261f66'};
const darkBase = {white: '#ffffff', imageInk: '#424a48', danger: '#ffb3ac', dangerSoft: '#432526', overlay: '#00000099'};
const colors: Record<PaletteId, Record<'light' | 'dark', ThemeColors>> = {
  green: {
    light: {...lightBase, background: '#efe9e0', surface: '#e2d9cb', ink: '#22261f', muted: '#5a5c53', accent: '#2e5b44', line: '#d3cbbf', soft: '#f8f5ef', selected: '#dbe7dd'},
    dark: {...darkBase, background: '#101715', surface: '#26332d', soft: '#1a2520', ink: '#eef4ef', muted: '#b2c0b7', accent: '#8cd3aa', onAccent: '#10291c', selected: '#254633', line: '#3b4c40'},
  },
  blue: {
    light: {...lightBase, background: '#edf2f7', surface: '#dde6f0', soft: '#f8fafd', ink: '#1b2736', muted: '#526175', accent: '#2459a6', selected: '#dbe8fa', line: '#c8d4e2'},
    dark: {...darkBase, background: '#111722', surface: '#243246', soft: '#1b2534', ink: '#edf3fc', muted: '#b0bed1', accent: '#8cbcff', onAccent: '#10243e', selected: '#253f63', line: '#3a4b64'},
  },
  orange: {
    light: {...lightBase, background: '#f6efe7', surface: '#eadfd1', soft: '#fffaf4', ink: '#33271f', muted: '#6b5849', accent: '#a54416', selected: '#f8e2d1', line: '#dfcdbb'},
    dark: {...darkBase, background: '#1c1510', surface: '#3b2d22', soft: '#2b211a', ink: '#faf0e6', muted: '#c9b7a7', accent: '#ffb27c', onAccent: '#3a1d09', selected: '#553720', line: '#5a4432'},
  },
  pink: {
    light: {...lightBase, background: '#f7eef2', surface: '#eedee6', soft: '#fff9fc', ink: '#35232e', muted: '#725764', accent: '#a13065', selected: '#f4ddeb', line: '#e0c7d4'},
    dark: {...darkBase, background: '#1c131a', surface: '#3d2935', soft: '#2a1c25', ink: '#f9edf5', muted: '#d0b4c4', accent: '#f6a2c9', onAccent: '#3a1328', selected: '#542d43', line: '#5b3c4f'},
  },
};
export function resolveThemeMode(mode: ThemeMode, system: string | null | undefined): 'light' | 'dark' {
  return mode === 'system' ? system === 'dark' ? 'dark' : 'light' : mode;
}
export function themeColors(palette: PaletteId, mode: 'light' | 'dark') {return colors[palette][mode];}
export function parseAppearance(raw: string): AppearancePreferences {
  try {
    const value = JSON.parse(raw);
    if (value.version !== 1 || !['light', 'dark', 'system'].includes(value.mode) || !PALETTES.some(palette => palette.id === value.palette)) return {...DEFAULT_APPEARANCE};
    return {mode: value.mode, palette: value.palette};
  } catch {return {...DEFAULT_APPEARANCE};}
}
