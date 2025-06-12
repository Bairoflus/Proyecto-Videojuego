/**
 * Goblin Archer enemy class - UPDATED TO V2
 * Ranged enemy type that attacks from a distance with projectiles → MAPS TO 'rare'
 * Less common but more dangerous enemy type on floor 1
 */
import { RangedEnemy } from "../../entities/RangedEnemy.js";
import { ENEMY_CONSTANTS_V2 } from "../../../constants/gameConstants.js";
import { Vec } from "../../../utils/Vec.js";

export class GoblinArcher extends RangedEnemy {
  constructor(position) {
    const config = ENEMY_CONSTANTS_V2.GOBLIN_ARCHER;

    super(
      position,
      config.size.width,
      config.size.height,
      "red", // color (temporary, will be replaced by sprite)
      4, // sheetCols
      "goblin_archer", // type
      config.speed,
      config.damage,
      config.health,
      config.attackRange,
      config.projectileSpeed,
      "goblin_archer" // enemyTypeName → maps to 'rare'
    );

    // Set specific properties
    this.attackDuration = config.attackCooldown;
    this.retreatDistance = config.retreatDistance;
    this.projectileType = "arrow";
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
    // TODO: Implement goblin archer specific animations
  }
}
