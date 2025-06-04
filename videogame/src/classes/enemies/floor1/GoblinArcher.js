/**
 * Goblin Archer enemy class
 * Ranged enemy type that attacks from a distance with projectiles
 * Less common but more dangerous enemy type on floor 1
 */
import { RangedEnemy } from "../../entities/RangedEnemy.js";
import { ENEMY_CONSTANTS } from "../../../constants/gameConstants.js";
import { Vec } from "../../../utils/Vec.js";

export class GoblinArcher extends RangedEnemy {
  constructor(position) {
    const config = ENEMY_CONSTANTS.GOBLIN_ARCHER;
    
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
      "goblin_archer" // enemyTypeName for backend mapping
    );

    // Set specific properties
    this.attackRange = config.attackRange;
    this.attackDuration = config.attackCooldown;
    this.projectileSpeed = config.projectileSpeed;
    this.retreatDistance = config.retreatDistance;
  }

  // Override moveTo for static behavior
  moveTo(targetPosition) {
    // Goblin Archers are static - they don't move
    this.velocity = new Vec(0, 0);
    this.state = "idle";
  }

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
