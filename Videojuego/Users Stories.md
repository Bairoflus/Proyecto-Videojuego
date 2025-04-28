### **Template \- Historia de Usuario**

**Título:** \[Breve descripción de la funcionalidad\]

**Descripción:**  
Como **\[tipo de usuario\]**, quiero **\[acción o funcionalidad\]**, para **\[objetivo o beneficio\]**.

**Criterios de Aceptación:**

* \[Condición 1 que debe cumplirse\]  
* \[Condición 2 que debe cumplirse\]  
* \[Condición 3 que debe cumplirse\]

**Nivel de Aceptación:**  
 🔴 **Alto** (Esencial para la mecánica o flujo principal del juego)  
 🟡 **Medio** (Mejora la experiencia, pero no detiene el progreso)  
 🟢 **Bajo** (Mejora detalles estéticos o funcionalidades secundarias)

**Tiempo estimado:**  
 ⏳ \[Cantidad de horas o sprints esperadas para implementar\]

**Notas adicionales:**

* \[Detalles técnicos, restricciones o dependencias\]  
* \[Opcional: mockups, referencias o comentarios extra\]

### 

### **Historia de Usuario \#1 – Exploración de Piso**

**Título:** Creación del piso  
**Descripción:**  
Como **jugador**, quiero adentrarme en un **piso generado aleatoriamente** con diferentes habitaciones y pasillos, para **vivir una experiencia nueva en cada partida.**

**Criterios de Aceptación:**

* Cada vez que empiezo un piso, el layout (habitaciones, pasillos y puertas) se genera de forma procedural.  
* Todas las habitaciones son accesibles (no quedan espacios bloqueados sin salida).  
* La distribución de enemigos y cofres varía entre runs.

**Nivel de Aceptación:** 🔴 **Alto**  
**Sprint estimados:** 1 \- 2 Sprints  
**Notas adicionales:**

* Incluir debug mode para visualizar el grafo de generación durante pruebas.

### **Historia de Usuario \#2 – Exploración sin restricciones**

**Título:** Movimiento libre

**Descripción:**  
Como **jugador**, quiero **moverme libremente en cualquier dirección**, para **explorar sin restricciones y posicionarme estratégicamente en combate**.

**Criterios de Aceptación:**

* El jugador puede desplazarse de manera suave y continua en cualquier vector, sin ángulos predefinidos.  
* El input (teclado, gamepad o stick analógico) se traduce directamente en movimiento sin “saltos” ni zonas muertas.  
* El personaje detecta colisiones correctamente y no atraviesa ni se atasca en el entorno.

**Nivel de Aceptación:** 🔴 **Alto** 

**Sprint estimados:** 1 \- 2 Sprints

**Notas adicionales:**

* Ajustar parámetros de velocidad y aceleración para conservar sensación de fluidez.

### **Historia de Usuario \#3 – Evasión**

**Título:** Dash o esquivar ataques

**Descripción:**  
Como **jugador**, quiero **poder ejecutar un dash para desplazarme con rapidez y evadir ataques enemigos**, para **aumentar mi movilidad y supervivencia en combate**.

**Criterios de Aceptación:**

* Al pulsar la tecla o botón asignado, el personaje realiza un dash en la dirección actual.  
* El dash tiene un cooldown configurado (por ejemplo, 2 s) y una duración fija.  
* Durante el dash, el personaje es invulnerable a colisiones con enemigos.

**Nivel de Aceptación:** 🔴 **Alto**

**Sprint estimados:** 1 \- 2 Sprints

**Notas adicionales:**

* Incluir animación y sonido específicos para el dash.

### **Historia de Usuario \#4 – Equipamiento**

**Título:** Combate con armas y hechizos

**Descripción:**  
Como **jugador**, quiero **atacar a los enemigos usando armas y hechizos**, para **avanzar en las habitaciones y derrotar a mis oponentes**.

**Criterios de Aceptación:**

* El jugador puede realizar ataques cuerpo a cuerpo y a distancia con armas.  
* El jugador puede lanzar hechizos consumiendo maná.  
* Las animaciones y efectos de impacto se reproducen correctamente al golpear.

**Nivel de Aceptación:** 🔴 **Alto**

**Sprint estimados:** 1 \- 3 Sprints

**Notas adicionales:**

