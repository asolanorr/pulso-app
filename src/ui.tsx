import React, {ComponentProps, useMemo, useState} from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, View} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import {Image} from 'expo-image';
import {Exercise} from './model';
import {useTheme} from './theme';
import {ThemeColors} from './theme-model';
export const fonts = {body: 'FunnelSans_400Regular', medium: 'FunnelSans_500Medium', bold: 'FunnelSans_600SemiBold', display: 'FunnelDisplay_500Medium'};
type IconName = ComponentProps<typeof Feather>['name'];

function useUi() {
  const {colors} = useTheme();
  const ui = useMemo(() => createUi(colors), [colors]);
  return {colors, ui};
}
export function Icon({name, size = 20, color}: {name: IconName; size?: number; color?: string}) {
  const {colors} = useTheme();
  return <Feather name={name} size={size} color={color ?? colors.ink} accessible={false}/>;
}

export function Button({label, onPress, icon, variant = 'primary', disabled = false, compact = false}: {
  label: string; onPress: () => void; icon?: IconName;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; disabled?: boolean; compact?: boolean;
}) {
  const {colors, ui} = useUi();
  const foreground = variant === 'primary' ? colors.onAccent : variant === 'danger' ? colors.danger : colors.ink;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled}} disabled={disabled} onPress={onPress}
    style={({pressed}) => [ui.button, ui[variant], compact && ui.compact, disabled && {opacity: 0.4}, pressed && !disabled && {transform: [{scale: 0.98}], opacity: 0.8}]}>
    {icon && <Icon name={icon} color={foreground} size={18}/>}
    <Text style={[ui.buttonLabel, {color: foreground}]}>{label}</Text>
  </Pressable>;
}

export function IconButton({name, label, onPress, disabled = false}: {name: IconName; label: string; onPress: () => void; disabled?: boolean}) {
  const {colors, ui} = useUi();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled}} disabled={disabled} onPress={onPress}
    style={({pressed}) => [ui.iconButton, disabled && {opacity: 0.25}, pressed && {backgroundColor: colors.surface}]}>
    <Icon name={name}/>
  </Pressable>;
}

export function ExerciseImage({exercise, thumbnail = false, large = false}: {exercise: Exercise; thumbnail?: boolean; large?: boolean}) {
  const {colors, ui} = useUi();
  const [failed, setFailed] = useState(false), [loading, setLoading] = useState(true);
  return <View style={[ui.imageBox, thumbnail ? ui.thumbnail : ui.example, large && {height: undefined, aspectRatio: 1}]}>
    {failed ? <View style={ui.imageError}>
      <Icon name="image" color={colors.imageInk}/>
      {!thumbnail && <><Text style={ui.errorText}>No se pudo cargar el ejemplo.</Text><Button label="Reintentar GIF" compact variant="secondary" onPress={() => {setFailed(false); setLoading(true);}}/></>}
    </View> : <>
      <Image source={{uri: exercise.gif}} accessibilityLabel={thumbnail ? undefined : `Demostración de ${exercise.name}`}
        accessible={!thumbnail} style={StyleSheet.absoluteFill} contentFit="contain" autoplay={!thumbnail} cachePolicy="disk"
        recyclingKey={exercise.id} onLoad={() => setLoading(false)} onError={() => {setFailed(true); setLoading(false);}}/>
      {loading && !thumbnail && <View pointerEvents="none" style={ui.imageError}><ActivityIndicator color={colors.accent}/></View>}
    </>}
  </View>;
}

const createUi = (colors: ThemeColors) => StyleSheet.create({
  button: {minHeight: 52, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8},
  buttonLabel: {fontFamily: fonts.bold, fontSize: 16, flexShrink: 1, textAlign: 'center'},
  primary: {backgroundColor: colors.accent}, secondary: {backgroundColor: colors.surface}, ghost: {backgroundColor: 'transparent'}, danger: {backgroundColor: colors.dangerSoft},
  compact: {minHeight: 44, paddingHorizontal: 12, paddingVertical: 10},
  iconButton: {width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
  imageBox: {backgroundColor: colors.white, overflow: 'hidden'}, thumbnail: {width: 68, height: 68, borderRadius: 14},
  example: {width: '100%', height: 200, borderRadius: 16}, imageError: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 12, gap: 12},
  errorText: {fontFamily: fonts.body, color: colors.imageInk, fontSize: 14, textAlign: 'center'},
});
