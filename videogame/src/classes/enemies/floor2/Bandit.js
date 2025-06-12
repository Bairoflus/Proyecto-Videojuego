/**
 * Bandit enemy class - Floor 2
 * Melee enemy type that attacks at close range → MAPS TO 'common'
 * Grey colored rectangle, attacks every 1 second
 */
import { MeleeEnemy } from "../../entities/MeleeEnemy.js";
import { Vec } from "../../../utils/Vec.js";
import { ENEMY_CONSTANTS_V2 } from "../../../constants/gameConstants.js";

export class Bandit extends MeleeEnemy {
  constructor(position) {
    const config = ENEMY_CONSTANTS_V2.BANDIT;
    
    super(
      position,
      config.size.width,
      config.size.height,
      "grey", // Grey colored rectangle
      4, // sheetCols
      "bandit", // type
      config.speed,
      config.damage,
      config.health,
      config.attackRange,
      "bandit" // enemyTypeName → maps to 'common'
    );

    // Set specific properties
    this.attackDuration = config.attackCooldown;
    this.isAttacking = false;
    this.currentDirection = "down";
  }

  updateAnimation() {
    // TODO: Implement bandit specific animations
  }
}