* Balancear coste de maná y daño de cada hechizo.

### **Historia de Usuario \#5 – Recursos**

**Título:** Visualización de recursos en HUD

**Descripción:**  
Como **jugador**, quiero **ver mis indicadores de salud, estamina, maná y oro en pantalla**, para **gestionar mis recursos durante la partida**.

**Criterios de Aceptación:**

* El HUD muestra valores numéricos y barras de salud, estamina, maná y oro.  
* El HUD se actualiza en tiempo real ante cambios de recurso.  
* Los elementos del HUD son legibles en diferentes resoluciones.

**Nivel de Aceptación:** 🔴 **Alto**

**Sprint estimados:** 1 Sprints

**Notas adicionales:**

* Implementar escalado automático del HUD para distintos ratios de pantalla

### **Historia de Usuario \#6 – Combate**

**Título:** Enfrentamiento con enemigos

**Descripción:**  
Como **jugador**, quiero **enfrentarme a enemigos con comportamientos variados**, para **poner a prueba mis habilidades de combate, mantener la tensión y avanzar de forma satisfactoria en el juego**.

**Criterios de Aceptación:**

* El jugador encuentra y combate contra diversos tipos de enemigos en cada piso.  
* Cada enemigo presenta un patrón de ataque o comportamiento distinto que requiere adaptarse.  
* Tras derrotar a todos los enemigos de una sala, se desbloquea la progresión al siguiente área.

**Nivel de Aceptación:** 🔴 **Alto** 

**Sprint estimados:** 3 \- 4 Sprints

**Notas adicionales:**

* Ajustar variedad y dificultad de enemigos según el progreso del jugador.

### 

### **Historia de Usuario \#7 – Jefes**

**Título:** Enfrentamiento contra jefes al finalizar cada piso

**Descripción:**  
Como **jugador**, quiero **enfrentarme a un jefe desafiante al finalizar todas las salas de un piso**, para **poner a prueba mis habilidades, demostrar mi progreso y desbloquear el siguiente nivel**.

**Criterios de Aceptación:**

* La batalla contra el jefe comienza cuando el jugador interactúa con la puerta de entrada, y esta se cierra tras él.  
* El jefe aparece en una arena dedicada con su nombre y barra de vida visibles, y muestra señales claras antes de cada ataque.  
* Al derrotar al jefe, se reproduce una breve cinemática de victoria y se abre el portal al siguiente piso.

**Nivel de Aceptación:** 🔴 **Alto** 

**Sprint estimados:** 3 \- 4 Sprints

**Notas adicionales:**

* Incluir animaciones y efectos de sonido únicos para el jefe.

### **Historia de Usuario \#8 – Puertas multidimensionales**

**Título:** Interacción con portales/grietas

**Descripción:**  
Como **jugador**, quiero **usar portales o grietas dimensionales colocados al final de cada piso**, para **desplazarme rápidamente entre niveles o regresar a la base manteniendo mi progreso y recursos**.

**Criterios de Aceptación:**

* Los portales/grietas aparecen en la sala final tras vencer al jefe.  
* Al acercarse al portal, se muestra un indicador visual (“Presiona E para usar”) y un efecto de brillo distintivo.  
* Al pulsar la tecla de interacción, el jugador queda inmovilizado y se reproduce una animación de “absorción”.  
* El portal transporta al jugador al siguiente piso, conservando valores de salud, estamina, maná, inventario y mejoras desbloqueadas.

**Nivel de Aceptación:** 🔴 **Alto** 

**Sprint estimados:** 1 \- 2 Sprints

**Notas adicionales:**

* Asegurar que la posición de reaparición en el siguiente piso esté libre de colisiones.

### **Historia de Usuario \#9 – Feedback audiovisual**

**Título:** Retroalimentación visual y auditiva en acciones clave

**Descripción:**  
Como **jugador**, quiero **recibir feedback visual y sonora al recibir o infringir daño, curarme o recolectar objetos**, para **entender mejor lo que sucede**.

**Criterios de Aceptación:**

* Al recibir daño, el borde de la pantalla parpadea en rojo y suena un efecto de impacto; al infligir daño, aparece un destello sobre el enemigo y se reproduce un sonido de ataque.  
* Al curarme, aparece un efecto visual verde y se reproduce un sonido de curación.  
* El volumen de los efectos respeta el nivel global de audio configurado por el usuario en las opciones.

