/**
 * Base class for melee enemy types
 * Extends Enemy with close-range combat behavior
 * Provides simple chase-and-attack behavior for melee enemies
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
    super(
      position,
      width,
      height,
      color,
      sheetCols,
      type,
      movementSpeed,
      baseDamage,
      maxHealth
    );

    // Melee-specific properties can be set here if needed
    this.attackRange = this.attackRange || 50; // Default melee range
  }

  // Override moveTo for simple chase behavior
  moveTo(targetPosition) {
    if (this.state === "dead") return;

    const direction = targetPosition.minus(this.position);
    const distance = direction.magnitude();

    if (distance > this.attackRange) {
      this.state = "chasing";
      this.velocity = direction.normalize().times(this.movementSpeed);

      // Use parent's safe movement method
      const newPosition = this.position.plus(this.velocity);
      this.moveToPosition(newPosition);
    } else {
      this.state = "attacking";
      this.velocity = new Vec(0, 0);
    }
  }
}
