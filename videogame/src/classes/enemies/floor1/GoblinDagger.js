import { MeleeEnemy } from "../../MeleeEnemy.js";
import { Vec } from "../../Vec.js";
import { variables } from "../../../config.js";

export class GoblinDagger extends MeleeEnemy {
  constructor(position) {
    super(
      position,
      32, // width (same as player)
      32, // height (same as player)
      "red", // color (temporary, will be replaced by sprite)
      4, // sheetCols
      "goblin_dagger", // type
      variables.playerSpeed * 5, // movementSpeed (x5 to account for normalization)
      10, // baseDamage
      20 // maxHealth
    );

    // Goblin Dagger specific properties
    this.attackRange = 32; // Attack when touching the player
    this.attackDuration = 1000; // 1 second between attacks
  }

  moveTo(targetPosition) {
    if (this.state === "dead") return;

    const direction = targetPosition.minus(this.position);
    const distance = direction.magnitude();

    // Always chase the player
    this.state = "chasing";
    this.velocity = direction.normalize().times(this.movementSpeed);
    this.position = this.position.plus(this.velocity);

    // Attack if in range
    if (distance <= this.attackRange) {
      this.attack(this.target);
    }
  }

  attack(target) {
    if (this.state === "dead" || this.attackCooldown > 0) return;

    const distance = target.position.minus(this.position).magnitude();
    if (distance <= this.attackRange) {
      this.isAttacking = true;
      this.attackCooldown = this.attackDuration;
      target.takeDamage(this.baseDamage);
    }
  }

  updateAnimation() {
    // TODO: Implement goblin dagger specific animations
  }
}
