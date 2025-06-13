/**
 * Great Bow Goblin enemy class - NEW V2 ENEMY
 * Elite ranged enemy type with long-range powerful arrows → MAPS TO 'rare'
 * Static sniper with highest damage and range but slow attack speed
 */
import { RangedEnemy } from "../../entities/RangedEnemy.js";
import { Vec } from "../../../utils/Vec.js";
import { ENEMY_CONSTANTS_V2 } from "../../../constants/gameConstants.js";

export class GreatBowGoblin extends RangedEnemy {
  constructor(position) {
    const config = ENEMY_CONSTANTS_V2.GREAT_BOW_GOBLIN;
    
    super(
      position,
      config.size.width,
      config.size.height,
      "darkgreen", // color (dark green to indicate elite nature)
      4, // sheetCols
      "great_bow_goblin", // type
      config.speed, // 0 - completely static
      config.damage,
      config.health,
      config.attackRange,
      config.projectileSpeed,
      "great_bow_goblin" // enemyTypeName → maps to 'rare'
    );

    // Set specific properties
    this.attackDuration = config.attackCooldown;
    this.retreatDistance = config.retreatDistance;
    this.projectileType = "arrow";
  }

  // Override moveTo to remain completely static
  moveTo(targetPosition) {
    // Great Bow Goblins never move - they are elite snipers
    this.velocity = new Vec(0, 0);
    this.state = "idle";
  }

  // Override attack for powerful long-range shots
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
      console.log(`GreatBowGoblin fired powerful arrow at ${target.type || 'player'}`);
    }
  }

  // Override fireProjectile for enhanced arrows
  fireProjectile(target) {
    if (this.state === "dead") return;

    // Calculate target center
    const targetHitbox = target.getHitboxBounds();
    const targetCenter = new Vec(
      targetHitbox.x + targetHitbox.width / 2,
      targetHitbox.y + targetHitbox.height / 2
    );

    // Calculate projectile starting position (center of enemy)
    const startPosition = new Vec(
      this.position.x + this.width / 2,
      this.position.y + this.height / 2
    );

    // Calculate direction vector
    const direction = targetCenter.minus(startPosition).normalize();

    // Create enhanced arrow projectile
    const projectile = {
      position: new Vec(startPosition.x, startPosition.y),
      velocity: direction.times(this.projectileSpeed),
      damage: this.baseDamage,
      radius: 4, // Standard size but high damage
      isActive: true,
      lifetime: 6000, // Longer lifetime for long range
      timeAlive: 0,
      color: "#654321" // Dark brown arrow color
    };

    this.projectiles.push(projectile);
  }

  updateAnimation() {
    // TODO: Implement great bow goblin specific animations with bow drawing
  }
} 