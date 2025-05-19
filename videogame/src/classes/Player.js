import { AnimatedObject } from "./AnimatedObject.js";
import { Vec } from "./Vec.js";
import { variables, playerMovement } from "../config.js";

export class Player extends AnimatedObject {
  constructor(position, width, height, color, sheetCols) {
    super(position, width, height, color, "player", sheetCols);
    this.velocity = new Vec(0, 0);
    this.keys = [];
    this.previousDirection = "down";
    this.currentDirection = "down";
    this.weaponType = "dagger"; // Default weapon
  }

  setWeapon(type) {
    if (type === "dagger" || type === "slingshot") {
      this.weaponType = type;
    }
  }

  update(deltaTime) {
    this.setVelocity();
    this.setMovementAnimation();
    this.position = this.position.plus(this.velocity.times(deltaTime));
    this.constrainToCanvas();
    this.updateFrame(deltaTime);
  }

  constrainToCanvas() {
    const w = variables.canvasWidth;
    const h = variables.canvasHeight;
    if (this.position.y < 0) this.position.y = 0;
    else if (this.position.y + this.height > h)
      this.position.y = h - this.height;
    if (this.position.x < 0) this.position.x = 0;
    else if (this.position.x + this.width > w) this.position.x = w - this.width;
  }

  setVelocity() {
    this.velocity = new Vec(0, 0);
    for (const key of this.keys) {
      const move = playerMovement[key];
      if (move && move.axis) {
        this.velocity[move.axis] += move.direction;
      }
    }
    this.velocity = this.velocity.normalize().times(variables.playerSpeed);
  }

  setMovementAnimation() {
    const v = this.velocity;
    this.currentDirection =
      Math.abs(v.y) > Math.abs(v.x)
        ? v.y > 0
          ? "down"
          : v.y < 0
          ? "up"
          : "idle"
        : v.x > 0
        ? "right"
        : v.x < 0
        ? "left"
        : "idle";

    if (this.currentDirection !== this.previousDirection) {
      const anim = playerMovement[this.currentDirection];
      this.setAnimation(...anim.frames, anim.repeat, anim.duration);
      this.frame = this.minFrame;
    }

    if (this.currentDirection !== "idle") {
      this.previousDirection = this.currentDirection;
    }
  }
}
