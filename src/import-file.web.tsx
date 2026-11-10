import React, {useRef} from 'react';
import {Button} from './ui';
export function ImportFile({onText, onError}: {onText: (text: string) => void; onError: (message: string) => void}) {
  const input = useRef<HTMLInputElement>(null);
  return <>
    <input ref={input} type="file" accept="application/json,.json" aria-label="Archivo de rutina" style={{display: 'none'}} onChange={async event => {
      const file = event.target.files?.[0]; event.target.value = '';
      if (!file) return;
      if (file.size > 1024 * 1024) {onError('El archivo es demasiado grande. El máximo es 1 MB.'); return;}
      try {onText(await file.text());} catch {onError('No pudimos leer el archivo seleccionado.');}
    }}/>
    <Button label="Elegir archivo de rutina" icon="folder" variant="secondary" onPress={() => input.current?.click()}/>
  </>;
}
