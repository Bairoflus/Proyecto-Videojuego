/**
 * Base class for melee enemy types
 * Extends Enemy with close-range combat behavior
 * Provides simple chase-and-attack behavior for melee enemies
 */
import { Enemy } from "./Enemy.js";
import { Vec } from "../../utils/Vec.js";
import { boxOverlap } from "../../draw.js";

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
    maxHealth,
    range = 50,
    enemyTypeName // Optional name for the enemy type
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
      maxHealth,
      range, // Pass range to parent
      0, // No projectile range for melee
      0, // No projectile damage for melee
      (enemyTypeName = "null")
    );

    // Melee-specific properties can be set here if needed
    this.attackRange = range; // Ensure attackRange is set correctly for melee
  }

  // Override moveTo for simple chase behavior
  moveTo(player) {
    if (this.state === "dead") return;

    // Check if hitboxes are overlapping - if so, stop moving and prepare to attack
    if (boxOverlap(this, player)) {
      this.state = "attacking";
      this.velocity = new Vec(0, 0);
      return;
    }

    // Calculate direction from enemy's center to player's center for movement
    const enemyHitbox = this.getHitboxBounds();
    const enemyCenter = new Vec(
      enemyHitbox.x + enemyHitbox.width / 2,
      enemyHitbox.y + enemyHitbox.height / 2
    );

    const playerHitbox = player.getHitboxBounds();
    const playerCenter = new Vec(
      playerHitbox.x + playerHitbox.width / 2,
      playerHitbox.y + playerHitbox.height / 2
    );

    const direction = playerCenter.minus(enemyCenter);
    
    // Always chase the player until hitboxes overlap
    this.state = "chasing";
    this.velocity = direction.normalize().times(this.movementSpeed);

    // Use parent's safe movement method
    const newPosition = this.position.plus(this.velocity);
    this.moveToPosition(newPosition);
  }
}
