import {Exercise} from './model';

export const ALL_GROUPS = '__all__';
export const groupLabel = (group: string) => group === 'Todos' ? 'General' : group;
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export function getGroupOptions(exercises: Exercise[]) {
  const categories = Array.from(new Set(exercises.map(exercise => exercise.group).filter(Boolean)))
    .map(group => ({id: `group:${group}`, value: group, label: groupLabel(group)}))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'));
  return [{id: ALL_GROUPS, value: ALL_GROUPS, label: 'Todos'}, ...categories];
}

export function filterExercises(exercises: Exercise[], group: string, query: string) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return exercises.filter(exercise => {
    const text = normalize(`${exercise.name} ${groupLabel(exercise.group)}`);
    return (group === ALL_GROUPS || exercise.group === group) && words.every(word => text.includes(word));
  });
}
