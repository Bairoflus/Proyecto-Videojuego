import { MeleeEnemy } from "../MeleeEnemy.js";

export class GoblinDagger extends MeleeEnemy {
  constructor(position) {
    super(
      position,
      64, // width
      64, // height
      "green", // color
      4, // sheetCols
      "goblin_dagger", // type
      50, // movementSpeed
      20, // baseDamage
      40 // maxHealth
    );

    // Goblin Dagger specific properties
    this.attackRange = 40;
    this.attackDuration = 1000; // 1 second between attacks
    this.bleedChance = 0.2;
  }

  attack(target) {
    if (this.state === "dead" || this.attackCooldown > 0) return;

    const distance = target.position.minus(this.position).length();
    if (distance <= this.attackRange) {
      this.isAttacking = true;
      this.attackCooldown = this.attackDuration;

      // Apply damage
      target.takeDamage(this.baseDamage);

      // Apply bleed effect
      if (Math.random() < this.bleedChance) {
        // TODO: Apply bleed effect
      }
    }
  }

  updateAnimation() {
    // TODO: Implement goblin dagger specific animations
  }
}
