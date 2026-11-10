# Pulso · Rutinas personales

App personal de rutinas en React Native + Expo para Android e iOS. Los datos se guardan en cada dispositivo, sin backend ni cuentas propias de Pulso.

## Restablecer los datos

Abre **Ajustes → Datos de la app → Borrar todos mis datos**. La app pide una confirmación explícita antes de borrar las rutinas, el progreso de entrenamiento, la apariencia y la caché de GIFs. También intenta retirar los avisos de descanso programados. El catálogo incluido de ejercicios sigue disponible.

El restablecimiento afecta a este dispositivo. Exporta tus rutinas antes de confirmar si quieres conservar una copia. Las escrituras pendientes se coordinan para evitar que una rutina o sesión antigua reaparezca después del borrado.

## Interfaz actualizada

La interfaz usa piedra cálida y verde pino, tipografías Funnel incluidas localmente, miniaturas de ejercicios y botones de creación/añadido siempre visibles. El catálogo permite añadir varios ejercicios antes de volver a la rutina. El filtro general `Todos` es único; los ejercicios que FitCron clasifica como `Todos` aparecen bajo `General`.

Después de actualizar este proyecto, detén el servidor de Expo con Ctrl+C y ejecuta `npx expo start --clear`. Si aparece un aviso de cuentas distintas, inicia sesión en Expo Go del teléfono con la misma cuenta de Expo CLI.

## Ajustes de apariencia

Abre **Ajustes** en la cabecera y entra a **Apariencia**. Puedes elegir **Claro**, **Oscuro** o **Sistema**, y las paletas **Verde pino**, **Azul**, **Naranja** y **Rosada**. Cada paleta tiene colores propios para ambos temas. El modo Sistema sigue los cambios del teléfono; los modos manuales se mantienen independientemente de él.

La selección se aplica al instante a las rutinas, al editor, al catálogo, al entrenamiento, a los diálogos de la app, al teclado y a la barra de estado. Se guarda localmente en `@pulso/appearance/v1`, por separado de las rutinas y el progreso del entrenamiento. Cambiar la apariencia no reemplaza esos datos ni reinicia la sesión. El fondo blanco original de los GIFs se conserva.

La página de Ajustes muestra únicamente las opciones de apariencia y su estado de guardado.

## Rutina de ejemplo

En **Importar rutina**, pulsa **Cargar rutina de ejemplo** y después **Importar rutina**. Se añade una copia de **Lunes - Pecho y Tríceps**, con cinco ejercicios reales del catálogo y doce series de trabajo. También se entrega el archivo `lunes-pecho-triceps.json` en la carpeta de outputs.

Es un ejemplo general con press banca con mancuernas, press inclinado en máquina, aperturas y dos ejercicios de tríceps. Las notas de los ejercicios incluyen el calentamiento y la indicación de ajustar la carga. La tipografía del logo es **Funnel Display Medium (500)**; el texto general usa Funnel Sans.

## Probar en tu iPhone desde Windows

1. Instala **Expo Go** desde App Store y crea/inicia sesión en tu cuenta de Expo.
2. Abre PowerShell en esta carpeta. Ejecuta `npm install` si copiaste el proyecto a otra máquina.
3. Ejecuta `npx expo login` e inicia sesión con la misma cuenta que usas en Expo Go.
4. Ejecuta `npm start`. Conecta el iPhone y la PC a la misma red Wi-Fi y escanea el QR con la cámara del iPhone.

En Android, abre Expo Go y usa su lector de QR. El proyecto usa Expo SDK 58: Expo Go debe admitir esa versión. Si la aplicación de la tienda todavía no la admite, habrá que usar una versión compatible o un development build.

Expo Go sirve para la primera prueba; no es una instalación independiente de Pulso. Mientras pruebas desde Expo Go, el servidor de desarrollo debe estar disponible. En Mac puedes usar el mismo proyecto; `npm run ios` requiere Xcode y el simulador configurados.

## Lo que incluye

- Crear, renombrar, duplicar y eliminar rutinas con confirmación.
- Catálogo local de **750 ejercicios** obtenidos del índice público de FitCron. Búsqueda sin distinguir tildes y filtro por grupo muscular.
- GIF animado con caché de disco, ejemplo ampliado y enlace a la página de técnica original.
- Series, repeticiones, descanso en segundos, notas y cambio de orden con flechas.
- Guardado local automático. Compartir una rutina o todas mediante texto JSON; el receptor copia el texto y lo pega en **Importar rutina**. Las importaciones crean copias.

