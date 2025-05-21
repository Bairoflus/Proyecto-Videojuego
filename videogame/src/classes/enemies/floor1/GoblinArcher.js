import { RangedEnemy } from "../RangedEnemy.js";

export class GoblinArcher extends RangedEnemy {
  constructor(position) {
    super(
      position,
      64, // width
      64, // height
      "green", // color
      4, // sheetCols
      "goblin_archer", // type
      30, // movementSpeed
      15, // baseDamage
      30 // maxHealth
    );

    // Goblin Archer specific properties
    this.attackRange = 200;
    this.attackDuration = 2000; // 2 seconds between attacks
    this.projectileSpeed = 300;
  }

  attack(target) {
    if (this.state === "dead" || this.attackCooldown > 0) return;

    const distance = target.position.minus(this.position).length();
    if (distance <= this.attackRange) {
      this.isAttacking = true;
      this.attackCooldown = this.attackDuration;
      this.fireProjectile(target);
    }
  }

  fireProjectile(target) {
    // TODO: Create and fire arrow projectile
    target.takeDamage(this.baseDamage);
  }

  updateAnimation() {
    // TODO: Implement goblin archer specific animations
  }
}
