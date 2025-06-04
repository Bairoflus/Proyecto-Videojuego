/**
 * Base class for ranged enemy types
 * Extends Enemy with projectile attack capabilities,
 * retreat behavior, and ranged combat AI
 */
import { Enemy } from "./Enemy.js";
import { Vec } from "../../utils/Vec.js";
import { Projectile } from "./Projectile.js";
import { log } from "../../utils/Logger.js";

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
    maxHealth,
    enemyTypeName = null
  ) {
    super(position, width, height, color, sheetCols, type, movementSpeed, baseDamage, maxHealth, enemyTypeName);
    
    // Ranged enemy specific properties
    this.attackRange = 150; // Default attack range
    this.retreatDistance = 80; // Distance to maintain from target
    this.projectileSpeed = 200; // Default projectile speed

    // Projectiles
    this.projectiles = [];
  }

  // Override moveTo for retreat/advance behavior
  moveTo(targetPosition) {
    if (this.state === "dead") return;

    const direction = targetPosition.minus(this.position);
    const distance = direction.magnitude();

    if (distance < this.retreatDistance) {
      // Move away if too close
      this.state = "retreating";
      const retreatDirection = this.position.minus(targetPosition);
      this.velocity = retreatDirection.normalize().times(this.movementSpeed);
      
      const newPosition = this.position.plus(this.velocity);
      this.moveToPosition(newPosition);
    } else if (distance > this.attackRange) {
      // Move closer if too far
      this.state = "chasing";
      this.velocity = direction.normalize().times(this.movementSpeed);
      
      const newPosition = this.position.plus(this.velocity);
      this.moveToPosition(newPosition);
    } else {
      // Stay in range and attack
      this.state = "attacking";
      this.velocity = new Vec(0, 0);
    }
  }

  update(deltaTime, player) {
    // Update projectiles regardless of enemy state
    this.updateProjectiles(deltaTime, player);

    if (this.state === "dead") return;

    // Call parent update for base functionality
    super.update(deltaTime);
  }

  updateProjectiles(deltaTime, player) {
    this.projectiles = this.projectiles.filter((projectile) => {
      // Ensure projectile has room reference for wall collision
      if (!projectile.currentRoom && this.currentRoom) {
        projectile.setCurrentRoom(this.currentRoom);
      }
      projectile.update(deltaTime, player ? [player] : []);
      return projectile.isActive;
    });
  }

  draw(ctx) {
    // Draw projectiles first
    this.projectiles.forEach((projectile) => projectile.draw(ctx));

    if (this.state === "dead") return;

    // Call parent class draw method for health bar and sprite
    super.draw(ctx);
  }

  fireProjectile(target) {
    if (this.state === "dead") return;

    // Calculate target hitbox center position
    const targetHitbox = target.getHitboxBounds();
    const targetCenter = new Vec(
      targetHitbox.x + targetHitbox.width / 2,
      targetHitbox.y + targetHitbox.height / 2
    );

    const projectile = new Projectile(
      this.position,
      targetCenter,
      this.projectileSpeed,
      this.baseDamage
    );
    
    // Set room reference for wall collision detection
    projectile.setCurrentRoom(this.currentRoom);
    
    this.projectiles.push(projectile);
    
    log.verbose(`${this.type} fired projectile at player`);
  }
}
