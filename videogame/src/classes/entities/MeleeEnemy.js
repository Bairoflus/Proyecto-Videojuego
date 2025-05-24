/**
 * Base class for melee enemy types
 * Extends Enemy with close-range combat behavior
 * Simplifies melee attack patterns for derivative classes
 */
import { Enemy } from "./Enemy.js";
import { Vec } from "../../utils/Vec.js";

export class MeleeEnemy extends Enemy {
  constructor(
    position,
    width,
    height,
    color,
    sheetCols,
    type,
    movementSpeed,
    baseDamage,
    maxHealth
  ) {
    super(position, width, height, color, "enemy", sheetCols);

    // Core stats
    this.maxHealth = maxHealth;
    this.health = this.maxHealth;
    this.movementSpeed = movementSpeed;
    this.baseDamage = baseDamage;
    this.type = type;

    // State
    this.state = "idle"; // idle, chasing, attacking, dead
    this.target = null;
    this.velocity = new Vec(0, 0);
    this.currentDirection = "down";
    this.isAttacking = false;
    this.attackCooldown = 0;
  }

  moveTo(targetPosition) {
    if (this.state === "dead") return;

    const direction = targetPosition.minus(this.position);
    const distance = direction.magnitude();

    if (distance > this.attackRange) {
      this.state = "chasing";
      this.velocity = direction.normalize().times(this.movementSpeed);
      this.position = this.position.plus(this.velocity);
    } else {
      this.state = "attacking";
      this.velocity = new Vec(0, 0);
    }
  }

  update(deltaTime) {
    if (this.state === "dead") return;

    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }

    this.updateAnimation();
    this.constrainToCanvas();
  }

  draw(ctx) {
    // Call parent class draw method for health bar and sprite
    super.draw(ctx);
  }

  updateAnimation() {
    // To be implemented by specific enemy types
  }
}