No hay cuentas dentro de Pulso ni sincronización entre dispositivos. La cuenta Expo se usa para el entorno de desarrollo. Desinstalar la app o borrar sus datos puede borrar las rutinas: guarda copias mediante Compartir.

## Consultar, editar y entrenar

1. Abre una rutina para consultar los GIFs, las series, las repeticiones y el descanso. Los datos se muestran como texto.
2. Pulsa **Editar rutina** para cambiar los campos, añadir/quitar ejercicios o reordenarlos. Los cambios se guardan automáticamente; **Listo · Ver rutina** regresa a la ficha informativa.
3. Pulsa **Iniciar rutina** para comenzar por el primer ejercicio del orden guardado. La sesión conserva una copia de la rutina y no modifica su configuración.
4. Marca cada serie realizada. Puedes volver a tocarla para desmarcarla. **Cambiar ejercicio** permite saltar a cualquier ejercicio; **Siguiente pendiente** sigue el orden y vuelve a los ejercicios que faltan.
5. Activa **Descansar** al terminar una serie. El temporizador usa los segundos configurados. Al finalizar, muestra el aviso y solicita la vibración con la app activa. Para recibir un aviso con la pantalla bloqueada, permite las notificaciones locales cuando el teléfono lo pregunte.

El progreso de la sesión se guarda localmente y se puede retomar desde Mis rutinas. **Finalizar rutina** muestra las series realmente marcadas y el tiempo transcurrido; finalizar antes requiere confirmación y no completa las pendientes. Se conserva la última sesión, no un historial de todos los entrenamientos. Si intentas iniciar otra mientras hay una sesión activa, la app permite retomarla o reemplazarla con confirmación.

El aviso del sistema y la vibración dependen de los permisos, del modo de concentración/silencio y de los ajustes del teléfono. Sin permiso de notificaciones, el temporizador y la vibración con la app abierta siguen disponibles. Android puede retrasar notificaciones en segundo plano según sus restricciones de batería. Se usan notificaciones locales, sin servidor ni tokens de push.

## Instalación independiente para amigos

`eas.json` contiene un perfil `preview` de distribución interna. Antes de compilar, el propietario debe configurar su proyecto Expo/EAS y elegir identificadores propios de Android e iOS en `app.json`. No se han creado certificados ni paquetes APK/IPA.

- **Android:** EAS puede generar un APK instalable sin publicar en Google Play.
- **iPhone:** la distribución interna ad hoc requiere la cuenta Apple Developer correspondiente y registrar los dispositivos. Tener un Mac no elimina los requisitos de firma/distribución de Apple. TestFlight es otra ruta privada, con su configuración y requisitos.

El siguiente paso es probar la versión de desarrollo en tu teléfono.

## Datos de FitCron

El catálogo se obtuvo el 9 de noviembre de 2026 de https://fitcron.com/exercises/ y conserva enlaces de fuente y de GIF. Los GIFs se cargan desde FitCron: no se han descargado ni redistribuido en el proyecto. Las rutinas funcionan sin conexión; los GIFs requieren internet cuando no están en caché. Los enlaces y disponibilidad del servidor externo pueden cambiar. No se verificó manualmente la reproducción de los 750 GIFs en dispositivos físicos.

## Verificación

`npm run check` comprueba TypeScript, catálogo, importación/exportación, sesión, marcas, orden pendiente, restauración y temporizador por fecha. También renderiza las ramas de consulta/edición y Ajustes con controles nativos simulados, comprueba las cuatro paletas en ambos temas, la selección de opciones y el contraste mínimo de 4.5:1 de texto y botones. Las preferencias se validan al guardarse y recuperarse. `npm run lint` comprueba el código. `npm run export:check` genera paquetes JavaScript de diagnóstico para Android, iOS y web sin compilar bytecode.

Se validaron TypeScript, lint, las pruebas anteriores y la exportación JavaScript de las tres plataformas. El compilador Hermes de Windows terminó con código 6 en una comprobación anterior al generar bytecode; no hay una compilación nativa de producción verificada. Falta la prueba visual y de interacción en Android/iPhone, especialmente animación GIF, teclado, áreas seguras, menú de compartir, vibración y entrega de notificaciones con pantalla bloqueada.

## Referencias

- https://docs.expo.dev/get-started/start-developing/
- https://docs.expo.dev/build/internal-distribution/
- https://fitcron.com/exercises/
