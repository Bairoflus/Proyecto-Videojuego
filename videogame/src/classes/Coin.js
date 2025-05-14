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
