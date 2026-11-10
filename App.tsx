import React, {useMemo, useState} from 'react';
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Linking, Modal,
  Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {router, useLocalSearchParams} from 'expo-router';
import data from './src/catalog.json';
import {Entry, Exercise, Routine, parseRoutines, uid} from './src/model';
import {ALL_GROUPS, filterExercises, getGroupOptions, groupLabel} from './src/catalog-utils';
import {Button, ExerciseImage, Icon, IconButton, fonts as f} from './src/ui';
import {useTheme} from './src/theme';
import {ThemeColors} from './src/theme-model';
import {useRoutines} from './src/routine-store';
import {useWorkout} from './src/workout-store';
import {ScreenModal} from './src/screen-modal';
import mondayExample from './src/examples/monday-chest-triceps.json';

const catalog: Exercise[] = data;
const byId = new Map(catalog.map(exercise => [exercise.id, exercise]));
const groups = getGroupOptions(catalog);
export default function App() {
  const {colors: c, mode: themeMode} = useTheme();
  const s = useMemo(() => createStyles(c), [c]);
  const {routines, setRoutines, ready, blocked, saveError} = useRoutines();
  const training = useWorkout();
  const params = useLocalSearchParams<{routineId?: string; mode?: string}>();
  const selected = typeof params.routineId === 'string' ? params.routineId : null;
  const editing = params.mode === 'edit';
  const setSelected = (id: string | null, edit = false) => {
    if (id) router.push({pathname: '/', params: {routineId: id, mode: edit ? 'edit' : 'view'}});
    else router.replace('/');
  };
  const [picker, setPicker] = useState(false), [preview, setPreview] = useState<Exercise | null>(null);
  const [query, setQuery] = useState(''), [group, setGroup] = useState(ALL_GROUPS);
  const [naming, setNaming] = useState<'new' | 'rename' | null>(null), [name, setName] = useState('');
  const [importing, setImporting] = useState(false), [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const routine = routines.find(item => item.id === selected);
  const filtered = useMemo(() => filterExercises(catalog, group, query), [group, query]);
  const entryCounts = new Map<string, number>();
  for (const entry of routine?.entries ?? []) entryCounts.set(entry.exerciseId, (entryCounts.get(entry.exerciseId) ?? 0) + 1);
  const totalExercises = routines.reduce((sum, item) => sum + item.entries.length, 0);
  const update = (change: (item: Routine) => Routine) => setRoutines(all => all.map(item => item.id === selected ? change(item) : item));
  const edit = (id: string, patch: Partial<Entry>) => update(item => ({...item, entries: item.entries.map(entry => entry.id === id ? {...entry, ...patch} : entry)}));
  const move = (index: number, delta: number) => update(item => {
    const entries = [...item.entries], target = index + delta;
    if (target < 0 || target >= entries.length) return item;
    [entries[index], entries[target]] = [entries[target], entries[index]];
    return {...item, entries};
  });
  const openSource = (exercise: Exercise) => {
    Linking.openURL(exercise.url).catch(() => Alert.alert('No se pudo abrir FitCron', 'Revisa la conexión e inténtalo de nuevo.'));
  };
  const createRoutine = () => {setName(''); setNaming('new');};
  const renameRoutine = () => {setName(routine?.name ?? ''); setNaming('rename');};
  const saveName = () => {
    if (!name.trim()) return;
    if (naming === 'new') {
      const item: Routine = {id: uid(), name: name.trim(), entries: []};
      setRoutines(all => [...all, item]); setSelected(item.id, true);
    } else update(item => ({...item, name: name.trim()}));
    setNaming(null);
  };
  const share = async () => {
    try {await Share.share({title: routine?.name ?? 'Mis rutinas', message: JSON.stringify({version: 1, routines: routine ? [routine] : routines}, null, 2)});}
    catch {Alert.alert('No se pudo compartir', 'Tus rutinas siguen guardadas. Vuelve a intentarlo.');}
  };
  const importNow = () => {
    try {
      const incoming = parseRoutines(importText, new Set(byId.keys()));
      if (!incoming.length) throw Error('No routines');
      setRoutines(all => [...all, ...incoming]); setImporting(false); setImportText(''); setImportError('');
      Alert.alert('Rutinas importadas', `${incoming.length} rutinas añadidas sin reemplazar las tuyas.`);
    } catch {setImportError('No pudimos leer la rutina. Pega el texto completo compartido desde Pulso.');}
  };
  const duplicateRoutine = () => {
    if (!routine) return;
    const copy = {...routine, id: uid(), name: `${routine.name} (copia)`.slice(0, 100), entries: routine.entries.map(entry => ({...entry, id: uid()}))};
    setRoutines(all => [...all, copy]); setSelected(copy.id);
  };
  const deleteRoutine = () => {
    if (!routine) return;
    Alert.alert('¿Eliminar esta rutina?', `Se eliminará «${routine.name}» de este teléfono.`, [
      {text: 'Cancelar', style: 'cancel'}, {text: 'Eliminar', style: 'destructive', onPress: () => {setRoutines(all => all.filter(item => item.id !== routine.id)); setSelected(null);}},
    ]);
  };
  const addExercise = (exercise: Exercise) => update(item => ({...item, entries: [...item.entries, {id: uid(), exerciseId: exercise.id, sets: '3', reps: '10–12', rest: '90', notes: ''}]}));
  const startTraining = () => {
    if (!routine) return;
    const start = () => {
      try {training.begin(routine); router.push('/workout');}
      catch (error) {Alert.alert('Revisa la rutina', (error as Error).message);}
    };
    if (training.workout?.finishedAt === null) {
      if (training.workout.routine.id === routine.id) {router.push('/workout'); return;}
      Alert.alert('Tienes un entrenamiento en curso', 'Puedes retomarlo o reemplazarlo por esta rutina.', [
        {text: 'Cancelar', style: 'cancel'}, {text: 'Retomar', onPress: () => router.push('/workout')},
        {text: 'Iniciar otro', style: 'destructive', onPress: start},
      ]);
    } else start();
  };

  const renderEntry = ({item: entry, index}: {item: Entry; index: number}) => {
    const exercise = byId.get(entry.exerciseId)!;
    return <View style={s.exerciseCard}>
      <View style={s.spread}>
        <Text style={s.meta}>{groupLabel(exercise.group)}</Text>
        {editing && <View style={s.row}>
          <IconButton name="arrow-up" label={`Subir ${exercise.name}`} disabled={index === 0} onPress={() => move(index, -1)}/>
          <IconButton name="arrow-down" label={`Bajar ${exercise.name}`} disabled={index === (routine?.entries.length ?? 0) - 1} onPress={() => move(index, 1)}/>
        </View>}
      </View>
      <Text accessibilityRole="header" style={s.cardTitle}>{exercise.name}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Ampliar ejemplo de ${exercise.name}`} onPress={() => setPreview(exercise)} style={({pressed}) => pressed && {opacity: 0.8}}>
        <ExerciseImage exercise={exercise}/>
        <View style={s.expandIcon}><Icon name="maximize-2" size={16}/></View>
      </Pressable>
      {editing ? <><View style={s.fieldRow}>
        {(['sets', 'reps', 'rest'] as const).map((field, i) => <View key={field} style={s.flex}>
          <Text style={s.fieldLabel}>{['Series', 'Reps', 'Descanso (s)'][i]}</Text>
          <TextInput keyboardAppearance={themeMode} accessibilityLabel={`${['Series', 'Repeticiones', 'Descanso en segundos'][i]} de ${exercise.name}`} style={s.numberInput}
            value={entry[field]} maxLength={20} selectTextOnFocus keyboardType={field === 'reps' ? 'default' : 'number-pad'}
            onChangeText={value => edit(entry.id, {[field]: value})}/>
        </View>)}
      </View>
      <View style={{gap: 8}}><Text style={s.fieldLabel}>Notas</Text>
        <TextInput keyboardAppearance={themeMode} accessibilityLabel={`Notas de ${exercise.name}`} placeholder="Peso, técnica o progresión" placeholderTextColor={c.muted}
          style={[s.input, s.notes]} multiline maxLength={2000} value={entry.notes} onChangeText={notes => edit(entry.id, {notes})}/>
      </View>
      <View style={s.spread}>
        <Button label="Ver técnica" icon="external-link" variant="ghost" compact onPress={() => openSource(exercise)}/>
        <IconButton name="trash-2" label={`Quitar ${exercise.name}`} onPress={() => Alert.alert('¿Quitar este ejercicio?', exercise.name, [
          {text: 'Cancelar', style: 'cancel'}, {text: 'Quitar', style: 'destructive', onPress: () => update(item => ({...item, entries: item.entries.filter(value => value.id !== entry.id)}))},
        ])}/>
      </View>
      </> : <>
        <View style={s.fieldRow}>
          {[{label: 'Series', value: entry.sets || '—'}, {label: 'Reps', value: entry.reps || '—'},
            {label: 'Descanso', value: !entry.rest.trim() || Number(entry.rest) === 0 ? 'Sin descanso' : `${entry.rest} s`}].map(metric => <View key={metric.label} style={s.readMetric}>
              <Text style={s.fieldLabel}>{metric.label}</Text><Text style={s.readValue}>{metric.value}</Text>
            </View>)}
        </View>
        {!!entry.notes.trim() && <View style={{gap: 4}}><Text style={s.fieldLabel}>Notas</Text><Text style={s.body}>{entry.notes}</Text></View>}
        <Button label="Ver técnica" icon="external-link" variant="ghost" compact onPress={() => openSource(exercise)}/>
      </>}
    </View>;
  };

  return <SafeAreaView style={s.screen} edges={['top', 'left', 'right', 'bottom']}>
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.topbar}>
        <View style={s.brandRow}><View accessible={false} style={s.mark}><View style={s.markBar}/><View style={[s.markBar, {height: 23}]}/><View style={s.markBar}/></View><Text style={s.brand}>pulso</Text></View>
        <Button label="Ajustes" icon="settings" variant="ghost" compact onPress={() => router.push('/settings')}/>
      </View>
      {saveError && <Text accessibilityRole="alert" style={s.warning}>No se guardaron los últimos cambios. Comparte una copia antes de cerrar.</Text>}
      {training.blocked && <Text accessibilityRole="alert" style={s.warning}>No pudimos recuperar el entrenamiento anterior. Reinicia la app antes de iniciar otro.</Text>}
      {!ready ? <View style={s.loading}><ActivityIndicator color={c.accent}/><Text style={s.body}>Cargando tus rutinas…</Text></View>
      : blocked ? <View style={s.content}><Text style={s.heading}>Tus datos se conservaron</Text><Text style={s.body}>No pudimos leer el almacenamiento. Cierra y vuelve a abrir la app para reintentar.</Text></View>
      : !routine ? <>
        <FlatList data={routines} keyExtractor={item => item.id} contentContainerStyle={s.content}
          ListHeaderComponent={<View style={s.homeHeading}>
            <Text accessibilityRole="header" style={s.heading}>Mis rutinas</Text>
            <Text style={s.body}>Organiza los ejercicios de tu próxima sesión.</Text>
            <View style={s.summary}><Text style={s.summaryText}>{routines.length} {routines.length === 1 ? 'rutina' : 'rutinas'}</Text><View style={s.dot}/><Text style={s.summaryText}>{totalExercises} ejercicios añadidos</Text></View>
            {training.workout && <View style={s.resumeCard}><Text style={s.routineTitle}>{training.workout.finishedAt === null ? 'Entrenamiento en curso' : 'Último entrenamiento'}</Text><Text style={s.body}>{training.workout.routine.name}</Text><Button label={training.workout.finishedAt === null ? 'Retomar entrenamiento' : 'Ver resumen'} icon="play" variant="secondary" onPress={() => router.push('/workout')}/></View>}
          </View>}
          ListEmptyComponent={<View style={s.emptyCard}>
            <View style={s.emptySymbol}><Icon name="layers" size={30} color={c.accent}/></View>
            <Text style={s.cardTitle}>Tu primera rutina</Text>
            <Text style={[s.body, {textAlign: 'center'}]}>Elige entre {catalog.length} ejercicios y ajusta las series a tu entrenamiento.</Text>
          </View>}
          renderItem={({item}) => {
            const first = item.entries[0] ? byId.get(item.entries[0].exerciseId) : undefined;
            const muscleGroups = [...new Set(item.entries.map(entry => groupLabel(byId.get(entry.exerciseId)!.group)))];
            return <Pressable accessibilityRole="button" accessibilityLabel={`Abrir rutina ${item.name}`} onPress={() => setSelected(item.id)} style={({pressed}) => [s.routineCard, pressed && {backgroundColor: c.surface}]}>
              {first ? <ExerciseImage exercise={first} thumbnail/> : <View style={s.routinePlaceholder}><Icon name="layers" color={c.accent} size={25}/></View>}
              <View style={[s.flex, {gap: 4}]}><Text style={s.routineTitle}>{item.name}</Text><Text style={s.meta}>{item.entries.length} ejercicios · {item.entries.reduce((sum, entry) => sum + (Number(entry.sets) || 0), 0)} series</Text>
                {!!muscleGroups.length && <Text style={s.groupText} numberOfLines={1}>{muscleGroups.join(' · ')}</Text>}
              </View><Icon name="chevron-right" size={20} color={c.muted}/>
            </Pressable>;
          }}
          ListFooterComponent={<View style={s.homeFooter}>
            <View style={s.row}><View style={s.flex}><Button label="Importar rutina" variant="secondary" icon="download" onPress={() => {setImportError(''); setImporting(true);}}/></View><IconButton name="upload" label="Compartir todas las rutinas" disabled={!routines.length} onPress={share}/></View>
            <Text style={s.footerNote}>Guardado local automático. Comparte una copia para usarla en otro teléfono.</Text>
          </View>}/>
        <View style={s.actionBar}><Button label="Crear rutina" icon="plus" onPress={createRoutine}/></View>
      </> : <>
        <View style={s.detailNav}><Button label="Mis rutinas" icon="arrow-left" variant="ghost" compact onPress={() => setSelected(null)}/><IconButton name="share" label="Compartir esta rutina" onPress={share}/></View>
        <FlatList data={routine.entries} keyExtractor={entry => entry.id} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={s.content}
          ListHeaderComponent={<View style={s.detailHeading}>
            <Text accessibilityRole="header" style={s.heading}>{routine.name}</Text>
            <View style={s.spread}><Text style={s.meta}>{routine.entries.length} ejercicios · {routine.entries.reduce((sum, entry) => sum + (Number(entry.sets) || 0), 0)} series</Text>
              {editing ? <Button label="Renombrar" icon="edit-2" variant="ghost" compact onPress={renameRoutine}/> : <Button label="Editar rutina" icon="edit-2" variant="ghost" compact onPress={() => router.setParams({mode: 'edit'})}/>}
            </View>
            {editing && <Text style={s.meta}>Modo edición · Los cambios se guardan automáticamente.</Text>}
          </View>}
          renderItem={renderEntry}
          ListEmptyComponent={<View style={s.emptyCard}><Pressable accessibilityRole="button" accessibilityLabel="Añadir ejercicios a esta rutina" style={({pressed}) => [s.emptySymbol, pressed && {opacity: 0.7}]} onPress={() => {if (!editing) router.setParams({mode: 'edit'}); setPicker(true);}}><Icon name="plus" size={28} color={c.accent}/></Pressable><Text style={s.cardTitle}>{editing ? 'Añade tus ejercicios' : 'Esta rutina está vacía'}</Text><Text style={[s.body, {textAlign: 'center'}]}>{editing ? 'Busca por nombre o grupo muscular. Cada ejercicio incluye su ejemplo.' : 'Pulsa + para añadir los ejercicios de tu sesión.'}</Text></View>}
          ListFooterComponent={editing ? <View style={s.detailFooter}><Button label="Duplicar rutina" icon="copy" variant="secondary" onPress={duplicateRoutine}/><Button label="Eliminar rutina" icon="trash-2" variant="ghost" onPress={deleteRoutine}/></View> : undefined}/>
        <View style={s.actionBar}>{editing ? <View style={{gap: 8}}><Button label="Añadir ejercicios" icon="plus" variant="secondary" onPress={() => setPicker(true)}/><Button label="Listo · Ver rutina" icon="check" onPress={() => router.setParams({mode: 'view'})}/></View>
          : <Button label={training.workout?.routine.id === routine.id && training.workout.finishedAt === null ? 'Retomar entrenamiento' : 'Iniciar rutina'} icon="play" disabled={!routine.entries.length || !training.ready || training.blocked} onPress={startTraining}/>}</View>
      </>}

      <ScreenModal visible={picker || preview !== null} onRequestClose={() => {if (preview) setPreview(null); else setPicker(false);}}>
          {preview ? <>
            <View style={s.modalNav}><Button label={picker ? 'Catálogo' : 'Volver a rutina'} variant="ghost" icon="arrow-left" compact onPress={() => setPreview(null)}/><Text style={s.meta}>Ejemplo FitCron</Text></View>
            <ScrollView contentContainerStyle={s.content}>
              <Text style={s.meta}>{groupLabel(preview.group)}</Text><Text accessibilityRole="header" style={s.heading}>{preview.name}</Text>
              <View style={s.largeExample}><ExerciseImage key={preview.id} exercise={preview} large/></View>
              <Text style={s.body}>Consulta la página del ejercicio para ver su técnica de ejecución.</Text>
              <Button label="Ver técnica en FitCron" variant="secondary" icon="external-link" onPress={() => openSource(preview)}/>
            </ScrollView>
          </> : <>
            <View style={s.pickerHeader}>
              <View style={s.spread}><Text accessibilityRole="header" style={s.title}>Añadir ejercicios</Text><IconButton name="x" label="Cerrar catálogo" onPress={() => setPicker(false)}/></View>
              <Text style={s.fieldLabel}>Buscar ejercicio</Text>
              <View style={s.searchBox}><Icon name="search" color={c.muted}/><TextInput keyboardAppearance={themeMode} accessibilityLabel="Buscar ejercicio" placeholder="Press, remo, sentadilla…" placeholderTextColor={c.muted} style={s.searchInput} value={query} onChangeText={setQuery} autoCorrect={false} returnKeyType="search"/>{!!query && <IconButton name="x" label="Borrar búsqueda" onPress={() => setQuery('')}/>}</View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
                {groups.map(option => <Pressable key={option.id} accessibilityRole="button" accessibilityState={{selected: group === option.value}} onPress={() => setGroup(option.value)}
                  style={({pressed}) => [s.chip, group === option.value && s.activeChip, pressed && {opacity: 0.7}]}><Text style={[s.chipLabel, group === option.value && {color: c.onAccent}]}>{option.label}</Text></Pressable>)}
              </ScrollView>
              <Text accessibilityLiveRegion="polite" style={s.meta}>{filtered.length} {filtered.length === 1 ? 'ejercicio' : 'ejercicios'} disponibles</Text>
            </View>
            <FlatList data={filtered} keyExtractor={exercise => exercise.id} initialNumToRender={10} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={s.catalogContent}
              ListEmptyComponent={<View style={s.emptyCard}><Icon name="search" size={28} color={c.muted}/><Text style={s.cardTitle}>No hay coincidencias</Text><Text style={[s.body, {textAlign: 'center'}]}>Prueba otro nombre o cambia el grupo muscular.</Text><Button label="Ver todos los ejercicios" variant="secondary" onPress={() => {setQuery(''); setGroup(ALL_GROUPS);}}/></View>}
              renderItem={({item: exercise}) => <View style={s.catalogRow}>
                <Pressable accessibilityRole="button" accessibilityLabel={`Ver ejemplo de ${exercise.name}`} onPress={() => setPreview(exercise)} style={({pressed}) => [s.catalogPreview, pressed && {opacity: 0.65}]}>
                  <ExerciseImage key={exercise.id} exercise={exercise} thumbnail/>
                  <View style={[s.flex, {gap: 4}]}><Text style={s.meta}>{groupLabel(exercise.group)}</Text><Text style={s.catalogTitle}>{exercise.name}</Text>
                    {!!entryCounts.get(exercise.id) && <Text style={s.addedText}>En tu rutina · {entryCounts.get(exercise.id)}</Text>}
                  </View>
                </Pressable>
                <View style={s.addCircle}><IconButton name="plus" label={`Añadir ${exercise.name}`} onPress={() => addExercise(exercise)}/></View>
              </View>}/>
            <View style={s.pickerFooter}><Text accessibilityLiveRegion="polite" style={s.meta}>{routine?.entries.length ?? 0} ejercicios en la rutina</Text><Button label="Listo" icon="check" onPress={() => setPicker(false)}/></View>
          </>}
      </ScreenModal>

      <Modal visible={naming !== null} transparent animationType="fade" onRequestClose={() => setNaming(null)}>
        <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.dialog}><View style={s.spread}><Text accessibilityRole="header" style={s.title}>{naming === 'new' ? 'Nueva rutina' : 'Renombrar rutina'}</Text><IconButton name="x" label="Cancelar" onPress={() => setNaming(null)}/></View>
            <Text style={s.fieldLabel}>Nombre de la rutina</Text><TextInput keyboardAppearance={themeMode} autoFocus accessibilityLabel="Nombre de la rutina" placeholder="Lunes · Pecho y tríceps" placeholderTextColor={c.muted} style={s.input} maxLength={100} value={name} onChangeText={setName} returnKeyType="done" onSubmitEditing={saveName}/>
            <Button label={naming === 'new' ? 'Crear rutina' : 'Guardar nombre'} disabled={!name.trim()} onPress={saveName}/>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ScreenModal visible={importing} onRequestClose={() => setImporting(false)}>
        <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.modalNav}><Text accessibilityRole="header" style={s.title}>Importar rutina</Text><IconButton name="x" label="Cerrar importación" onPress={() => setImporting(false)}/></View>
          <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={s.content}>
            <Text style={s.body}>Pega el texto que te compartieron desde Pulso. Se añadirá una copia y conservarás tus rutinas actuales.</Text>
            <View style={s.exampleCard}><Text style={s.routineTitle}>Lunes - Pecho y Tríceps</Text><Text style={s.meta}>Rutina de ejemplo · 5 ejercicios</Text><Button label="Cargar rutina de ejemplo" icon="copy" variant="secondary" onPress={() => {setImportText(JSON.stringify(mondayExample, null, 2)); setImportError('');}}/></View>
            <Text style={s.fieldLabel}>Datos de la rutina</Text><TextInput keyboardAppearance={themeMode} accessibilityLabel="Datos de la rutina" multiline textAlignVertical="top" autoCapitalize="none" autoCorrect={false} placeholder="Pega aquí el texto completo" placeholderTextColor={c.muted} style={[s.input, {height: 260}]} value={importText} onChangeText={setImportText}/>
            {!!importError && <Text accessibilityRole="alert" style={s.errorText}>{importError}</Text>}
            <Button label="Importar rutina" icon="download" disabled={!importText.trim()} onPress={importNow}/>
          </ScrollView>
        </KeyboardAvoidingView>
      </ScreenModal>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  screen: {flex: 1, backgroundColor: c.background}, flex: {flex: 1},
  content: {padding: 24, gap: 16, paddingBottom: 32, width: '100%', maxWidth: 720, alignSelf: 'center'},
  topbar: {paddingHorizontal: 24, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12},
  brandRow: {flexDirection: 'row', alignItems: 'center', gap: 8}, brand: {fontFamily: f.display, color: c.ink, fontSize: 30, letterSpacing: -1.5},
  mark: {width: 28, height: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3}, markBar: {width: 4, height: 13, borderRadius: 3, backgroundColor: c.accent},
  row: {flexDirection: 'row', alignItems: 'center', gap: 8}, spread: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8},
  heading: {fontFamily: f.display, fontSize: 38, lineHeight: 43, letterSpacing: -1.2, color: c.ink}, title: {fontFamily: f.display, fontSize: 26, lineHeight: 32, letterSpacing: -0.6, color: c.ink, flexShrink: 1},
  body: {fontFamily: f.body, color: c.ink, fontSize: 16, lineHeight: 24}, meta: {fontFamily: f.body, fontSize: 14, color: c.muted, lineHeight: 20, flexShrink: 1},
  homeHeading: {gap: 12, paddingTop: 8, paddingBottom: 8}, summary: {flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap', paddingTop: 8}, summaryText: {fontFamily: f.medium, fontSize: 14, color: c.muted}, dot: {width: 3, height: 3, borderRadius: 2, backgroundColor: c.muted},
  emptyCard: {borderRadius: 24, backgroundColor: c.soft, paddingHorizontal: 24, paddingVertical: 32, gap: 16, alignItems: 'center'}, emptySymbol: {width: 64, height: 64, alignItems: 'center', justifyContent: 'center', backgroundColor: c.selected, borderRadius: 20},
  cardTitle: {fontFamily: f.display, fontSize: 24, lineHeight: 29, color: c.ink, letterSpacing: -0.4}, routineCard: {padding: 16, gap: 12, borderRadius: 20, backgroundColor: c.soft, flexDirection: 'row', alignItems: 'center'}, routineTitle: {fontFamily: f.bold, fontSize: 19, color: c.ink, lineHeight: 25}, routinePlaceholder: {width: 68, height: 68, borderRadius: 14, backgroundColor: c.selected, alignItems: 'center', justifyContent: 'center'}, groupText: {fontFamily: f.medium, fontSize: 13, lineHeight: 18, color: c.accent},
  homeFooter: {paddingTop: 8, gap: 16}, footerNote: {fontFamily: f.body, fontSize: 13, lineHeight: 20, color: c.muted},
  actionBar: {paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8, backgroundColor: c.background, width: '100%', maxWidth: 720, alignSelf: 'center'},
  detailNav: {paddingHorizontal: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}, detailHeading: {gap: 8}, detailFooter: {gap: 8, paddingTop: 8},
  exerciseCard: {backgroundColor: c.soft, borderRadius: 24, padding: 16, gap: 16}, fieldRow: {flexDirection: 'row', gap: 8}, fieldLabel: {fontFamily: f.medium, fontSize: 14, lineHeight: 20, color: c.muted},
  numberInput: {fontFamily: f.medium, fontSize: 19, color: c.ink, backgroundColor: c.white, borderWidth: 1, borderColor: c.line, borderRadius: 12, minHeight: 52, padding: 12, marginTop: 8, textAlign: 'center'},
  readMetric: {flex: 1, backgroundColor: c.background, borderRadius: 12, padding: 12, gap: 4}, readValue: {fontFamily: f.medium, fontSize: 18, lineHeight: 24, color: c.ink}, resumeCard: {padding: 16, borderRadius: 20, backgroundColor: c.selected, gap: 12},
  exampleCard: {backgroundColor: c.soft, padding: 16, borderRadius: 20, gap: 8},
  input: {fontFamily: f.body, fontSize: 16, color: c.ink, backgroundColor: c.soft, borderWidth: 1, borderColor: c.line, borderRadius: 14, minHeight: 52, padding: 16}, notes: {backgroundColor: c.white, minHeight: 64},
  expandIcon: {position: 'absolute', bottom: 12, right: 12, backgroundColor: c.background, borderRadius: 10, padding: 8},
  modalNav: {paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8},
  largeExample: {backgroundColor: c.white, borderRadius: 24, paddingVertical: 24},
  pickerHeader: {paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16, gap: 12},
  searchBox: {minHeight: 52, borderRadius: 16, paddingLeft: 16, paddingRight: 4, backgroundColor: c.soft, flexDirection: 'row', alignItems: 'center', gap: 8}, searchInput: {flex: 1, minHeight: 52, fontFamily: f.body, fontSize: 16, color: c.ink, paddingVertical: 12},
  chips: {gap: 8, paddingVertical: 4}, chip: {minHeight: 44, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 24, backgroundColor: c.surface, justifyContent: 'center'}, activeChip: {backgroundColor: c.accent}, chipLabel: {fontFamily: f.medium, fontSize: 14, color: c.ink},
  catalogContent: {paddingHorizontal: 24, paddingBottom: 24, gap: 12, width: '100%', maxWidth: 720, alignSelf: 'center'}, catalogRow: {backgroundColor: c.soft, padding: 12, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 8}, catalogPreview: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12}, catalogTitle: {fontFamily: f.medium, fontSize: 16, lineHeight: 21, color: c.ink}, addedText: {fontFamily: f.medium, fontSize: 13, lineHeight: 18, color: c.accent}, addCircle: {borderRadius: 24, backgroundColor: c.selected},
  pickerFooter: {paddingHorizontal: 24, paddingVertical: 12, gap: 8, backgroundColor: c.background},
  overlay: {flex: 1, backgroundColor: c.overlay, justifyContent: 'center', padding: 24}, dialog: {width: '100%', maxWidth: 480, alignSelf: 'center', padding: 24, gap: 16, borderRadius: 24, backgroundColor: c.background},
  errorText: {fontFamily: f.body, fontSize: 14, lineHeight: 20, color: c.danger}, warning: {padding: 16, color: c.danger, backgroundColor: c.dangerSoft, fontFamily: f.body, fontSize: 14}, loading: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16},
});
