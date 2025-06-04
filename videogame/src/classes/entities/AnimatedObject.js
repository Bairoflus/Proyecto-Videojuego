/**
 * AnimatedObject class extends GameObject with sprite animation support
 * Handles sprite sheet animation, frame updates, and animation cycling
 */
import { GameObject } from "./GameObject.js";
import { Rect } from "../../utils/Rect.js";
import { ANIMATION_CONSTANTS } from "../../constants/gameConstants.js";

export class AnimatedObject extends GameObject {
  constructor(position, width, height, color, type, sheetCols) {
    // Llamada al constructor
    super(position, width, height, color, type);
    this.frame = 0;
    this.minFrame = 0;
    this.maxFrame = 0;
    this.sheetCols = sheetCols;
    this.repeat = true;
    this.frameDuration = ANIMATION_CONSTANTS.DEFAULT_DELAY;
    this.totalTime = 0;

    // spriteRect will be set automatically when sprite is loaded via setSprite
    this.spriteRect = null;
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
      // Allow non-repeating animations to exceed maxFrame for completion detection
      if (this.frame < this.maxFrame) {
        this.frame++;
      } else if (this.repeat) {
        this.frame = this.minFrame;
      } else {
        this.frame++; // Allow exceeding maxFrame for non-repeating animations
      }

      // Ensure spriteRect exists before updating
      if (this.spriteRect) {
        const oldX = this.spriteRect.x;
        const oldY = this.spriteRect.y;
        this.spriteRect.x = this.frame % this.sheetCols;
        this.spriteRect.y = Math.floor(this.frame / this.sheetCols);

        // Debug logging for sprite frame changes during attacks (only for significant changes)
        if (
          this.type === "player" &&
          this.isAttacking &&
          (oldX !== this.spriteRect.x || oldY !== this.spriteRect.y)
        ) {
          // Debug logging removed to reduce console spam
        }
      }
      this.totalTime = 0;
    }
  }
}
