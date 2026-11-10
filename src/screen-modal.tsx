import React from 'react';
import {Modal} from 'react-native';
import {SafeAreaProvider, SafeAreaView, useSafeAreaFrame, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from './theme';

// Native modals own a separate window: measure their safe area inside that window.
// Seed it from the current screen to avoid drawing under the status bar on opening.
export function ScreenModal({visible, onRequestClose, children}: {
  visible: boolean; onRequestClose: () => void; children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets(), frame = useSafeAreaFrame();
  const {colors} = useTheme();
  return <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" statusBarTranslucent navigationBarTranslucent onRequestClose={onRequestClose}>
    <SafeAreaProvider initialMetrics={{frame, insets}}>
      <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={{flex: 1, backgroundColor: colors.background}}>{children}</SafeAreaView>
    </SafeAreaProvider>
  </Modal>;
}
