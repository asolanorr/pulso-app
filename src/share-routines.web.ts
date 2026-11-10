export async function shareRoutines(name: string, content: string) {
  const slug = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'rutinas';
  const file = new File([content], `${slug}.json`, {type: 'application/json'});
  if (navigator.canShare?.({files: [file]})) {
    try {await navigator.share({title: name, files: [file]}); return;}
    catch (error) {if ((error as DOMException).name === 'AbortError') return; throw error;}
  }
  const url = URL.createObjectURL(file), link = document.createElement('a');
  link.href = url; link.download = file.name; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
