// Coin.js: Moneda animada que hereda de AnimatedObject
import { AnimatedObject } from "./AnimatedObject.js";

export class Coin extends AnimatedObject {
  constructor(position, width, height, color, sheetCols) {
    // Inicializa una moneda con tipo "coin" y número de columnas en la spritesheet
    super(position, width, height, color, "coin", sheetCols);
    this.keys = []; // No usa teclas, pero mantiene la estructura de AnimatedObject
  }

  // Actualiza sólo el frame de la animación
  update(deltaTime) {
    this.updateFrame(deltaTime);
  }
}