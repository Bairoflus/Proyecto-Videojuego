// Mapeo de teclas a direcciones de movimiento (debe coincidir con config.js)
export const keyDirections = {
  w: "up",
  s: "down",
  a: "left",
  d: "right",
};

// Configurar escuchas de teclado para el jugador
export function setupInputListeners(player) {
  // Cuando se presiona una tecla
  window.addEventListener("keydown", (event) => {
    if (Object.keys(keyDirections).includes(event.key)) {
      const dir = keyDirections[event.key];
      // Añadir dirección si no está ya en la lista
      if (!player.keys.includes(dir)) player.keys.push(dir);
    }
  });

  // Cuando se suelta una tecla
  window.addEventListener("keyup", (event) => {
    if (Object.keys(keyDirections).includes(event.key)) {
      const dir = keyDirections[event.key];
      // Eliminar dirección de la lista
      const index = player.keys.indexOf(dir);
      if (index !== -1) player.keys.splice(index, 1);
    }
  });
}