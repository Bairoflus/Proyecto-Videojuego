/**
 * Main entry point for the game
 * Initializes the game and starts the main game loop
 */
import { variables } from "./config.js";
import { Game } from "./classes/game/Game.js";
import { log } from "./utils/Logger.js";

export function main() {
  // Get canvas reference and set dimensions
  const canvas = document.getElementById("gameCanvas");
  canvas.width = variables.canvasWidth;
  canvas.height = variables.canvasHeight;
  window.ctx = canvas.getContext("2d");
  window.canvas = canvas;

  // Initialize logging system
  log.setLevel(log.LEVELS.INFO);

  console.log('Creating game instance...');
  const game = new Game();

  // Wait for game to be ready before starting game loop
  game.onReady(() => {
    console.log('Game ready - starting game loop');

    let previousTime = 0;
    async function frame(currentTime) {
      const deltaTime = currentTime - previousTime;
      previousTime = currentTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Handle async update without blocking frame rate
      try {
        await game.update(deltaTime);
      } catch (error) {
        console.error("Game update error:", error);
      }

      game.draw(ctx);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}
