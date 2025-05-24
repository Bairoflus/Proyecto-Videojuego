/**
 * Goblin Archer enemy class
 * Ranged enemy type that attacks from a distance with projectiles
 * Less common but more dangerous enemy type on floor 1
 */
import { RangedEnemy } from "../../entities/RangedEnemy.js";
import { Projectile } from "../../entities/Projectile.js";
import { variables } from "../../../config.js";
import { Vec } from "../../../utils/Vec.js";
import { Rect } from "../../../utils/Rect.js";

export class GoblinArcher extends RangedEnemy {
  constructor(position) {
    super(
      position,
      32, // width (same as player)
      32, // height (same as player)
      "red", // color (temporary, will be replaced by sprite)
      4, // sheetCols
      "goblin_archer", // type
      0, // movementSpeed (0 to stay static)
      15, // baseDamage
      30 // maxHealth
    );

    // Goblin Archer specific properties
    this.attackRange = 200;
    this.attackDuration = 2000; // 2 seconds between attacks
    this.projectileSpeed = 300;
  }

  moveTo(targetPosition) {
    // Do nothing - stay static
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
      this.fireProjectile(targetCenter);
    }
  }

  fireProjectile(targetCenter) {
    // targetCenter is already a Vec with the hitbox center coordinates

    const projectile = new Projectile(
      this.position,
      targetCenter,
      this.projectileSpeed,
      this.baseDamage
    );
    this.projectiles.push(projectile);
  }

  updateAnimation() {
    // TODO: Implement goblin archer specific animations
  }
}
