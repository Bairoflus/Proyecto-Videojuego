/**
 * Projectile class for ranged attacks
 * Handles projectile movement, collision detection with entities and walls,
 * and damage application on impact
 */
import { Vec } from "../../utils/Vec.js";
import { variables } from "../../config.js";
import { log } from "../../utils/Logger.js";
import {
  PHYSICS_CONSTANTS,
  PROJECTILE_TYPES,
} from "../../constants/gameConstants.js";

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

    // Travel distance tracking
    this.initialPosition = new Vec(position.x, position.y); // Store initial position
    this.maxTravelDistance = null; // Will be set by the entity that creates the projectile
    this.traveledDistance = 0; // Track how far the projectile has traveled

    // Reference to current room for wall collision detection
    this.currentRoom = null;

    // Load sprite
    this.spriteImage = new Image();
    this.spriteImage.src = this.config.sprite;
    this.spriteLoaded = false;
    
    this.spriteImage.onload = () => {
      this.spriteLoaded = true;
      console.log(`✓ Projectile sprite loaded: ${this.config.sprite} (${this.type})`);
    };
    
    this.spriteImage.onerror = () => {
      console.error(`✗ Failed to load projectile sprite: ${this.config.sprite} (${this.type})`);
      this.spriteLoaded = false;
    };
  }

  // Set the current room reference for wall collision detection
  setCurrentRoom(room) {
    this.currentRoom = room;
  }

  // Set the maximum travel distance for the projectile
  setMaxTravelDistance(distance) {
    this.maxTravelDistance = distance;
  }

  update(deltaTime, entities) {
    if (!this.isActive) return;

    // Store previous position for collision reversion
    const previousPosition = new Vec(this.position.x, this.position.y);

    // Move projectile
    this.position = this.position.plus(this.velocity.times(deltaTime / 1000));

    // Update traveled distance and check max travel distance
    if (this.initialPosition) {
      this.traveledDistance = this.position
        .minus(this.initialPosition)
        .magnitude();

      // Check if projectile has traveled beyond its maximum range
      if (
        this.maxTravelDistance &&
        this.traveledDistance >= this.maxTravelDistance
      ) {
        this.isActive = false;
        log.verbose(
          `Projectile reached maximum travel distance (${this.maxTravelDistance})`
        );
        return;
      }
    }

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

    // Debug logging (only once per projectile)
    if (!this.debugLogged) {
      console.log(`Drawing projectile: type=${this.type}, spriteLoaded=${this.spriteLoaded}, spriteSrc=${this.config.sprite}`);
      this.debugLogged = true;
    }

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

    // Save the canvas state
    ctx.save();

    // Translate to projectile center
    ctx.translate(this.position.x, this.position.y);

    // Apply the same rotation as the sprite
    ctx.rotate(this.angle);

    // Draw the rotated hitbox
    ctx.strokeStyle = this.config.damageBoxColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(
      -damageBoxWidth / 2,
      -damageBoxHeight / 2,
      damageBoxWidth,
      damageBoxHeight
    );

    // Restore the canvas state
    ctx.restore();
  }

  // Helper method to get projectile bounds for collision detection
  getProjectileBounds() {
    const damageBoxWidth = this.config.damageBoxWidth * this.config.scale;
    const damageBoxHeight = this.config.damageBoxHeight * this.config.scale;

    // For collision detection, we need to calculate the corners of the rotated rectangle
    const halfWidth = damageBoxWidth / 2;
    const halfHeight = damageBoxHeight / 2;

    // Calculate the corners of the rotated rectangle
    const cos = Math.cos(this.angle);
    const sin = Math.sin(this.angle);

    // Calculate the rotated points
    const corners = [
      { x: -halfWidth, y: -halfHeight }, // top-left
      { x: halfWidth, y: -halfHeight }, // top-right
      { x: halfWidth, y: halfHeight }, // bottom-right
      { x: -halfWidth, y: halfHeight }, // bottom-left
    ].map((point) => {
      return {
        x: this.position.x + (point.x * cos - point.y * sin),
        y: this.position.y + (point.x * sin + point.y * cos),
      };
    });

    // Find the bounding box of the rotated rectangle
    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    corners.forEach((corner) => {
      minX = Math.min(minX, corner.x);
      minY = Math.min(minY, corner.y);
      maxX = Math.max(maxX, corner.x);
      maxY = Math.max(maxY, corner.y);
    });

    // Return the bounding box of the rotated rectangle
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      corners: corners, // Save corners for precise collision detection
      angle: this.angle, // Save angle for more advanced collision detection if needed
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
      getHitboxBounds: () => bounds,
    };

    return this.currentRoom.checkWallCollision(tempProjectile);
  }
}
