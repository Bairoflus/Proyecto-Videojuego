/**
 * Goblin Dagger enemy class
 * Melee enemy type that attacks at close range
 * Found commonly on floor 1
 */
import { MeleeEnemy } from "../../entities/MeleeEnemy.js";
import { Vec } from "../../../utils/Vec.js";
import { ENEMY_CONSTANTS } from "../../../constants/gameConstants.js";

export class GoblinDagger extends MeleeEnemy {
  constructor(position) {
    const config = ENEMY_CONSTANTS.GOBLIN_DAGGER;

    super(
      position,
      config.size.width,
      config.size.height,
      "red", // color (temporary, will be replaced by sprite)
      4, // sheetCols
      "goblin_dagger", // type
      config.speed,
      config.damage,
      config.health
    );

    // Set specific properties
    this.attackRange = config.attackRange;
    this.attackDuration = config.attackCooldown;
  }

  // Override moveTo for aggressive chase behavior
  moveTo(targetPosition) {
    if (this.state === "dead") return;

    // Always chase the player aggressively
    const direction = targetPosition.minus(this.position);
    const distance = direction.magnitude();

    this.state = "chasing";
    this.velocity = direction.normalize().times(this.movementSpeed);

    const newPosition = this.position.plus(this.velocity);
    this.moveToPosition(newPosition);

    // Attack if in range
    if (distance <= this.attackRange) {
      this.attack(this.target);
    }
  }

  updateAnimation() {
    // TODO: Implement goblin dagger specific animations
  }
}
