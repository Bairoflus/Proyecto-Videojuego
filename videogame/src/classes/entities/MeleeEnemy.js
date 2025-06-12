/**
 * Base class for melee enemy types
 * Extends Enemy with close-range combat behavior
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
    attackRange = 50,
    enemyTypeName = null
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
      enemyTypeName
    );

    this.attackRange = attackRange;
  }

  moveTo(playerOrPosition) {
    if (this.state === "dead") return;

    // Check if we received a player object or just a position
    const isPlayerObject =
      playerOrPosition &&
      typeof playerOrPosition.getHitboxBounds === "function";

    if (isPlayerObject) {
      // We have a player object - check for overlap
      if (boxOverlap(this, playerOrPosition)) {
        this.state = "attacking";
        this.velocity = new Vec(0, 0);
        return;
      }

      // Calculate centers for more accurate targeting
      const enemyHitbox = this.getHitboxBounds();
      const enemyCenter = new Vec(
        enemyHitbox.x + enemyHitbox.width / 2,
        enemyHitbox.y + enemyHitbox.height / 2
      );

      const playerHitbox = playerOrPosition.getHitboxBounds();
      const playerCenter = new Vec(
        playerHitbox.x + playerHitbox.width / 2,
        playerHitbox.y + playerHitbox.height / 2
      );

      // Calculate direction and move towards player
      const direction = playerCenter.minus(enemyCenter);

      this.state = "chasing";
      this.velocity = direction.normalize().times(this.movementSpeed);

      const newPosition = this.position.plus(this.velocity);
      this.moveToPosition(newPosition);
    } else {
      // We have just a position (Vec) - simpler logic for compatibility
      const direction = playerOrPosition.minus(this.position);

      this.state = "chasing";
      this.velocity = direction.normalize().times(this.movementSpeed);

      const newPosition = this.position.plus(this.velocity);
      this.moveToPosition(newPosition);
    }
  }
}
