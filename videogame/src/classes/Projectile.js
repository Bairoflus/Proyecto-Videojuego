import { Vec } from "./Vec.js";
import { variables } from "../config.js";

export class Projectile {
  constructor(position, target, speed, damage, radius = 5) {
    this.position = position;
    this.radius = radius;
    this.speed = speed;
    this.damage = damage;

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
      console.log("Projectile hit wall and was destroyed");
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
      console.log("Projectile went out of bounds");
    }
  }

  draw(ctx) {
    if (!this.isActive) return;

    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.closePath();
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
    // Treat projectile as a small box for collision
    const projBox = {
      x: this.position.x - this.radius,
      y: this.position.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2,
    };
    return (
      projBox.x < hitbox.x + hitbox.width &&
      projBox.x + projBox.width > hitbox.x &&
      projBox.y < hitbox.y + hitbox.height &&
      projBox.y + projBox.height > hitbox.y
    );
  }

  handleCollision(entity) {
    if (this.hasHit) return;

    this.hasHit = true;
    this.isActive = false;

    // Apply damage to entity
    entity.takeDamage(this.damage);
    
    // Log successful hit
    console.log(`Projectile hit ${entity.type} for ${this.damage} damage`);

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
      getHitboxBounds: () => {
        return {
          x: this.position.x - this.radius,
          y: this.position.y - this.radius,
          width: this.radius * 2,
          height: this.radius * 2
        };
      }
    };
    
    return this.currentRoom.checkWallCollision(tempProjectile);
  }
}
