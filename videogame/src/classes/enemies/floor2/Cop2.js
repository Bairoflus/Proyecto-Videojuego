/**
 * Cop2 enemy class - Floor 2
 * Ranged enemy with burst fire capability → MAPS TO 'rare'
 * Dark blue colored rectangle, slower bullets, burst of 10, vision range 100, moves faster than Cop1
 */
import { RangedEnemy } from "../../entities/RangedEnemy.js";
import { ENEMY_CONSTANTS_V2 } from "../../../constants/gameConstants.js";
import { Vec } from "../../../utils/Vec.js";

export class Cop2 extends RangedEnemy {
  constructor(position) {
    const config = ENEMY_CONSTANTS_V2.COP2;
    
    super(
      position,
      config.size.width,
      config.size.height,
      "darkblue", // Dark blue colored rectangle
      4, // sheetCols
      "cop2", // type
      config.speed,
      config.damage,
      config.health,
      config.attackRange,
      config.projectileSpeed,
      "cop2" // enemyTypeName → maps to 'rare'
    );

    // Set specific properties
    this.attackDuration = config.attackCooldown;
    this.retreatDistance = config.retreatDistance;
    this.projectileType = "bullet";
    
    // Burst fire properties
    this.burstCount = config.burstCount;
    this.burstDelay = config.burstDelay;
    this.isBursting = false;
    this.burstShotsFired = 0;
    this.burstTimer = 0;
    this.burstTarget = null;
  }

  // Override attack to implement burst fire
  attack(target) {
    if (this.state === "dead" || this.attackCooldown > 0 || this.isBursting) return;

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
      this.startBurstFire(target);
    }
  }

  startBurstFire(target) {
    this.isBursting = true;
    this.burstShotsFired = 0;
    this.burstTimer = 0;
    this.burstTarget = target;
  }

  update(deltaTime, player) {
    super.update(deltaTime, player);

    // Handle burst fire
    if (this.isBursting && this.burstTarget) {
      this.burstTimer += deltaTime;
      
      if (this.burstTimer >= this.burstDelay && this.burstShotsFired < this.burstCount) {
        this.fireProjectile(this.burstTarget);
        this.burstShotsFired++;
        this.burstTimer = 0;
        
        if (this.burstShotsFired >= this.burstCount) {
          this.isBursting = false;
          this.burstTarget = null;
          this.isAttacking = false;
        }
      }
    }
  }

  updateAnimation() {
    // TODO: Implement cop2 specific animations
  }
}
