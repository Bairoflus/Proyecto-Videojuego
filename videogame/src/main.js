/*
 * Fausto Izquierdo
 * Fecha: 2025-04-23
 * Punto de entrada de la aplicación
 */

// Importar módulos necesarios
import { variables } from "./config.js";
import { drawScene, setCtx, setGame } from "./draw.js";
import { Game } from "./classes/Game.js";

function main() {
  // Obtener referencia al canvas y ajustar sus dimensiones
  const canvas = document.getElementById("gameCanvas");
  canvas.width = variables.canvasWidth;
  canvas.height = variables.canvasHeight;

  // Inicializar contexto de dibujo y juego
  setCtx(canvas.getContext("2d"));
  const game = new Game();
  setGame(game);

  // Iniciar bucle de dibujo
  drawScene(0);
}

// Ejecutar función main al cargar
main();
