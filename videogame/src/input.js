export const keyDirections = {
  w: "up",
  s: "down",
  a: "left",
  d: "right",
};

export function setupInputListeners(player) {
  window.addEventListener("keydown", (event) => {
    if (Object.keys(keyDirections).includes(event.key)) {
      const dir = keyDirections[event.key];
      if (!player.keys.includes(dir)) player.keys.push(dir);
    }
  });

  window.addEventListener("keyup", (event) => {
    if (Object.keys(keyDirections).includes(event.key)) {
      const dir = keyDirections[event.key];
      const index = player.keys.indexOf(dir);
      if (index !== -1) player.keys.splice(index, 1);
    }
  });
}
