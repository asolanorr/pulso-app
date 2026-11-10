import React, {useSyncExternalStore} from 'react';
import {Modal, StyleSheet, Text, View} from 'react-native';
import {answerDialog, cancelDialog, dialogSnapshot, serverDialogSnapshot, subscribeDialogs} from './dialogs.web';
import {Button, fonts} from './ui';
import {useTheme} from './theme';

export function DialogHost() {
  const dialog = useSyncExternalStore(subscribeDialogs, dialogSnapshot, serverDialogSnapshot);
  const {colors} = useTheme();
  return <Modal visible={dialog !== null} transparent animationType="fade" onRequestClose={cancelDialog}>
    <View style={[styles.overlay, {backgroundColor: colors.overlay}]}>
      {dialog && <View accessibilityViewIsModal style={[styles.card, {backgroundColor: colors.background}]}>
        <Text accessibilityRole="header" style={[styles.title, {color: colors.ink}]}>{dialog.title}</Text>
        {!!dialog.message && <Text style={[styles.message, {color: colors.ink}]}>{dialog.message}</Text>}
        {dialog.buttons.map((button, index) => <Button key={`${index}:${button.text}`} label={button.text || 'Aceptar'}
          variant={button.style === 'destructive' ? 'danger' : button.style === 'cancel' ? 'secondary' : 'primary'} onPress={() => answerDialog(index)}/>)}
      </View>}
    </View>
  </Modal>;
}
const styles = StyleSheet.create({overlay: {flex: 1, justifyContent: 'center', padding: 24}, card: {width: '100%', maxWidth: 440, alignSelf: 'center', padding: 24, borderRadius: 24, gap: 16}, title: {fontFamily: fonts.display, fontSize: 24, lineHeight: 30}, message: {fontFamily: fonts.body, fontSize: 16, lineHeight: 24}});
