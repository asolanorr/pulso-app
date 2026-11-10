import {Alert} from '../dialogs';
import React, {useMemo, useState} from 'react';
import {ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {router} from 'expo-router';
import catalog from '../catalog.json';
import {groupLabel} from '../catalog-utils';
import {Button, ExerciseImage, Icon, IconButton, fonts as f} from '../ui';
import {useTheme} from '../theme';
import {ThemeColors} from '../theme-model';
import {useWorkout} from '../workout-store';
import {ScreenModal} from '../screen-modal';
import {formatTime, nextPending, remainingSeconds, restSeconds, workoutProgress} from '../workout-model';

const byId = new Map(catalog.map(exercise => [exercise.id, exercise]));
export default function WorkoutScreen() {
  const {colors: c} = useTheme();
  const s = useMemo(() => createStyles(c), [c]);
  const training = useWorkout();
  const [choosing, setChoosing] = useState(false);
  const {workout, now} = training;
  const back = () => {if (router.canGoBack()) router.back(); else router.replace('/');};
  if (!training.ready) return <SafeAreaView style={s.screen}><ActivityIndicator color={c.accent}/></SafeAreaView>;
  if (!workout) return <SafeAreaView style={s.screen}><View style={s.content}><Text style={s.heading}>No hay entrenamiento activo</Text><Text style={s.body}>Abre una rutina y pulsa Iniciar rutina.</Text><Button label="Mis rutinas" icon="arrow-left" onPress={() => router.replace('/')}/></View></SafeAreaView>;

  const progress = workoutProgress(workout), allDone = progress.done === progress.total;
  const index = workout.routine.entries.findIndex(entry => entry.id === workout.currentEntryId);
  const entry = workout.routine.entries[index];
  const exercise = byId.get(entry.exerciseId)!;
  const completed = workout.completed[entry.id];
  const seconds = restSeconds(entry);
  const remaining = workout.rest ? remainingSeconds(workout.rest.endsAt, now) : 0;
  const next = nextPending(workout);
  const finish = () => {
    if (allDone) training.finish();
    else Alert.alert('¿Finalizar este entrenamiento?', `Llevas ${progress.done} de ${progress.total} series. Las pendientes no se marcarán como realizadas.`, [
      {text: 'Continuar', style: 'cancel'}, {text: 'Finalizar', onPress: training.finish},
    ]);
  };

  return <SafeAreaView style={s.screen}>
    <View style={s.topbar}><Button label="Rutinas" icon="arrow-left" variant="ghost" compact onPress={back}/><Text style={s.meta}>{workout.finishedAt === null ? 'Entrenamiento' : 'Resumen'}</Text></View>
    {training.saveError && <Text accessibilityRole="alert" style={s.warning}>No se pudo guardar el progreso. Mantén la app abierta para conservar esta sesión.</Text>}
    {workout.finishedAt !== null ? <ScrollView contentContainerStyle={s.content}>
      <View style={s.completeIcon}><Icon name="check" size={32} color={c.accent}/></View>
      <Text accessibilityRole="header" style={s.heading}>Entrenamiento finalizado</Text><Text style={s.body}>{workout.routine.name}</Text>
      <View style={s.metricRow}><View style={s.metric}><Text style={s.metricValue}>{progress.done}/{progress.total}</Text><Text style={s.meta}>Series realizadas</Text></View><View style={s.metric}><Text style={s.metricValue}>{formatTime((workout.finishedAt - workout.startedAt) / 1000)}</Text><Text style={s.meta}>Tiempo de sesión</Text></View></View>
      {workout.routine.entries.map(item => <View key={item.id} style={s.summaryRow}><View style={s.flex}><Text style={s.rowTitle}>{byId.get(item.exerciseId)!.name}</Text><Text style={s.meta}>{item.reps || '—'} reps por serie</Text></View><Text style={s.rowTitle}>{workout.completed[item.id].filter(Boolean).length}/{workout.completed[item.id].length}</Text></View>)}
      {!allDone && <Text style={s.meta}>Se conservaron únicamente las series que marcaste. La rutina original no cambió.</Text>}
      <Button label="Volver a mis rutinas" icon="arrow-left" onPress={() => router.replace('/')}/>
    </ScrollView> : <>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
        <Text style={s.meta}>{workout.routine.name}</Text>
        <View style={s.spread}><Text style={s.body}>{progress.done} de {progress.total} series realizadas</Text><Text style={s.meta}>{Math.round(progress.done / progress.total * 100)}%</Text></View>
        <View accessibilityRole="progressbar" accessibilityValue={{min: 0, max: progress.total, now: progress.done}} style={s.progressTrack}><View style={[s.progressFill, {width: `${progress.done / progress.total * 100}%`}]}/></View>
        <View style={s.spread}><Text style={s.meta}>Ejercicio {index + 1} de {workout.routine.entries.length}</Text><Button label="Cambiar ejercicio" icon="list" variant="ghost" compact onPress={() => setChoosing(true)}/></View>
        <View style={s.exerciseCard}>
          <Text style={s.meta}>{groupLabel(exercise.group)}</Text><Text accessibilityRole="header" style={s.heading}>{exercise.name}</Text>
          <ExerciseImage key={entry.id} exercise={exercise}/>
          <View style={s.metricRow}><View style={s.metric}><Text style={s.metricValue}>{completed.length}</Text><Text style={s.meta}>Series</Text></View><View style={s.metric}><Text style={s.metricValue}>{entry.reps || '—'}</Text><Text style={s.meta}>Reps</Text></View><View style={s.metric}><Text style={s.metricValue}>{formatTime(seconds)}</Text><Text style={s.meta}>Descanso</Text></View></View>
          {!!entry.notes.trim() && <Text style={s.body}>{entry.notes}</Text>}
        </View>
        <View style={s.spread}><Text accessibilityRole="header" style={s.title}>Tus series</Text><Text style={s.meta}>{completed.filter(Boolean).length}/{completed.length} realizadas</Text></View>
        {completed.map((done, setIndex) => <Pressable key={`${entry.id}:${setIndex}`} accessibilityRole="checkbox" accessibilityState={{checked: done}} accessibilityLabel={`Serie ${setIndex + 1}, ${entry.reps} repeticiones`} onPress={() => training.mark(entry.id, setIndex)} style={({pressed}) => [s.setRow, done && s.completedSet, pressed && {opacity: 0.65}]}>
          <View style={[s.checkbox, done && s.checked]}>{done && <Icon name="check" color={c.onAccent} size={18}/>}</View><Text style={s.rowTitle}>Serie {setIndex + 1}</Text><Text style={s.setReps}>{entry.reps || '—'} reps</Text><Text style={s.meta}>{done ? 'Hecha' : 'Marcar'}</Text>
        </Pressable>)}
        <View style={s.restCard}>
          {workout.rest ? <>
            <View style={s.spread}><Text style={s.title}>{remaining > 0 ? 'Descanso' : 'Descanso terminado'}</Text><Icon name={remaining > 0 ? 'clock' : 'check-circle'} color={c.accent}/></View>
            <Text style={s.meta}>{byId.get(workout.routine.entries.find(item => item.id === workout.rest!.entryId)!.exerciseId)!.name}</Text>
            <Text accessibilityLabel={`${remaining} segundos restantes`} style={s.timer}>{formatTime(remaining)}</Text>
            {remaining === 0 && <Text accessibilityRole="alert" style={s.body}>Puedes continuar con tu siguiente serie.</Text>}
            <Button label={remaining > 0 ? 'Saltar descanso' : 'Cerrar descanso'} variant="secondary" icon={remaining > 0 ? 'skip-forward' : 'check'} onPress={training.cancelRest}/>
          </> : seconds > 0 ? <><Text style={s.title}>Descanso entre series</Text><Text style={s.body}>Activa el temporizador cuando termines una serie.</Text><Button label={`Descansar ${formatTime(seconds)}`} icon="clock" variant="secondary" onPress={() => {void training.startRest();}}/></>
            : <><Text style={s.title}>Sin descanso configurado</Text><Text style={s.body}>Puedes añadir los segundos de descanso desde Editar rutina.</Text></>}
          {!!training.restNotice && <Text style={s.meta}>{training.restNotice}</Text>}
        </View>
      </ScrollView>
      <View style={s.actionBar}><Button label={allDone ? 'Finalizar rutina' : next && next !== entry.id ? 'Siguiente pendiente' : 'Completa las series'} icon={allDone ? 'check' : 'arrow-right'} disabled={!allDone && next === entry.id} onPress={allDone ? finish : training.advance}/>
        {!allDone && <Button label="Finalizar antes" variant="ghost" compact onPress={finish}/>}</View>
    </>}

    <ScreenModal visible={choosing} onRequestClose={() => setChoosing(false)}>
      <View style={s.topbar}><Text style={s.title}>Elegir ejercicio</Text><IconButton name="x" label="Cerrar lista de ejercicios" onPress={() => setChoosing(false)}/></View>
      <ScrollView contentContainerStyle={s.content}><Text style={s.body}>¿Máquina ocupada? Continúa con otro ejercicio. El orden guardado de la rutina se conserva.</Text>
        {workout.routine.entries.map((item, itemIndex) => {
          const marks = workout.completed[item.id], done = marks.filter(Boolean).length;
          return <Pressable key={item.id} accessibilityRole="button" accessibilityState={{selected: item.id === workout.currentEntryId}} accessibilityLabel={`Ejercicio ${itemIndex + 1}, ${byId.get(item.exerciseId)!.name}, ${done} de ${marks.length} series realizadas`} onPress={() => {training.choose(item.id); setChoosing(false);}} style={({pressed}) => [s.exerciseChoice, item.id === entry.id && s.selectedChoice, pressed && {opacity: 0.7}]}>
            <Text style={s.choiceIndex}>{itemIndex + 1}</Text><View style={s.flex}><Text style={s.rowTitle}>{byId.get(item.exerciseId)!.name}</Text><Text style={s.meta}>{done}/{marks.length} series realizadas</Text></View><Icon name={done === marks.length ? 'check-circle' : item.id === entry.id ? 'play' : 'chevron-right'} color={c.accent}/>
          </Pressable>;
        })}
      </ScrollView>
    </ScreenModal>
  </SafeAreaView>;
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  screen: {flex: 1, backgroundColor: c.background}, flex: {flex: 1}, content: {padding: 24, paddingBottom: 32, gap: 16, width: '100%', maxWidth: 720, alignSelf: 'center'},
  topbar: {paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8},
  heading: {fontFamily: f.display, color: c.ink, fontSize: 30, lineHeight: 36, letterSpacing: -0.8}, title: {fontFamily: f.display, color: c.ink, fontSize: 23, lineHeight: 29},
  body: {fontFamily: f.body, color: c.ink, fontSize: 16, lineHeight: 24}, meta: {fontFamily: f.body, color: c.muted, fontSize: 14, lineHeight: 20, flexShrink: 1},
  spread: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8}, exerciseCard: {backgroundColor: c.soft, padding: 16, borderRadius: 24, gap: 16},
  progressTrack: {height: 6, borderRadius: 3, backgroundColor: c.surface, overflow: 'hidden'}, progressFill: {height: '100%', borderRadius: 3, backgroundColor: c.accent},
  metricRow: {flexDirection: 'row', gap: 8}, metric: {flex: 1, backgroundColor: c.background, borderRadius: 12, padding: 12, gap: 4}, metricValue: {fontFamily: f.medium, fontSize: 20, lineHeight: 26, color: c.ink},
  setRow: {minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, backgroundColor: c.soft}, completedSet: {backgroundColor: c.selected},
  checkbox: {width: 28, height: 28, borderRadius: 9, borderWidth: 1, borderColor: c.muted, alignItems: 'center', justifyContent: 'center'}, checked: {backgroundColor: c.accent, borderColor: c.accent}, rowTitle: {fontFamily: f.medium, fontSize: 16, lineHeight: 22, color: c.ink, flexShrink: 1}, setReps: {flex: 1, fontFamily: f.body, fontSize: 15, lineHeight: 21, color: c.muted, textAlign: 'right'},
  restCard: {padding: 20, gap: 12, borderRadius: 24, backgroundColor: c.soft}, timer: {fontFamily: f.display, color: c.accent, fontSize: 64, lineHeight: 72, textAlign: 'center', fontVariant: ['tabular-nums']},
  actionBar: {paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8, gap: 4, width: '100%', maxWidth: 720, alignSelf: 'center'}, warning: {fontFamily: f.body, fontSize: 14, padding: 16, backgroundColor: c.dangerSoft, color: c.danger},
  completeIcon: {width: 72, height: 72, borderRadius: 24, backgroundColor: c.selected, alignItems: 'center', justifyContent: 'center'}, summaryRow: {flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderRadius: 16, backgroundColor: c.soft},
  exerciseChoice: {flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 20, backgroundColor: c.soft, minHeight: 72}, selectedChoice: {backgroundColor: c.selected}, choiceIndex: {fontFamily: f.medium, fontSize: 18, width: 24, color: c.accent},
});
