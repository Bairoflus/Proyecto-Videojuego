/**
 * SlingshotSniper enemy class - Floor 2
 * Ranged enemy type with infinite vision range → MAPS TO 'rare'
 * Brown colored rectangle, static position, super fast bullets, 3s cooldown
 */
import { RangedEnemy } from "../../entities/RangedEnemy.js";
import { ENEMY_CONSTANTS_V2 } from "../../../constants/gameConstants.js";
import { Vec } from "../../../utils/Vec.js";

export class SlingshotSniper extends RangedEnemy {
  constructor(position) {
    const config = ENEMY_CONSTANTS_V2.SLINGSHOT_SNIPER;
    
    super(
      position,
      config.size.width,
      config.size.height,
      "brown", // Brown colored rectangle
      4, // sheetCols
      "slingshot_sniper", // type
      config.speed,
      config.damage,
      config.health,
      config.attackRange,
      config.projectileSpeed,
      "slingshot_sniper" // enemyTypeName → maps to 'rare'
    );

    // Set specific properties
    this.attackDuration = config.attackCooldown;
    this.retreatDistance = config.retreatDistance;
    this.projectileType = "stone";
  }

  // Override attack to ensure proper projectile firing
  attack(target) {
    if (this.state === "dead" || this.attackCooldown > 0) return;

    // Calculate target hitbox center position
    const targetHitbox = target.getHitboxBounds();
    const targetCenter = new Vec(
      targetHitbox.x + targetHitbox.width / 2,
      targetHitbox.y + targetHitbox.height / 2
    );

    const distance = targetCenter.minus(this.position).magnitude();
    if (distance <= this.attackRange) {
      this.isAttacking = true;
      this.attackCooldown = this.attackDuration;
      this.fireProjectile(target);
    }
  }

  updateAnimation() {
    // TODO: Implement slingshot sniper specific animations
  }
}
