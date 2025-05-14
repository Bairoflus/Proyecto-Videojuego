/*
 * Fausto Izquierdo
 * 2025-04-23
 */

import { variables } from "./config.js";
import { drawScene, setCtx, setGame } from "./draw.js";
import { Game } from "./classes/Game.js";

function main() {
  const canvas = document.getElementById("canvas");
  canvas.width = variables.canvasWidth;
  canvas.height = variables.canvasHeight;

  setCtx(canvas.getContext("2d"));
  const game = new Game();
  setGame(game);
  drawScene(0);
}

main();
