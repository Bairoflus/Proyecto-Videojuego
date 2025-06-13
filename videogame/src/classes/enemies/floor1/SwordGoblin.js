/**
 * Sword Goblin enemy class - NEW V2 ENEMY
 * Enhanced melee enemy type with higher damage and health → MAPS TO 'common'
 * Slower but more dangerous than standard GoblinDagger
 */
import { MeleeEnemy } from "../../entities/MeleeEnemy.js";
import { Vec } from "../../../utils/Vec.js";
import { ENEMY_CONSTANTS_V2 } from "../../../constants/gameConstants.js";

export class SwordGoblin extends MeleeEnemy {
  constructor(position) {
    const config = ENEMY_CONSTANTS_V2.SWORD_GOBLIN;
    
    super(
      position,
      config.size.width,
      config.size.height,
      "darkred", // color (darker red to distinguish from GoblinDagger)
      4, // sheetCols
      "sword_goblin", // type
      config.speed,
      config.damage,
      config.health,
      config.attackRange,
      "sword_goblin" // enemyTypeName → maps to 'common'
    );

    // Set specific properties
    this.attackDuration = config.attackCooldown;
    this.isAttacking = false;
    this.currentDirection = "down";
  }

  // Override attack for heavy melee strikes
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
      target.takeDamage(this.baseDamage);
      console.log(`SwordGoblin dealt ${this.baseDamage} damage to ${target.type || 'player'}`);
    }
  }

  updateAnimation() {
    // TODO: Implement sword goblin specific animations
  }
} 