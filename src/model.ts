export type Exercise = {id:string;name:string;group:string;url:string;gif:string};
export type Entry = {id:string;exerciseId:string;sets:string;reps:string;rest:string;notes:string};
export type Routine = {id:string;name:string;entries:Entry[]};
export const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,9);
export function parseRoutines(text:string,validIds:Set<string>,preserveIds=false):Routine[]{
 const data=JSON.parse(text);
 if(data.version!==1||!Array.isArray(data.routines))throw Error('Formato no compatible');
 const usedIds=new Set<string>();
 const getId=(value:unknown)=>{
  if(!preserveIds)return uid();
  if(typeof value!=='string'||!value||usedIds.has(value))throw Error('Identificador guardado no válido');
  usedIds.add(value);return value;
 };
 return data.routines.map((r:any)=>{
  if(typeof r.name!=='string'||!r.name.trim()||r.name.length>100||!Array.isArray(r.entries))throw Error('Rutina no válida');
  return {id:getId(r.id),name:r.name.trim(),entries:r.entries.map((e:any)=>{
   if(!validIds.has(e.exerciseId)||!['sets','reps','rest','notes'].every(k=>typeof e[k]==='string'&&e[k].length<=2000))throw Error('Ejercicio no válido');
   return {id:getId(e.id),exerciseId:e.exerciseId,sets:e.sets,reps:e.reps,rest:e.rest,notes:e.notes};
  })};
 });
}
