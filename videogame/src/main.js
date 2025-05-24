/**
 * Main entry point for the game
 * Initializes the game and starts the main game loop
 */
import { variables } from "./config.js";
import { Game } from "./classes/game/Game.js";
import { log } from "./utils/Logger.js";

const canvas = document.getElementById("canvas");
canvas.width = variables.canvasWidth;
canvas.height = variables.canvasHeight;
window.ctx = canvas.getContext("2d");
window.canvas = canvas;

// Initialize logging system
log.setLevel(log.LEVELS.INFO); // Set to DEBUG for development, INFO for production

const game = new Game();

let previousTime = 0;
function frame(currentTime) {
  const deltaTime = currentTime - previousTime;
  previousTime = currentTime;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  game.update(deltaTime);
  game.draw(ctx);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
