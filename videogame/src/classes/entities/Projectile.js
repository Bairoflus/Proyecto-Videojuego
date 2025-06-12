/**
 * Projectile class for ranged attacks
 * Handles projectile movement, collision detection with entities and walls,
 * and damage application on impact
 */
import { Vec } from "../../utils/Vec.js";
import { variables } from "../../config.js";
import { log } from "../../utils/Logger.js";
import { PHYSICS_CONSTANTS } from "../../constants/gameConstants.js";

export class Projectile {
  constructor(
    position,
    target,
    speed,
    damage,
    radius = PHYSICS_CONSTANTS.PROJECTILE_RADIUS
  ) {
    this.position = position;
    this.radius = radius;
    this.speed = speed;
    this.damage = damage;
    this.color = "white"; // Default color, can be changed later

    // Calculate direction to target
    // Handle both Vec objects and objects with position property
    const targetPosition = target instanceof Vec ? target : target.position;
    const direction = targetPosition.minus(position);
    this.velocity = direction.normalize().times(speed);

    // Projectile state
    this.isActive = true;
    this.hasHit = false;

    // Reference to current room for wall collision detection
    this.currentRoom = null;
  }

  // Set the current room reference for wall collision detection
  setCurrentRoom(room) {
    this.currentRoom = room;
  }

  update(deltaTime, entities) {
    if (!this.isActive) return;

    // Store previous position for collision reversion
    const previousPosition = new Vec(this.position.x, this.position.y);

    // Move projectile
    this.position = this.position.plus(this.velocity.times(deltaTime / 1000));

    // Check wall collision first (prioritize wall collision over entity collision)
    if (this.currentRoom && this.checkWallCollision()) {
      this.isActive = false;
      log.verbose("Projectile hit wall and was destroyed");
      return;
    }

    // Check collision with all entities
    if (entities) {
      // Convert single entity to array if needed
      const entityArray = Array.isArray(entities) ? entities : [entities];
      entityArray.forEach((entity) => {
        if (this.checkCollision(entity)) {
          this.handleCollision(entity);
        }
      });
    }

    // Check if projectile is out of bounds (using canvas variables)
    if (
      this.position.x < 0 ||
      this.position.x > variables.canvasWidth ||
      this.position.y < 0 ||
      this.position.y > variables.canvasHeight
    ) {
      this.isActive = false;
      log.verbose("Projectile went out of bounds");
    }
  }

  draw(ctx) {
    if (!this.isActive) return;

    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }

  // Helper method to get projectile bounds for collision detection
  getProjectileBounds() {
    return {
      x: this.position.x - this.radius,
      y: this.position.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2,
    };
  }

  // Helper method for rectangle collision detection
  checkRectangleCollision(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  checkCollision(entity) {
    if (!this.isActive || this.hasHit || entity.state === "dead") return false;

    // Use hitbox for collision
    const hitbox = entity.getHitboxBounds
      ? entity.getHitboxBounds()
      : {
          x: entity.position.x,
          y: entity.position.y,
          width: entity.width,
          height: entity.height,
        };

    // Get projectile bounds using helper method
    const projBox = this.getProjectileBounds();
    return this.checkRectangleCollision(projBox, hitbox);
  }

  handleCollision(entity) {
    if (this.hasHit) return;

    this.hasHit = true;
    this.isActive = false;

    // Apply damage to entity
    entity.takeDamage(this.damage);

    // Log successful hit
    log.verbose(`Projectile hit ${entity.type} for ${this.damage} damage`);

    // TODO: Add hit effect/particles here
  }

  // Check collision with walls
  checkWallCollision() {
    if (!this.currentRoom || !this.isActive) return false;

    // Create a temporary object representing the projectile for collision detection
    const tempProjectile = {
      position: this.position,
      width: this.radius * 2,
      height: this.radius * 2,
      getHitboxBounds: () => this.getProjectileBounds(),
    };

    return this.currentRoom.checkWallCollision(tempProjectile);
  }
}