**Nivel de Aceptación:** 🟡 **Medio** 

**Sprint estimados:** 1 \- 2 Sprints

**Notas adicionales:**

* Permitir ajustar la intensidad y duración de los efectos visuales y sonoros desde el menú de opciones.

### **Historia de Usuario \#10 – Recompensa de oro**

**Título:** Obtención de oro por derrotar enemigos

**Descripción:**  
Como **jugador**, quiero **recibir oro al derrotar enemigos**, para **poder comprar artículos o mejoras en las tiendas**.

**Criterios de Aceptación:**

* Al derrotar a todos los enemigos de una sala, aparece una grieta dimensional que otorga recompensas.  
* El total de oro del jugador se actualiza inmediatamente en el HUD y persiste entre escenas o cargas de partida.  
* Tras obtener oro, se muestra un texto flotante sobre el personaje con la cantidad exacta ganada.

**Nivel de Aceptación:** 🟡 **Medio** 

**Sprint estimados:** 1 \- 2 Sprints

**Notas adicionales:**

* Permitir configurar en tiempo de diseño los rangos de oro por tipo de enemigo y cofres.

### **Historia de Usuario \#11 – Tienda**

**Título:** Compra de objetos en tiendas

**Descripción:**  
Como **jugador**, quiero **comprar armas, objetos, mejoras y esquemas en las tiendas**, para **adaptarme a los desafíos y fortalecerme antes de continuar**.

**Criterios de Aceptación:**

* Las tiendas muestran un catálogo de armas, pociones y mejoras disponibles.  
* El jugador puede gastar su oro para adquirir ítems y el saldo se actualiza al instante.  
* Los objetos comprados aparecen en el inventario con sus efectos activos.

**Nivel de Aceptación:** 🟡 **Medio** 

**Sprint estimados:** 2 \- 3 Sprints

**Notas adicionales:**

* Permitir cancelar compras antes de confirmar.  
* Descripción breve del objeto a comprar.

### **Historia de Usuario \#12 – Mejoras permanentes**

**Título:** Sistema de mejora permanente en la base

**Descripción:**  
Como **jugador**, quiero **invertir los recursos obtenidos en estructuras de la base**, para **mejorar mis atributos y desbloquear nuevas armas**.

**Criterios de Aceptación:**

* El jugador utiliza recursos obtenidos en los pisos para desbloquear y construir mejoras en la base.  
* Cada estación o estructura (estación de comida, herrería, laboratorio, etc.) tiene un coste definido y otorga un beneficio específico.  
* La interfaz de construcción muestra claramente los recursos disponibles y el coste de cada estación o estructura.

**Nivel de Aceptación:** 🔴 **Alto**

**Sprint estimados:** 3 \- 5 Sprints

**Notas adicionales:**

* Guardar el estado de todas las construcciones en el perfil del jugador.  
* Permitir ver en el panel de la base qué estructuras están disponibles y cuáles ya están construidas.

### **Historia de Usuario \#13 – Archivo guardado**

**Título:** Guardado de progreso en múltiples slots

**Descripción:**  
Como **jugador**, quiero **guardar mi progreso en diferentes ranuras de guardado**, para **retomar la partida**.

**Criterios de Aceptación:**

* Existen al menos tres slots de guardado seleccionables.  
* Cada slot muestra la última fecha de jugado.  
* La carga desde un slot restaura exactamente el estado previo.

**Nivel de Aceptación:** 🔴 **Alto**

**Sprints estimados:** 2 \- 3 sprints

**Notas adicionales:**

* Confirmación antes de sobrescribir un slot.

### **Historia de Usuario \#14 – Menú de inicio**

**Título:** Selección de nueva partida o continuación

**Descripción:**  
Como **jugador**, quiero **elegir entre iniciar una partida nueva o continuar una existente desde la pantalla de inicio**, para **gestionar mis partidas de forma rápida y retomar mi progreso donde lo dejé**.

**Criterios de Aceptación:**

* La pantalla inicial muestra los botones “Nueva Partida” y “Cargar Partida”.  
* La transición entre menú y juego es fluida sin errores.  
* Si no hay partidas guardadas, la opción “Cargar partida” aparece deshabilitada o en gris

