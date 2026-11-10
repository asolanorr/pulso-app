import {DialogHost} from '../dialog-host';
import {PwaSettingsRegistration} from '../pwa-registration';
import React, {useEffect} from 'react';
import {ActivityIndicator, Text, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {useFonts} from 'expo-font';
import Feather from '@expo/vector-icons/Feather';
import {FunnelSans_400Regular} from '@expo-google-fonts/funnel-sans/400Regular';
import {FunnelSans_500Medium} from '@expo-google-fonts/funnel-sans/500Medium';
import {FunnelSans_600SemiBold} from '@expo-google-fonts/funnel-sans/600SemiBold';
import {FunnelDisplay_500Medium} from '@expo-google-fonts/funnel-display/500Medium';
import {RoutineProvider} from '../routine-store';
import {WorkoutProvider} from '../workout-store';
import * as SystemUI from 'expo-system-ui';
import {ThemeProvider, useTheme} from '../theme';
import {DataResetProvider} from '../data-reset';

export default function Layout() {
  return <SafeAreaProvider><DataResetProvider><ThemeProvider><AppShell/><DialogHost/><PwaSettingsRegistration/></ThemeProvider></DataResetProvider></SafeAreaProvider>;
}
function AppShell() {
  const {colors, mode, ready} = useTheme();
  useEffect(() => {SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});}, [colors.background]);
  const [loaded, error] = useFonts({FunnelSans_400Regular, FunnelSans_500Medium, FunnelSans_600SemiBold, FunnelDisplay_500Medium, ...Feather.font});
  return <><StatusBar style={mode === 'dark' ? 'light' : 'dark'}/>
    {(!loaded && !error) || !ready ? <View style={{flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: 16}}><ActivityIndicator color={colors.accent}/><Text style={{color: colors.ink}}>Cargando Pulso…</Text></View>
      : <RoutineProvider><WorkoutProvider><Stack screenOptions={{headerShown: false, contentStyle: {backgroundColor: colors.background}}}/></WorkoutProvider></RoutineProvider>}
  </>;
}
