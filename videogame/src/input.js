// Key mapping to movement directions (must match config.js)
const keyDirections = {
  w: "up",
  s: "down",
  a: "left",
  d: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

// Set up keyboard listeners for the player
export function setupInput(player) {
  // When a key is pressed
  window.addEventListener("keydown", (e) => {
    if (keyDirections[e.key]) {
      // Add direction if not already in the list
      if (!player.keys.includes(keyDirections[e.key])) {
        player.keys.push(keyDirections[e.key]);
      }
    }
  });

  // When a key is released
  window.addEventListener("keyup", (e) => {
    if (keyDirections[e.key]) {
      // Remove direction from the list
      const index = player.keys.indexOf(keyDirections[e.key]);
      if (index !== -1) {
        player.keys.splice(index, 1);
      }
    }
  });
}
