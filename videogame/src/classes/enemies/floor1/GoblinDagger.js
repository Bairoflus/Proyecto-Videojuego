/**
 * Goblin Dagger enemy class - UPDATED TO V2
 * Melee enemy type that attacks at close range → MAPS TO 'common'
 * Found commonly on floor 1
 */
import { MeleeEnemy } from "../../entities/MeleeEnemy.js";
import { Vec } from "../../../utils/Vec.js";
import { ENEMY_CONSTANTS_V2 } from "../../../constants/gameConstants.js";

export class GoblinDagger extends MeleeEnemy {
  constructor(position) {
    const config = ENEMY_CONSTANTS_V2.GOBLIN_DAGGER;
    
    super(
      position,
      config.size.width,
      config.size.height,
      "red", // color (temporary, will be replaced by sprite)
      4, // sheetCols
      "goblin_dagger", // type
      config.speed,
      config.damage,
      config.health,
      config.attackRange,
      "goblin_dagger" // enemyTypeName → maps to 'common'
    );

    // Set specific properties
    this.attackDuration = config.attackCooldown;
    this.isAttacking = false;
    this.currentDirection = "down";
  }

  updateAnimation() {
    // TODO: Implement goblin dagger specific animations
  }
}
