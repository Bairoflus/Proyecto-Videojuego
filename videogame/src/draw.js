// Este módulo se encarga de la lógica de dibujo y actualización del juego.
import { variables } from "./config.js";

let ctx = null;
let game = null;
let oldTime = null;

// Getters y setters para variables privadas del módulo
export function getCtx() {
  return ctx;
}
export function setCtx(value) {
  ctx = value;
}
export function getGame() {
  return game;
}
export function setGame(value) {
  game = value;
}
export function getOldTime() {
  return oldTime;
}
export function setOldTime(value) {
  oldTime = value;
}

// Función de detección de colisiones
export function boxOverlap(obj1, obj2) {
  return (
    obj1.position.x + obj1.width > obj2.position.x &&
    obj1.position.x < obj2.position.x + obj2.width &&
    obj1.position.y + obj1.height > obj2.position.y &&
    obj1.position.y < obj2.position.y + obj2.height
  );
}

// Bucle principal de dibujo y actualización del juego
export function drawScene(newTime) {
  // Inicializar oldTime la primera vez
  if (oldTime == undefined) oldTime = newTime;
  // Tiempo transcurrido desde el frame anterior
  const deltaTime = newTime - oldTime;

  // Dibujar el fondo escalado al tamaño del canvas
  ctx.drawImage(
    variables.backgroundImage,
    0,
    0,
    variables.canvasWidth,
    variables.canvasHeight
  );

  // Dibujar y actualizar la lógica del juego
  game.draw(ctx);
  game.update(deltaTime);

  // Actualizar marca de tiempo y solicitar siguiente frame
  setOldTime(newTime);
  requestAnimationFrame(drawScene);
}