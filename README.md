# Pulso · Instalar como PWA

Pulso permite crear rutinas, consultar GIFs, marcar series y controlar descansos. Guarda los datos en cada dispositivo, sin cuentas ni sincronización. La versión nativa para iOS y Android se conserva.

## Instalar en iPhone

1. Abre la dirección publicada de Pulso en **Safari**, con internet.
2. Pulsa **Compartir → Añadir a pantalla de inicio**. Activa **Abrir como app** si aparece esa opción.
3. Pulsa **Añadir** y abre Pulso desde su icono.
4. En **Ajustes**, espera **Preparada para abrir sin conexión**.

La PWA publicada funciona sin Expo Go y sin mantener encendida tu computadora.

## Instalar en Android

1. Abre la dirección publicada en **Chrome**.
2. Pulsa **⋮ → Instalar aplicación**, o **Añadir a pantalla de inicio → Instalar**.
3. Abre Pulso desde su icono y comprueba en Ajustes que está preparada para abrir sin conexión.

## Instalar en Windows o Mac

1. Abre la dirección publicada en **Chrome o Edge**.
2. Pulsa el icono de instalación de la barra de direcciones, o busca **Instalar Pulso** en el menú.
3. Confirma **Instalar**.

En Safari para Mac puedes usar **Archivo → Añadir al Dock**, si esa opción está disponible.

## Publicar la app por primera vez

Estos pasos los realiza el propietario del repositorio; los amigos solo necesitan la dirección publicada.

1. Sube esta versión a `main` en `asolanorr/pulso-app`.
2. En GitHub abre **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. Abre **Actions → Publicar PWA → Run workflow** y espera el resultado verde.
4. Abre el enlace mostrado por el despliegue. Con este repositorio será **https://asolanorr.github.io/pulso-app/**.

El enlace solo estará disponible cuando el despliegue termine. La app es pública, pero las rutinas guardadas en tu navegador no se publican en GitHub.

## Transferir o respaldar rutinas

La app nativa y la PWA pueden tener almacenes separados. No se transfieren los datos automáticamente.

1. En la instalación anterior, pulsa compartir todas las rutinas, junto a **Importar rutina**.
2. Guarda el archivo JSON. Si la versión anterior comparte texto, copia el contenido completo.
3. En la PWA abre **Importar rutina → Elegir archivo de rutina**, o pega el texto. Pulsa **Importar rutina**.

La importación añade copias sin reemplazar las existentes. El archivo contiene rutinas, sin el progreso de entrenamiento ni la apariencia. Guarda una copia periódicamente: borrar los datos del navegador o desinstalar puede eliminar la información local.

Para probar: **Importar rutina → Cargar rutina de ejemplo → Importar rutina** añade **Lunes - Pecho y Tríceps**.

## Sin conexión y descansos

Después de preparar la primera carga con internet puedes abrir Pulso, consultar el catálogo incluido, editar rutinas y registrar series sin conexión. Se guardan hasta **24 GIFs consultados**, según lo permita el navegador. Los GIFs que no estén guardados necesitan internet.

**Mantén la PWA abierta para ver el descanso terminar.** El contador se corrige al regresar a la app. Esta versión web no programa avisos con pantalla bloqueada ni promete vibración en iPhone. La app nativa conserva sus avisos sujetos a los permisos del teléfono.

## Actualizar

1. Abre Pulso con internet.
2. Entra en **Ajustes** y pulsa **Actualizar Pulso**, si aparece.
3. Si tienes un entrenamiento activo, finalízalo primero.

La descarga puede necesitar otra apertura de la app. La actualización no borra rutinas y no recarga la pantalla por sí sola durante un entrenamiento.

## Borrar datos

Abre **Ajustes → Datos de la app → Borrar todos mis datos**. Se pide confirmación antes de borrar rutinas, entrenamiento, apariencia y GIFs guardados de esta instalación. El catálogo y la aplicación offline se conservan.

## Compilar y probar en tu computadora

Requiere Node.js y npm. Desde la carpeta del proyecto:

```powershell
npm ci
npm run build:pwa
npm run preview:pwa
```

Abre **http://localhost:4173**. Este servidor solo es accesible desde esa computadora. `npm run web` es el modo de desarrollo, sin service worker: no sirve para comprobar el modo offline de producción.

El contenido de `dist/` puede alojarse en un servidor estático con **HTTPS**. Para una subcarpeta:

```powershell
$env:PULSO_BASE_PATH='/pulso-app/'
npm run build:pwa
Remove-Item Env:PULSO_BASE_PATH
```

Para publicar en la raíz de un dominio, no establezcas `PULSO_BASE_PATH`. El workflow genera `dist/`; no se necesita subir esa carpeta al repositorio.

## Conservar la versión nativa

```powershell
npm start
```

Abre el proyecto con Expo Go compatible con el SDK del proyecto o un development build. Expo Go necesita el servidor de desarrollo y puede limitar las notificaciones. `eas.json` conserva los perfiles para compilar aplicaciones nativas independientes. La PWA no reemplaza estos destinos.

## Verificar cambios

```powershell
npm run check
npm run lint
npm run build:pwa
```

El catálogo incluye 750 ejercicios con enlaces originales de FitCron. El logo usa **Funnel Display Medium** y el texto **Funnel Sans**.
