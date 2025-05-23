// Archivo de configuración de variables y direcciones de teclas
export const variables = {
  // Dimensiones del canvas
  canvasWidth: 800,
  canvasHeight: 600,
  // Retardo de animación en milisegundos
  animationDelay: 100,
  // Velocidad de movimiento del jugador
  playerSpeed: 0.3,
  // Contexto de dibujo 2D del canvas (se inicializa en main.js)
  ctx: null,
  // Instancia del juego (se asigna en main.js)
  game: null,
  // Marca de tiempo anterior para calcular deltaTime
  oldTime: null,
  // Imagen de fondo del juego
  backgroundImage: new Image(),
};
// Ruta de la imagen de fondo
variables.backgroundImage.src = "../assets/background/background.jpg";

// Mapeo de teclas a direcciones de movimiento
export const keyDirections = {
  w: "up",
  s: "down",
  a: "left",
  d: "right",
};

// Configuración de animación para cada dirección del jugador
export const playerMovement = {
  up: {
    axis: "y", // Eje de movimiento vertical
    direction: -1, // -1 para subir
    frames: [104, 112], // Rango de frames de la animación
    repeat: true, // Repetir animación mientras se mantiene la tecla
    duration: variables.animationDelay, // Duración de cada frame
  },
  down: {
    axis: "y",
    direction: 1, // 1 para bajar
    frames: [130, 138],
    repeat: true,
    duration: variables.animationDelay,
  },
  left: {
    axis: "x", // Eje de movimiento horizontal
    direction: -1, // -1 para izquierda
    frames: [117, 125],
    repeat: true,
    duration: variables.animationDelay,
  },
  right: {
    axis: "x",
    direction: 1, // 1 para derecha
    frames: [143, 151],
    repeat: true,
    duration: variables.animationDelay,
  },
  idle: {
    axis: "y",
    direction: 0, // 0 para estado quieto
    frames: [130, 130], // Mismo frame para idle
    repeat: true,
    duration: variables.animationDelay,
  },
};
