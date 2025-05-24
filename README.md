# Shattered Timeline - Videojuego Roguelite

## Descripción
Shattered Timeline es un videojuego de acción roguelite top-down desarrollado en JavaScript utilizando Canvas API. El jugador debe atravesar múltiples pisos llenos de enemigos, recolectar oro y mejorar sus armas en las tiendas para progresar.

## Características Principales

### Sistema de Combate
- **Arma primaria (Dagger)**: Ataque cuerpo a cuerpo con rango extendido (75px)
  - Sistema de detección de línea de visión que limita el ataque si hay paredes
  - Daño base: 10 puntos + bonificaciones de tienda
  - Visualización del área de ataque (roja normal, naranja cuando está limitada por paredes)
  
- **Arma secundaria (Slingshot)**: Ataque a distancia con proyectiles
  - Daño base: 15 puntos + bonificaciones de tienda
  - Los proyectiles se destruyen al impactar con paredes

### Sistema de Progresión
- **Estructura del juego**: 
  - 3 pisos por run
  - 6 habitaciones por piso (4 de combate + 1 tienda + 1 jefe)
  - Contador de runs persistente que nunca se resetea
  
- **Sistema de oro y recompensas**:
  - Los enemigos no sueltan oro al morir
  - Cofres dorados aparecen tras limpiar habitaciones de combate (50 oro)
  - El oro se pierde al morir

### Sistema de Tienda
- **Mejoras disponibles**:
  1. **Mejora de arma primaria**: 35 oro, +3 daño, máximo 15 mejoras por run
  2. **Mejora de arma secundaria**: 40 oro, +4 daño, máximo 15 mejoras por run
  3. **Restauración de salud completa**: 50 oro, sin límite

- **Características**:
  - Las mejoras son globales por run (se mantienen entre habitaciones)
  - Se resetean al morir
  - Interfaz con WASD para navegar, Enter para comprar, ESC para salir
  - Zona de activación visual en las habitaciones de tienda

### Enemigos
- **Goblin Dagger**: Enemigo cuerpo a cuerpo común
- **Goblin Archer**: Enemigo a distancia que dispara proyectiles
- Generación procedural: 6-10 enemigos por habitación de combate
- Los enemigos no reaparecen al volver a habitaciones anteriores

### Sistema de Muerte y Reset
- Al morir:
  - Se incrementa el contador de runs (persistente)
  - Se resetean: piso, habitación, oro, mejoras de armas
  - El jugador vuelve al inicio con estadísticas base
  - Delay de 1 segundo antes del reset

## Controles
- **Movimiento**: WASD o flechas direccionales
- **Ataque**: Barra espaciadora
- **Cambiar arma**: Q (dagger) / E (slingshot)
- **Dash**: Shift izquierdo
- **Tienda**: WASD para navegar, Enter para comprar, ESC para salir

## Requisitos Técnicos
- Navegador web moderno con soporte para ES6 modules
- Python 3 para el servidor local de desarrollo

## Instalación y Ejecución

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/Proyecto-Videojuego.git
cd Proyecto-Videojuego
```

2. Inicia el servidor local:
```bash
cd videogame
python3 -m http.server 8000
```

3. Abre tu navegador y ve a:
```
http://localhost:8000/src/
```

## Estructura del Proyecto
```
videogame/
├── src/
│   ├── assets/         # Sprites y recursos gráficos
│   ├── classes/        # Clases del juego
│   │   ├── entities/   # Player, Enemy, Projectile, Shop, etc.
│   │   ├── enemies/    # Tipos específicos de enemigos
│   │   ├── rooms/      # Sistema de habitaciones
│   │   └── game/       # Game controller y FloorGenerator
│   ├── utils/          # Utilidades (Vec, Rect, Logger)
│   ├── config.js       # Configuración global
│   ├── main.js         # Punto de entrada
│   └── index.html      # Página principal
```

## Características Técnicas Implementadas

### Optimizaciones de Rendimiento
- Sistema de actualización de estados basado en eventos (no por frame)
- Detección eficiente de colisiones con raycast
- Gestión inteligente de proyectiles

### Persistencia
- Estados de habitaciones preservados al navegar entre ellas
- Contador de runs guardado en localStorage
- Sistema global de mejoras de tienda por run

### Sistema de Combate Mejorado
- Detección de línea de visión para ataques cuerpo a cuerpo
- Los ataques no atraviesan paredes
- Retroalimentación visual clara del alcance de ataque

## Próximas Características
- Implementación del jefe final
- Más tipos de enemigos
- Sistema de habilidades especiales
- Mejoras visuales y efectos de sonido
- Balance de dificultad progresiva

## Créditos
Desarrollado por el equipo de Tecnológico de Monterrey - Semestre 4