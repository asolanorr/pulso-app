import {PwaSettings} from '../pwa-settings';
import {Alert} from '../dialogs';
import React, {useMemo} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {router} from 'expo-router';
import {Button, Icon, fonts as f} from '../ui';
import {useTheme} from '../theme';
import {PALETTES, ThemeColors, ThemeMode, themeColors} from '../theme-model';
import {useDataReset} from '../data-reset';

const MODES: {id: ThemeMode; label: string; icon: 'sun' | 'moon' | 'smartphone'}[] = [
  {id: 'light', label: 'Claro', icon: 'sun'},
  {id: 'dark', label: 'Oscuro', icon: 'moon'},
  {id: 'system', label: 'Sistema', icon: 'smartphone'},
];
export default function SettingsScreen() {
  const theme = useTheme(), {colors: c, mode, preferences} = theme;
  const s = useMemo(() => createStyles(c), [c]);
  const reset = useDataReset();
  const confirmReset = () => Alert.alert('¿Borrar todos tus datos?', 'Se borrarán las rutinas, las series marcadas, la sesión guardada, las preferencias de apariencia y la caché de GIFs de este dispositivo. No se puede deshacer. El catálogo de ejercicios seguirá disponible.', [
    {text: 'Cancelar', style: 'cancel'}, {text: 'Sí, borrar todo', style: 'destructive', onPress: () => {void reset.resetAll();}},
  ]);
  const back = () => {if (router.canGoBack()) router.back(); else router.replace('/');};
  return <SafeAreaView style={s.screen}>
    <View style={s.topbar}><Button label="Volver" icon="arrow-left" variant="ghost" compact onPress={back}/><Text style={s.topTitle}>Ajustes</Text></View>
    <ScrollView contentContainerStyle={s.content}>
      <View style={s.intro}><Text accessibilityRole="header" style={s.heading}>Apariencia</Text><Text style={s.body}>Elige cómo quieres ver tus rutinas.</Text></View>
      <View style={s.section}>
        <Text accessibilityRole="header" style={s.title}>Tema</Text>
        <View accessibilityRole="radiogroup" accessibilityLabel="Tema de la aplicación" style={s.modeRow}>
          {MODES.map(option => <Pressable key={option.id} accessibilityRole="radio" accessibilityLabel={`Tema ${option.label}`} accessibilityState={{checked: preferences.mode === option.id}}
            onPress={() => theme.setMode(option.id)} style={({pressed}) => [s.modeOption, preferences.mode === option.id && s.selectedOption, pressed && {opacity: 0.7}]}>
            <Icon name={option.icon} size={24} color={preferences.mode === option.id ? c.accent : c.muted}/>
            <Text style={s.optionLabel}>{option.label}</Text>
            <View style={[s.radio, preferences.mode === option.id && s.checkedRadio]}>{preferences.mode === option.id && <View style={s.radioDot}/>}</View>
          </Pressable>)}
        </View>
        <Text accessibilityLiveRegion="polite" style={s.meta}>{preferences.mode === 'system' ? `Sigue la apariencia del teléfono. Ahora: ${mode === 'dark' ? 'oscuro' : 'claro'}.` : 'Este tema se mantendrá aunque cambie la apariencia del teléfono.'}</Text>
      </View>
      <View style={s.section}>
        <Text accessibilityRole="header" style={s.title}>Paleta de colores</Text>
        <View accessibilityRole="radiogroup" accessibilityLabel="Paleta de colores" style={s.paletteGrid}>
          {PALETTES.map(palette => {
            const preview = themeColors(palette.id, mode), selected = preferences.palette === palette.id;
            return <Pressable key={palette.id} accessibilityRole="radio" accessibilityLabel={`Paleta ${palette.name}`} accessibilityState={{checked: selected}} onPress={() => theme.setPalette(palette.id)}
              style={({pressed}) => [s.paletteOption, {backgroundColor: preview.soft}, selected && s.selectedOption, pressed && {opacity: 0.7}]}>
              <View style={s.paletteHeading}><View style={[s.swatch, {backgroundColor: preview.accent}]}>{selected && <Icon name="check" size={18} color={preview.onAccent}/>}</View><Text style={[s.paletteName, {color: preview.ink}]}>{palette.name}</Text></View>
              <View accessible={false} style={[s.miniPreview, {backgroundColor: preview.background}]}><View style={[s.miniLine, {backgroundColor: preview.ink}]}/><View style={[s.miniShortLine, {backgroundColor: preview.muted}]}/><View style={[s.miniButton, {backgroundColor: preview.accent}]}/></View>
            </Pressable>;
          })}
        </View>
      </View>
      <View style={s.previewCard}>
        <View style={s.previewHeading}><Icon name="layers" color={c.accent}/><Text accessibilityRole="header" style={s.title}>Tus rutinas</Text></View>
        <Text style={s.body}>Ejercicios, series y descansos con los colores que elegiste.</Text>
        <View style={s.previewStatus}><Icon name="check-circle" size={18} color={c.accent}/><Text style={s.statusText}>Los cambios se aplican al instante</Text></View>
        <Button label="Ver mis rutinas" icon="arrow-right" onPress={() => router.replace('/')}/>
      </View>
      <View style={s.saveStatus}><Icon name={theme.saveError ? 'alert-circle' : 'check'} size={16} color={theme.saveError ? c.danger : c.muted}/><Text accessibilityLiveRegion="polite" style={[s.meta, theme.saveError && {color: c.danger}]}>{theme.saveError ? 'No se pudo guardar la apariencia. Tu selección podría perderse al cerrar.' : 'Tu preferencia se guarda automáticamente en este teléfono.'}</Text></View>
      <PwaSettings/><View style={s.resetCard}><Text accessibilityRole="header" style={s.title}>Datos de la app</Text><Text style={s.body}>Restablece tus rutinas, el entrenamiento y la apariencia de este dispositivo. Exporta una copia de tus rutinas si quieres conservarlas.</Text><Button label="Borrar todos mis datos" icon="trash-2" variant="danger" disabled={reset.resetting} onPress={confirmReset}/></View>
    </ScrollView>
  </SafeAreaView>;
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  screen: {flex: 1, backgroundColor: c.background}, topbar: {paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8}, topTitle: {fontFamily: f.medium, fontSize: 16, color: c.muted},
  content: {padding: 24, paddingBottom: 40, gap: 28, width: '100%', maxWidth: 720, alignSelf: 'center'}, intro: {gap: 8}, heading: {fontFamily: f.display, fontSize: 38, lineHeight: 44, letterSpacing: -1, color: c.ink},
  title: {fontFamily: f.display, fontSize: 23, lineHeight: 29, color: c.ink}, body: {fontFamily: f.body, fontSize: 16, lineHeight: 24, color: c.ink}, meta: {fontFamily: f.body, fontSize: 14, lineHeight: 21, color: c.muted, flexShrink: 1},
  section: {gap: 16}, modeRow: {flexDirection: 'row', gap: 8}, modeOption: {flex: 1, paddingHorizontal: 8, paddingVertical: 20, minHeight: 128, borderRadius: 20, borderWidth: 2, borderColor: 'transparent', backgroundColor: c.soft, alignItems: 'center', gap: 12},
  selectedOption: {borderColor: c.accent}, optionLabel: {fontFamily: f.medium, fontSize: 15, color: c.ink}, radio: {width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: c.muted, alignItems: 'center', justifyContent: 'center'}, checkedRadio: {borderColor: c.accent}, radioDot: {width: 10, height: 10, borderRadius: 5, backgroundColor: c.accent},
  paletteGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12}, paletteOption: {flexBasis: '45%', flexGrow: 1, borderWidth: 2, borderColor: 'transparent', borderRadius: 20, padding: 16, gap: 16}, paletteHeading: {flexDirection: 'row', alignItems: 'center', gap: 8}, swatch: {width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center'}, paletteName: {fontFamily: f.medium, fontSize: 15, lineHeight: 21, flexShrink: 1},
  miniPreview: {borderRadius: 12, padding: 12, gap: 8}, miniLine: {width: '65%', height: 6, borderRadius: 3}, miniShortLine: {width: '45%', height: 4, borderRadius: 2}, miniButton: {height: 20, borderRadius: 7, marginTop: 4},
  previewCard: {backgroundColor: c.soft, padding: 20, borderRadius: 24, gap: 16}, previewHeading: {flexDirection: 'row', alignItems: 'center', gap: 12}, previewStatus: {flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: c.selected}, statusText: {fontFamily: f.medium, fontSize: 14, lineHeight: 20, color: c.accent, flexShrink: 1},
  saveStatus: {flexDirection: 'row', gap: 8, alignItems: 'flex-start'},
  resetCard: {backgroundColor: c.soft, padding: 20, borderRadius: 24, gap: 16},
});
