import { Enemy } from "./Enemy.js";
import { Vec } from "./Vec.js";
import { Projectile } from "./Projectile.js";

export class RangedEnemy extends Enemy {
  constructor(
    position,
    width,
    height,
    color,
    sheetCols,
    type,
    movementSpeed,
    baseDamage,
    maxHealth
  ) {
    super(position, width, height, color, "enemy", sheetCols);

    // Core stats
    this.maxHealth = maxHealth;
    this.health = this.maxHealth;
    this.movementSpeed = movementSpeed;
    this.baseDamage = baseDamage;
    this.type = type;

    // State
    this.state = "idle"; // idle, chasing, attacking, dead
    this.target = null;
    this.velocity = new Vec(0, 0);
    this.currentDirection = "down";
    this.isAttacking = false;
    this.attackCooldown = 0;

    // Projectiles
    this.projectiles = [];
  }

  moveTo(targetPosition) {
    if (this.state === "dead") return;

    const direction = targetPosition.minus(this.position);
    const distance = direction.magnitude();

    if (distance < this.retreatDistance) {
      // Move away if too close
      this.state = "retreating";
      const retreatDirection = this.position.minus(targetPosition);
      this.velocity = retreatDirection.normalize().times(this.movementSpeed);
      this.position = this.position.plus(this.velocity);
    } else if (distance > this.attackRange) {
      // Move closer if too far
      this.state = "chasing";
      this.velocity = direction.normalize().times(this.movementSpeed);
      this.position = this.position.plus(this.velocity);
    } else {
      // Stay in range and attack
      this.state = "attacking";
      this.velocity = new Vec(0, 0);
    }
  }

  update(deltaTime, player) {
    if (this.state === "dead") {
      // Keep updating existing projectiles even when dead
      this.projectiles = this.projectiles.filter((projectile) => {
        projectile.update(deltaTime, [player]);
        return projectile.isActive;
      });
      return;
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }

    // Update projectiles
    this.projectiles = this.projectiles.filter((projectile) => {
      projectile.update(deltaTime, [player]); // Wrap player in array
      return projectile.isActive;
    });

    this.updateAnimation();
    this.constrainToCanvas();
  }

  draw(ctx) {
    // Always draw projectiles, even if enemy is dead
    this.projectiles.forEach((projectile) => projectile.draw(ctx));

    if (this.state === "dead") return;

    // Draw enemy as red rectangle
    ctx.fillStyle = "red";
    ctx.fillRect(
      this.position.x - this.width / 2,
      this.position.y - this.height / 2,
      this.width,
      this.height
    );
  }

  fireProjectile(target) {
    if (this.state === "dead") return;

    const projectile = new Projectile(
      this.position,
      target,
      this.projectileSpeed,
      this.baseDamage
    );
    this.projectiles.push(projectile);
  }

  updateAnimation() {
    // To be implemented by specific enemy types
  }
}
