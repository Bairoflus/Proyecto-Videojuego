import { AnimatedObject } from "./AnimatedObject.js";
import { Vec } from "./Vec.js";
import {
  variables,
  playerMovement,
  playerAttack,
  getAttackFrames,
} from "../config.js";

export class Player extends AnimatedObject {
  constructor(position, width, height, color, sheetCols) {
    super(position, width, height, color, "player", sheetCols);
    this.velocity = new Vec(0, 0);
    this.keys = [];
    this.previousDirection = "down";
    this.currentDirection = "down";
    this.weaponType = "dagger"; // Default weapon
    this.isAttacking = false;
    this.attackCooldown = 0;
  }

  setWeapon(type) {
    if (type === "dagger" || type === "slingshot") {
      this.weaponType = type;
    }
  }

  attack() {
    if (!this.isAttacking && this.attackCooldown <= 0) {
      this.isAttacking = true;
      this.attackCooldown = playerAttack.cooldown;
      // Store current frame and direction before attacking
      this.preAttackFrame = this.frame;
      this.preAttackDirection = this.currentDirection;
      this.preAttackMinFrame = this.minFrame;
      this.preAttackMaxFrame = this.maxFrame;
      const attackFrames = getAttackFrames(
        this.weaponType,
        this.currentDirection
      );
      this.setAnimation(
        attackFrames[0],
        attackFrames[1],
        playerAttack.repeat,
        playerAttack.duration
      );
      this.frame = this.minFrame;
    }
  }

  update(deltaTime) {
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }
    if (this.isAttacking && this.frame >= this.maxFrame) {
      this.isAttacking = false;
      // Return to the exact frame and direction we were in before the attack
      const anim = playerMovement[this.preAttackDirection];
      this.minFrame = this.preAttackMinFrame;
      this.maxFrame = this.preAttackMaxFrame;
      this.frame = this.preAttackFrame;
      this.repeat = anim.repeat;
      this.frameDuration = anim.duration;
      this.spriteRect.x = this.frame % this.sheetCols;
      this.spriteRect.y = Math.floor(this.frame / this.sheetCols);
    }

    this.setVelocity();
    // Only update movement animation if not attacking
    if (!this.isAttacking) {
      this.setMovementAnimation();
    }
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
    // Only update direction if we're actually moving
    if (v.x !== 0 || v.y !== 0) {
      const newDirection =
        Math.abs(v.y) > Math.abs(v.x)
          ? v.y > 0
            ? "down"
            : v.y < 0
            ? "up"
            : this.currentDirection
          : v.x > 0
          ? "right"
          : v.x < 0
          ? "left"
          : this.currentDirection;

      if (newDirection !== this.currentDirection) {
        this.currentDirection = newDirection;
        const anim = playerMovement[this.currentDirection];
        this.setAnimation(...anim.frames, anim.repeat, anim.duration);
        this.frame = this.minFrame;
        this.previousDirection = this.currentDirection;
      }
    } else {
      // When not moving, keep the current direction and set to first frame
      const anim = playerMovement[this.currentDirection];
      this.setAnimation(anim.frames[0], anim.frames[0], false, anim.duration);
      this.frame = anim.frames[0];
      this.spriteRect.x = this.frame % this.sheetCols;
      this.spriteRect.y = Math.floor(this.frame / this.sheetCols);
    }
  }
}
