import {Entry, Routine, parseRoutines, uid} from './model';

export type Rest = {id: string; entryId: string; endsAt: number; seconds: number; notified: boolean};
export type Workout = {
  version: 1; id: string; routine: Routine; startedAt: number; finishedAt: number | null;
  currentEntryId: string; completed: Record<string, boolean[]>; rest: Rest | null;
};
export function setCount(entry: Entry) {
  const count = Number(entry.sets.trim());
  if (!Number.isInteger(count) || count < 1 || count > 100) throw Error('Usa entre 1 y 100 series por ejercicio.');
  return count;
}
export function restSeconds(entry: Entry) {
  const value = Number(entry.rest.trim());
  if (!Number.isInteger(value) || value < 0 || value > 86400) throw Error('El descanso debe ser un número de segundos entre 0 y 86400.');
  return value;
}
export function createWorkout(routine: Routine, now = Date.now()): Workout {
  if (!routine.entries.length) throw Error('Añade un ejercicio antes de iniciar la rutina.');
  const completed: Record<string, boolean[]> = {};
  for (const entry of routine.entries) {
    try {completed[entry.id] = Array(setCount(entry)).fill(false); restSeconds(entry);}
    catch (error) {throw Error(`Revisa el ejercicio ${routine.entries.indexOf(entry) + 1}. ${(error as Error).message}`);}
  }
  return {version: 1, id: uid(), routine: {...routine, entries: routine.entries.map(entry => ({...entry}))},
    startedAt: now, finishedAt: null, currentEntryId: routine.entries[0].id, completed, rest: null};
}
export function toggleSet(workout: Workout, entryId: string, index: number): Workout {
  const sets = workout.completed[entryId];
  if (workout.finishedAt !== null || !sets || !Number.isInteger(index) || index < 0 || index >= sets.length) return workout;
  return {...workout, completed: {...workout.completed, [entryId]: sets.map((done, i) => i === index ? !done : done)}};
}
export function workoutProgress(workout: Workout) {
  const values = Object.values(workout.completed).flat();
  return {done: values.filter(Boolean).length, total: values.length};
}
export function nextPending(workout: Workout): string | null {
  const entries = workout.routine.entries;
  const current = entries.findIndex(entry => entry.id === workout.currentEntryId);
  for (let offset = 1; offset <= entries.length; offset++) {
    const entry = entries[(current + offset) % entries.length];
    if (workout.completed[entry.id].some(done => !done)) return entry.id;
  }
  return null;
}
export function remainingSeconds(endsAt: number, now = Date.now()) {return Math.max(0, Math.ceil((endsAt - now) / 1000));}
export function formatTime(seconds: number) {
  const value = Math.max(0, Math.floor(seconds));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}
export function restoreWorkout(raw: string, validIds: Set<string>, now = Date.now()): Workout {
  const saved = JSON.parse(raw);
  if (saved.version !== 1 || typeof saved.id !== 'string' || !saved.id || !Number.isFinite(saved.startedAt) || saved.startedAt < 0 ||
    (saved.finishedAt !== null && (!Number.isFinite(saved.finishedAt) || saved.finishedAt < saved.startedAt))) throw Error('Sesión no válida');
  const routine = parseRoutines(JSON.stringify({version: 1, routines: [saved.routine]}), validIds, true)[0];
  const fresh = createWorkout(routine, saved.startedAt);
  if (!routine.entries.some(entry => entry.id === saved.currentEntryId) || !saved.completed || typeof saved.completed !== 'object') throw Error('Progreso no válido');
  for (const entry of routine.entries) {
    const marks = saved.completed[entry.id];
    if (!Array.isArray(marks) || marks.length !== fresh.completed[entry.id].length || marks.some(mark => typeof mark !== 'boolean')) throw Error('Series no válidas');
    fresh.completed[entry.id] = marks;
  }
  let rest: Rest | null = null;
  if (saved.rest !== null) {
    const r = saved.rest;
    if (!r || typeof r.id !== 'string' || !r.id || !routine.entries.some(entry => entry.id === r.entryId) ||
      !Number.isFinite(r.endsAt) || !Number.isInteger(r.seconds) || r.seconds <= 0 || r.seconds > 86400 || typeof r.notified !== 'boolean') throw Error('Descanso no válido');
    rest = {...r, notified: r.notified || r.endsAt <= now};
  }
  return {...fresh, id: saved.id, finishedAt: saved.finishedAt, currentEntryId: saved.currentEntryId, rest: saved.finishedAt === null ? rest : null};
}
