# Ajuste de interfaz

## Márgenes, navegación y rutina de ejemplo

Las ventanas de importar, elegir ejercicios, ampliar GIF y cambiar ejercicio usan un componente `ScreenModal`. Cada ventana nativa tiene su propio `SafeAreaProvider`, inicialmente basado en las medidas del padre, y un `SafeAreaView` que protege los cuatro bordes. La presentación es a pantalla completa y el área segura se mide dentro de la propia ventana; evita depender de las medidas de otra ventana al dibujar la cabecera. Falta confirmarlo visualmente en el iPhone físico.

La cabecera de Ajustes usa dos elementos, botón a la izquierda y título a la derecha, igual que Resumen. Se retiró el bloque de aviso de notificaciones de Ajustes a petición del usuario. El botón + de la tarjeta de rutina vacía abre el catálogo y activa el modo edición cuando corresponde.

Importar rutina permite cargar una propuesta de Lunes - Pecho y Tríceps antes de confirmar la importación. El JSON se valida con el parser de la app y puede iniciar una sesión de cinco ejercicios y doce series. Se conservan los nombres y GIFs del catálogo. El logo usa Funnel Display 500 Medium.

## Apariencia personalizable

Ruta nueva `/settings`, accesible mediante **Ajustes** desde la cabecera. Tema claro, oscuro o del sistema; cuatro paletas: verde, azul, naranja y rosada. Los controles se identifican como opciones de radio y muestran el estado elegido. La selección es inmediata y se guarda por separado, sin remontar los proveedores de rutinas/entrenamiento.

Los colores semánticos se obtienen de un proveedor común: fondos, tarjetas, tipografía, botones, filtros, selección, estados de error, temporizador y modales. Se ajustan también los iconos del sistema y la apariencia del teclado. Se conserva el blanco de los GIFs, y los mensajes de error sobre ese blanco usan un tono fijo legible.

Las pruebas cubren las ocho combinaciones de colores, preferencias válidas/inválidas, resolución manual/sistema, contraste de texto/botones/errores y selección de opciones desde el render simulado de Ajustes. TypeScript, lint y exportación JavaScript para las tres plataformas pasan. La revisión visual en dispositivos físicos queda pendiente.

El bloque de notificaciones de Expo Go se retiró de Ajustes. La integración de notificaciones y sus mensajes de la consola permanecen sin cambios.

## Consulta y entrenamiento

La rutina se abre en consulta: conserva GIF, título, series, repeticiones, descanso y notas, sin campos editables ni controles para reordenar o quitar. **Editar rutina** muestra los controles existentes. **Iniciar rutina** abre una sesión independiente con casillas por serie, selector de cualquier ejercicio y avance al siguiente pendiente del orden guardado. Cambiar de ejercicio no cambia el orden de la rutina.

La navegación usa Expo Router. El estado de rutinas es compartido y conserva los identificadores locales al hidratar; las importaciones siguen generando identificadores nuevos. La sesión guarda su propia copia y progreso en otra clave de almacenamiento, incluyendo el descanso por fecha de finalización. Al restaurar un descanso ya vencido se evita reproducir una vibración antigua.

El descanso se activa manualmente, muestra cuenta regresiva y permite saltarlo. Con la app activa, usa Vibration de React Native. Se programa una notificación local para el aviso con pantalla bloqueada, si el usuario concede permiso; se cancela al saltar el descanso, reemplazar la sesión o finalizar. Sin permisos se muestra la limitación dentro del temporizador. No se solicitan tokens push ni servicios externos.

Se verificaron la separación consulta/edición mediante render con controles simulados, la independencia de sesiones, marcar/desmarcar, el retorno a ejercicios pendientes al saltar, la restauración y el tiempo restante tras suspensión simulada. Falta probar los avisos y vibración en dispositivos físicos.

## Dirección visual conservada

Software: app móvil de rutinas en React Native. Se aplican el sistema de color, jerarquía, controles y texto de Taste Skill; sus recetas de landing pages, CSS, hero, efectos WebGL y validación de secciones HTML no corresponden a las pantallas nativas.

Paleta obtenida con `start.mjs deal --page software --trade fitness`: **clay-pine**, piedra cálida con verde pino. Ayuda a separar los controles del fondo y reserva el acento para añadir y guardar. Tipografías obtenidas: **Funnel Display / Funnel Sans**, incluidas localmente mediante paquetes Expo Google Fonts; no dependen de descargar fuentes al abrir la app.

Voz: español directo; rutinas, ejercicios, series, repeticiones y descanso. Los totales se calculan desde los registros guardados. No se muestran sesiones, progreso o estadísticas de actividad inventadas.

Cambios:

- Inicio centrado en las rutinas y creación siempre visible, con miniaturas del primer ejercicio y grupos musculares reales.
- Editor con campos visibles de series, repeticiones, descanso y notas, GIF compacto, controles de orden nombrados para lectores de pantalla y botón fijo para añadir.
- Catálogo con miniaturas, búsqueda de varias palabras sin tildes, filtros y selección múltiple antes de volver al editor.
- El grupo de FitCron `Todos` se muestra como `General`. El filtro global `Todos` usa un identificador independiente. Se conservan los 750 ejercicios, incluidos los 57 de ese grupo.
- Se conserva la clave de almacenamiento y el formato de exportación anteriores.

Los GIFs y enlaces siguen siendo los originales de FitCron. No se añadieron fotografías de stock ni se cambiaron las rutinas del usuario.

Pendiente de validar en un teléfono físico: teclado numérico, áreas seguras, animación de GIFs y menú nativo de compartir. El inicio de sesión de Expo Go debe coincidir con la cuenta de Expo CLI; eso se configura en Expo Go y no mediante cambios en la app.

Verificación del cambio: `npm run check` y `npx expo lint` pasan. La exportación JavaScript de Android, iOS y web pasa con `--no-bytecode`; esto no es una compilación APK/IPA ni una validación nativa de producción. La prueba de regresión usa el catálogo real y comprueba la unicidad de claves y etiquetas, acceso a los 57 ejercicios de `General`, búsqueda sin tildes y resultados vacíos.

El gate de landing pages de Taste Skill no se aplica como criterio de una app React Native: exige secciones y otros elementos HTML ajenos a esta interfaz. No se ha migrado el proyecto a una página web para satisfacer esos checks.

Se intentó una captura de la exportación web a 390 × 844 usando `shoot.mjs` de la skill. El proceso terminó con `shoot: timed out` y no generó una imagen verificable; no se declara revisión visual aprobada. `npx expo install --check` confirmó que las dependencias están actualizadas para el SDK.
