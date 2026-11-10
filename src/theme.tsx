import React, {createContext, useContext, useEffect, useRef, useState} from 'react';
import {useColorScheme} from 'react-native';
import {readData, storageEpoch, writeData} from './app-storage';
import {AppearancePreferences, DEFAULT_APPEARANCE, PaletteId, ThemeColors, ThemeMode, parseAppearance, resolveThemeMode, themeColors} from './theme-model';

type Theme = {
  preferences: AppearancePreferences; mode: 'light' | 'dark'; colors: ThemeColors;
  ready: boolean; saveError: boolean; setMode: (mode: ThemeMode) => void; setPalette: (palette: PaletteId) => void;
};
const Context = createContext<Theme | null>(null);
const KEY = '@pulso/appearance/v1';
export function ThemeProvider({children}: {children: React.ReactNode}) {
  const [preferences, setPreferences] = useState<AppearancePreferences>(DEFAULT_APPEARANCE);
  const [ready, setReady] = useState(false), [saveError, setSaveError] = useState(false), [readFailed, setReadFailed] = useState(false);
  const queue = useRef(Promise.resolve());
  const epoch = useRef(storageEpoch());
  const system = useColorScheme();
  const mode = resolveThemeMode(preferences.mode, system);
  useEffect(() => {
    readData(KEY).then(raw => {if (raw) setPreferences(parseAppearance(raw));})
      .catch(() => {setReadFailed(true); setSaveError(true);}).finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (!ready || readFailed) return;
    const raw = JSON.stringify({version: 1, ...preferences});
    queue.current = queue.current.then(() => writeData(KEY, raw, epoch.current)).then(() => setSaveError(false)).catch(() => setSaveError(true));
  }, [preferences, ready, readFailed]);
  const setMode = (value: ThemeMode) => {setReadFailed(false); setPreferences(current => ({...current, mode: value}));};
  const setPalette = (value: PaletteId) => {setReadFailed(false); setPreferences(current => ({...current, palette: value}));};
  return <Context.Provider value={{preferences, mode, colors: themeColors(preferences.palette, mode), ready, saveError, setMode, setPalette}}>{children}</Context.Provider>;
}
export function useTheme() {
  const value = useContext(Context);
  if (!value) throw Error('ThemeProvider missing');
  return value;
}
