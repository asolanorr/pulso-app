import React, {createContext, useContext, useEffect, useRef, useState} from 'react';
import {readData, storageEpoch, writeData} from './app-storage';
import {Routine, parseRoutines} from './model';
import catalog from './catalog.json';

type Store = {
  routines: Routine[]; setRoutines: React.Dispatch<React.SetStateAction<Routine[]>>;
  ready: boolean; blocked: boolean; saveError: boolean;
};
const Context = createContext<Store | null>(null);
export function RoutineProvider({children}: {children: React.ReactNode}) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [ready, setReady] = useState(false), [blocked, setBlocked] = useState(false), [saveError, setSaveError] = useState(false);
  const queue = useRef(Promise.resolve());
  const epoch = useRef(storageEpoch());
  useEffect(() => {
    readData('@pulso/routines/v1').then(raw => {
      if (raw) setRoutines(parseRoutines(raw, new Set(catalog.map(item => item.id)), true));
    }).catch(() => setBlocked(true)).finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (!ready || blocked) return;
    const raw = JSON.stringify({version: 1, routines});
    queue.current = queue.current.then(() => writeData('@pulso/routines/v1', raw, epoch.current))
      .then(() => setSaveError(false)).catch(() => setSaveError(true));
  }, [routines, ready, blocked]);
  return <Context.Provider value={{routines, setRoutines, ready, blocked, saveError}}>{children}</Context.Provider>;
}
export function useRoutines() {
  const value = useContext(Context);
  if (!value) throw Error('RoutineProvider missing');
  return value;
}
