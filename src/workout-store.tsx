import React, {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {AppState} from 'react-native';
import {readData, storageEpoch, writeData} from './app-storage';
import {signalRestComplete, prepareRestAlert, scheduleRestAlert, cancelRestAlert} from './rest-alerts';
import {Routine, uid} from './model';
import catalog from './catalog.json';
import {Rest, Workout, createWorkout, nextPending, remainingSeconds, restSeconds, restoreWorkout, toggleSet} from './workout-model';

const KEY = '@pulso/workout/v1';
const notificationId = (workoutId: string, rest: Rest) => `pulso-rest-${workoutId}-${rest.id}`;
type Store = {
  workout: Workout | null; ready: boolean; blocked: boolean; saveError: boolean; now: number; restNotice: string;
  begin: (routine: Routine) => void; choose: (entryId: string) => void; mark: (entryId: string, index: number) => void;
  advance: () => void; startRest: () => Promise<void>; cancelRest: () => void; finish: () => void;
};
const Context = createContext<Store | null>(null);
export function WorkoutProvider({children}: {children: React.ReactNode}) {
  const [workout, setWorkout] = useState<Workout | null>(null), current = useRef<Workout | null>(null);
  const [ready, setReady] = useState(false), [blocked, setBlocked] = useState(false), [saveError, setSaveError] = useState(false);
  const [now, setNow] = useState(() => Date.now()), [restNotice, setRestNotice] = useState('');
  const queue = useRef(Promise.resolve()), restOperation = useRef(0);
  const epoch = useRef(storageEpoch());
  const commit = useCallback((value: Workout | null) => {current.current = value; setWorkout(value);}, []);
  useEffect(() => {
    readData(KEY).then(raw => {if (raw) commit(restoreWorkout(raw, new Set(catalog.map(item => item.id))));})
      .catch(() => setBlocked(true)).finally(() => setReady(true));
  }, [commit]);
  useEffect(() => {
    if (!ready || blocked) return;
    const raw = workout ? JSON.stringify(workout) : null;
    queue.current = queue.current.then(() => writeData(KEY, raw, epoch.current))
      .then(() => setSaveError(false)).catch(() => setSaveError(true));
  }, [workout, ready, blocked]);
  const workoutId = workout?.id, finishedAt = workout?.finishedAt;
  useEffect(() => {
    const tick = () => {
      if (epoch.current !== storageEpoch()) return;
      const time = Date.now(); setNow(time);
      const value = current.current;
      if (AppState.currentState !== 'active' || !value?.rest || value.rest.notified || value.rest.endsAt > time || value.finishedAt !== null) return;
      commit({...value, rest: {...value.rest, notified: true}});
      signalRestComplete();
    };
    if (!workoutId || finishedAt !== null) return;
    tick();
    const interval = setInterval(tick, 500);
    const subscription = AppState.addEventListener('change', state => {if (state === 'active') tick();});
    return () => {clearInterval(interval); subscription.remove();};
  }, [workoutId, finishedAt, commit]);

  const cancelNotification = (value: Workout | null) => {
    if (value?.rest) {
      cancelRestAlert(notificationId(value.id, value.rest)).catch(() => {
        setRestNotice('No se pudo cancelar el aviso del sistema; todavía puede aparecer.');
      });
    }
  };
  const cancelRest = () => {
    restOperation.current++; const value = current.current;
    cancelNotification(value); setRestNotice('');
    if (value) commit({...value, rest: null});
  };
  const begin = (routine: Routine) => {
    if (!ready || blocked) throw Error('No se pudo leer el entrenamiento guardado. Cierra y vuelve a abrir la app.');
    const next = createWorkout(routine);
    cancelRest(); commit(next); setNow(Date.now());
  };
  const choose = (entryId: string) => {
    const value = current.current;
    if (value && value.finishedAt === null && value.routine.entries.some(entry => entry.id === entryId)) commit({...value, currentEntryId: entryId});
  };
  const mark = (entryId: string, index: number) => {if (current.current) commit(toggleSet(current.current, entryId, index));};
  const advance = () => {const value = current.current; if (value) {const next = nextPending(value); if (next) choose(next);}};
  const finish = () => {const value = current.current; if (value) {cancelRest(); commit({...value, rest: null, finishedAt: Date.now()});}};
  const startRest = async () => {
    const value = current.current;
    if (!value || value.finishedAt !== null) return;
    const entry = value.routine.entries.find(item => item.id === value.currentEntryId)!;
    const seconds = restSeconds(entry);
    if (!seconds) return;
    cancelRest();
    const operation = restOperation.current;
    const rest: Rest = {id: uid(), entryId: entry.id, endsAt: Date.now() + seconds * 1000, seconds, notified: false};
    commit({...value, rest}); setNow(Date.now());
    try {
      const notice = await prepareRestAlert();
      if (operation !== restOperation.current || epoch.current !== storageEpoch()) return;
      if (notice) {setRestNotice(notice); return;}
      const remaining = remainingSeconds(rest.endsAt);
      if (!remaining) return;
      const identifier = await scheduleRestAlert(notificationId(value.id, rest), remaining);
      if (operation !== restOperation.current || epoch.current !== storageEpoch()) await cancelRestAlert(identifier);
    } catch {
      if (operation === restOperation.current) setRestNotice('El aviso con la pantalla bloqueada no está disponible. Con la app abierta se mantiene la vibración.');
    }
  };

  return <Context.Provider value={{workout, ready, blocked, saveError, now, restNotice, begin, choose, mark, advance, startRest, cancelRest, finish}}>{children}</Context.Provider>;
}
export function useWorkout() {
  const value = useContext(Context);
  if (!value) throw Error('WorkoutProvider missing');
  return value;
}