**Nivel de Aceptación:** 🔴 **Alto**

**Sprints estimados:** 2 \- 4 sprints

**Notas adicionales:**

* Tutorial breve en la primera partida.

### **Historia de Usuario \#15 – Regeneración de estamina**

**Título:** Regeneración de estamina por comida

**Descripción:**  
Como **jugador**, quiero **que mi nivel de comida influya en la regeneración de estamina**, para **planificar mejor mis acciones**.

**Criterios de Aceptación:**

* La tasa de regeneración varía según el porcentaje de comida.  
* El HUD muestra un indicador de comida y su efecto en la estamina.  
* La estamina regenerada no puede sobrepasar el tope máximo definido para el personaje.

**Nivel de Aceptación:** 🟡 **Medio**

**Sprints necesarios: 2 \- 3 sprints**

**Notas adicionales:**

* Definir fórmula de regeneración en el documento de balance.

### **Historia de Usuario \#16 – Ajustes de Controles y Audio**

**Título:** Personalizar Controles y Audio  
**Descripción:**  
Como **jugador**, quiero poder modificar la **configuración de controles** y el **volumen** de música y efectos, para **adaptar la experiencia a mis preferencias**.

**Criterios de Aceptación:**

* Se puede reasignar cada acción (mover, atacar, dash…) a cualquier tecla o botón.  
* Controles de volumen separados para música y SFX con sliders de 0–100%.  
* Los cambios se guardan en un archivo de configuración y persisten al reiniciar.

**Nivel de Aceptación:** 🟡 **Medio**  
**Sprints estimados:** 1 \- 2 sprints  
**Notas adicionales:**

* Incluir botón “Restaurar valores por defecto”.

### **Historia de Usuario \#17 – Introducción al juego**

**Título:** Tutorial interactivo

**Descripción:**  
Como **jugador**, quiero **un tutorial inicial que me enseñe las mecánicas básicas**, para **empezar la partida sintiéndome cómodo con el control y las reglas**.

**Criterios de Aceptación:**

* El tutorial guía al jugador a través de movimiento, combate y uso de recursos paso a paso.  
* Cada sección del tutorial se completa al realizar la acción indicada (moverse, usar dash, atacar).  
* Al finalizar, el jugador puede omitir futuros tutoriales desde las opciones.

**Nivel de Aceptación:** 🔴 **Alto**

**Sprints estimados:** 3 \- 5 sprints

**Notas adicionales:**

* Permitir saltar o repetir el tutorial desde el menú de pausa.

### **Historia de Usuario \#18 – Exploración**

**Título:** Minimapa del piso

**Descripción:**  
Como **jugador**, quiero **ver un minimapa de mi posición y las habitaciones ya exploradas**, para **orientarme y planificar mi ruta sin perderme**.

**Criterios de Aceptación:**

* El minimapa muestra la posición actual del jugador y las salas conectadas.  
* El minimapa no superpone más del 10 % de la pantalla  
* El minimapa se actualiza en tiempo real al moverse entre salas.

**Nivel de Aceptación:** 🔴 **Alto** 

**Sprints estimados:** 2 \- 3 sprints

**Notas adicionales:**

* Desactivar el minimapa cuando este enfrentados a un enemigo.

### **Historia de Usuario \#19 – Progreso**

**Título:** Auto-guardado periódico

**Descripción:**  
Como **jugador**, quiero **que el juego guarde automáticamente mi estado cada cierto tiempo o al entrar a nuevas áreas**, para **minimizar la pérdida de progreso ante un cierre inesperado**.

**Criterios de Aceptación:**

* El sistema guarda automáticamente el progreso cada X minutos (configurable) sin interrumpir la jugabilidad.  
* Se realiza un auto-guardado al completar un piso.  
* Se realiza un auto-guardado tras la muerte del jugador.  
* Se realiza un auto-guardado al salir de la base para iniciar un nuevo piso.  
* Al completarse cualquier auto-guardado, aparece un indicador en pantalla (“Guardado”) que desaparece tras unos segundos.

**Nivel de Aceptación:** 🟡 **Medio**

**Sprints estimados:** 2 \- 4 sprints

**Notas adicionales:**

* Evitar auto-guardar inmediatamente tras un guardado manual, respetando un intervalo mínimo configurable.

