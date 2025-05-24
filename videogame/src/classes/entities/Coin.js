/**
 * Coin collectible class
 * Represents in-game currency that can be collected by the player
 * Animated collectible object
 */
import { AnimatedObject } from "./AnimatedObject.js";

export class Coin extends AnimatedObject {
  constructor(position, width, height, color, sheetCols) {
    super(position, width, height, color, "coin", sheetCols);
    this.keys = [];
  }

  update(deltaTime) {
    this.updateFrame(deltaTime);
  }
}
