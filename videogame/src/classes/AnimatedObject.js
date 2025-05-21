import { GameObject } from "./GameObject.js";

export class AnimatedObject extends GameObject {
  constructor(position, width, height, color, type, sheetCols) {
    super(position, width, height, color, type);
    this.frame = 0;
    this.minFrame = 0;
    this.maxFrame = 0;
    this.sheetCols = sheetCols;
    this.repeat = true;
    this.frameDuration = 100;
    this.totalTime = 0;
  }

  setAnimation(minFrame, maxFrame, repeat, duration) {
    this.minFrame = minFrame;
    this.maxFrame = maxFrame;
    this.frame = minFrame;
    this.repeat = repeat;
    this.totalTime = 0;
    this.frameDuration = duration;
  }

  updateFrame(deltaTime) {
    this.totalTime += deltaTime;
    if (this.totalTime > this.frameDuration) {
      let restart = this.repeat ? this.minFrame : this.frame;
      this.frame = this.frame < this.maxFrame ? this.frame + 1 : restart;
      this.spriteRect.x = this.frame % this.sheetCols;
      this.spriteRect.y = Math.floor(this.frame / this.sheetCols);
      this.totalTime = 0;
    }
  }
}
