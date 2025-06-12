/**
 * Mage Goblin enemy class - NEW V2 ENEMY
 * Magical ranged enemy type with magical projectiles → MAPS TO 'rare'
 * Mobile mage that can retreat and attack with magic missiles
 */
import { RangedEnemy } from "../../entities/RangedEnemy.js";
import { Vec } from "../../../utils/Vec.js";
import { ENEMY_CONSTANTS_V2 } from "../../../constants/gameConstants.js";

export class MageGoblin extends RangedEnemy {
  constructor(position) {
    const config = ENEMY_CONSTANTS_V2.MAGE_GOBLIN;

    super(
      position,
      config.size.width,
      config.size.height,
      "purple", // color (purple to indicate magical nature)
      4, // sheetCols
      "mage_goblin", // type
      config.speed,
      config.damage,
      config.health,
      config.attackRange,
      config.projectileSpeed,
      "mage_goblin" // enemyTypeName → maps to 'rare'
    );

    // Set specific properties
    this.attackDuration = config.attackCooldown;
    this.retreatDistance = config.retreatDistance;
    this.projectileType = "magic";
  }

  // Override attack for magical projectiles
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
      console.log(
        `MageGoblin cast magic missile at ${target.type || "player"}`
      );
    }
  }

  // Override fireProjectile to add magical effects
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

    // Create magical projectile with purple color
    const projectile = {
      position: new Vec(startPosition.x, startPosition.y),
      velocity: direction.times(this.projectileSpeed),
      damage: this.baseDamage,
      radius: 6, // Slightly larger for magic
      isActive: true,
      lifetime: 5000,
      timeAlive: 0,
      color: "#9932CC", // Purple magic color
    };

    this.projectiles.push(projectile);
  }

  updateAnimation() {
    // TODO: Implement mage goblin specific animations with magical effects
  }
}
