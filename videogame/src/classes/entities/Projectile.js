/**
 * Projectile class for ranged attacks
 * Handles projectile movement, collision detection with entities and walls,
 * and damage application on impact
 */
import { Vec } from "../../utils/Vec.js";
import { variables } from "../../config.js";
import { log } from "../../utils/Logger.js";
import { PHYSICS_CONSTANTS, PROJECTILE_TYPES } from "../../constants/gameConstants.js";

export class Projectile {
  constructor(position, target, speed, damage, type = "arrow", radius = null) {
    this.position = position;
    this.speed = speed;
    this.damage = damage;
    this.type = type;

    // Get projectile type configuration
    this.config = PROJECTILE_TYPES[type] || PROJECTILE_TYPES.arrow;
    this.radius = radius !== null ? radius : this.config.radius;

    // Calculate direction to target
    // Handle both Vec objects and objects with position property
    const targetPosition = target instanceof Vec ? target : target.position;
    const direction = targetPosition.minus(position);
    this.velocity = direction.normalize().times(speed);

    // Calculate rotation angle for sprite rendering
    this.angle = Math.atan2(direction.y, direction.x);

    // Projectile state
    this.isActive = true;
    this.hasHit = false;
    
    // Reference to current room for wall collision detection
    this.currentRoom = null;

    // Load sprite
    this.spriteImage = new Image();
    this.spriteImage.src = this.config.sprite;
    this.spriteLoaded = false;
    this.spriteImage.onload = () => {
      this.spriteLoaded = true;
    };
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

    // Draw sprite if loaded, otherwise fallback to circle
    if (this.spriteLoaded && this.spriteImage) {
      // Save canvas state
      ctx.save();

      // Translate to projectile center
      ctx.translate(this.position.x, this.position.y);
      
      // Rotate based on projectile angle
      ctx.rotate(this.angle);

      // Calculate scaled dimensions
      const drawWidth = this.config.width * this.config.scale;
      const drawHeight = this.config.height * this.config.scale;

      // Draw sprite centered
      ctx.drawImage(
        this.spriteImage,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight
      );

      // Restore canvas state
      ctx.restore();

      // Draw damage box if debug mode is enabled
      if (variables.showHitboxes) {
        this.drawDamageBox(ctx);
      }
    } else {
      // Fallback: draw white circle if sprite not loaded
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
      ctx.closePath();

      // Draw damage box if debug mode is enabled
      if (variables.showHitboxes) {
        this.drawDamageBox(ctx);
      }
    }
  }

  // Draw the damage/hitbox visualization
  drawDamageBox(ctx) {
    const damageBoxWidth = this.config.damageBoxWidth * this.config.scale;
    const damageBoxHeight = this.config.damageBoxHeight * this.config.scale;
    
    ctx.strokeStyle = this.config.damageBoxColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(
      this.position.x - damageBoxWidth / 2,
      this.position.y - damageBoxHeight / 2,
      damageBoxWidth,
      damageBoxHeight
    );
  }

  // Helper method to get projectile bounds for collision detection
  getProjectileBounds() {
    const damageBoxWidth = this.config.damageBoxWidth * this.config.scale;
    const damageBoxHeight = this.config.damageBoxHeight * this.config.scale;
    
    return {
      x: this.position.x - damageBoxWidth / 2,
      y: this.position.y - damageBoxHeight / 2,
      width: damageBoxWidth,
      height: damageBoxHeight,
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
    
    // Get projectile bounds for collision detection  
    const bounds = this.getProjectileBounds();
    
    // Create a temporary object representing the projectile for collision detection
    const tempProjectile = {
      position: this.position,
      width: bounds.width,
      height: bounds.height,
      getHitboxBounds: () => bounds
    };
    
    return this.currentRoom.checkWallCollision(tempProjectile);
  }
}
