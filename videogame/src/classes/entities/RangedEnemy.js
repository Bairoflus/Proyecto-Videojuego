/**
 * Base class for ranged enemy types
 * Extends Enemy with projectile attack capabilities and retreat behavior
 */
import { Enemy } from "./Enemy.js";
import { Vec } from "../../utils/Vec.js";

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
    attackRange = 150,
    projectileSpeed = 200,
    enemyTypeName = null
  ) {
    super(
      position,
      width,
      height,
      color,
      sheetCols,
      type,
      movementSpeed,
      baseDamage,
      maxHealth,
      enemyTypeName
    );

    this.attackRange = attackRange;
    this.retreatDistance = Math.max(attackRange * 0.5, 80);
    this.projectileSpeed = projectileSpeed;
    this.projectileType = "arrow";
    
    // Initialize projectile system
    this.initializeProjectiles();
  }

  moveTo(targetPosition) {
    if (this.state === "dead") return;

    const direction = targetPosition.minus(this.position);
    const distance = direction.magnitude();

    if (distance < this.retreatDistance) {
      // Too close - retreat
      this.state = "retreating";
      const retreatDirection = this.position.minus(targetPosition);
      this.velocity = retreatDirection.normalize().times(this.movementSpeed);
      const newPosition = this.position.plus(this.velocity);
      this.moveToPosition(newPosition);
    } else if (distance > this.attackRange) {
      // Too far - move closer
      this.state = "chasing";
      this.velocity = direction.normalize().times(this.movementSpeed);
      const newPosition = this.position.plus(this.velocity);
      this.moveToPosition(newPosition);
    } else {
      // In perfect range - stop and attack
      this.state = "attacking";
      this.velocity = new Vec(0, 0);
    }
  }

  update(deltaTime, player) {
    // Update projectiles first
    this.updateProjectiles(deltaTime, player);
    
    if (this.state === "dead") return;
    
    // Call parent update
    super.update(deltaTime);
  }

  draw(ctx) {
    // Draw projectiles first (behind enemy)
    this.projectiles.forEach((projectile) => {
      if (projectile.isActive) {
        ctx.fillStyle = projectile.color;
        ctx.beginPath();
        ctx.arc(projectile.position.x, projectile.position.y, projectile.radius, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
    
    if (this.state === "dead") return;
    
    // Draw enemy
    super.draw(ctx);
  }

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

    // Create projectile object
    const projectile = {
      position: new Vec(startPosition.x, startPosition.y),
      velocity: direction.times(this.projectileSpeed),
      damage: this.baseDamage,
      radius: 5,
      isActive: true,
      lifetime: 5000,
      timeAlive: 0,
      color: this.getProjectileColor(this.projectileType)
    };

    this.projectiles.push(projectile);
  }

  getProjectileColor(type) {
    const colors = {
      arrow: "#8B4513",     // Brown
      magic: "#9932CC",     // Purple
      fire: "#FF4500",      // Red-orange
      ice: "#00BFFF"        // Blue
    };
    return colors[type] || colors.arrow;
  }

  updateProjectiles(deltaTime, player) {
    if (!this.projectiles) return;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      
      if (!projectile.isActive) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Update position
      projectile.position = projectile.position.plus(
        projectile.velocity.times(deltaTime / 1000)
      );

      // Update lifetime
      projectile.timeAlive += deltaTime;
      if (projectile.timeAlive >= projectile.lifetime) {
        projectile.isActive = false;
        continue;
      }

      // Check canvas bounds
      if (
        projectile.position.x < 0 ||
        projectile.position.x > window.variables?.canvasWidth ||
        projectile.position.y < 0 ||
        projectile.position.y > window.variables?.canvasHeight
      ) {
        projectile.isActive = false;
        continue;
      }

      // Check wall collision
      if (this.currentRoom && this.checkProjectileWallCollision(projectile)) {
        projectile.isActive = false;
        continue;
      }

      // Check player collision
      if (player && player.health > 0 && this.checkProjectilePlayerCollision(projectile, player)) {
        player.takeDamage(projectile.damage);
        projectile.isActive = false;
      }
    }

    // Clean up inactive projectiles
    this.projectiles = this.projectiles.filter(p => p.isActive);
  }

  checkProjectileWallCollision(projectile) {
    const tempProjectile = {
      position: projectile.position,
      width: projectile.radius * 2,
      height: projectile.radius * 2,
      getHitboxBounds: () => ({
        x: projectile.position.x - projectile.radius,
        y: projectile.position.y - projectile.radius,
        width: projectile.radius * 2,
        height: projectile.radius * 2
      })
    };

    return this.currentRoom.checkWallCollision(tempProjectile);
  }

  checkProjectilePlayerCollision(projectile, player) {
    const playerHitbox = player.getHitboxBounds();
    const projectileHitbox = {
      x: projectile.position.x - projectile.radius,
      y: projectile.position.y - projectile.radius,
      width: projectile.radius * 2,
      height: projectile.radius * 2
    };

    return (
      projectileHitbox.x < playerHitbox.x + playerHitbox.width &&
      projectileHitbox.x + projectileHitbox.width > playerHitbox.x &&
      projectileHitbox.y < playerHitbox.y + playerHitbox.height &&
      projectileHitbox.y + projectileHitbox.height > playerHitbox.y
    );
  }
} 