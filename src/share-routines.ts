import {Share} from 'react-native';
export async function shareRoutines(name: string, content: string) {
  await Share.share({title: name, message: content});
}
