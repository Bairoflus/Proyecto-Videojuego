/**
 * Goblin Dagger enemy class
 * Melee enemy type that attacks at close range
 * Found commonly on floor 1
 */
import { MeleeEnemy } from "../../entities/MeleeEnemy.js";
import { Vec } from "../../../utils/Vec.js";
import { ENEMY_CONSTANTS } from "../../../constants/gameConstants.js";
import { variables } from "../../../config.js";

export class GoblinDagger extends MeleeEnemy {
  constructor(position) {
    const config = ENEMY_CONSTANTS.GOBLIN_DAGGER;
    
    super(
      position,
      config.size.width,
      config.size.height,
      "red", // color (temporary, will be replaced by sprite)
      9, // sheetCols for walk sprites (dagger_goblin has same layout as player)
      "goblin_dagger", // type
      config.speed,
      config.damage,
      config.health
    );

    // Set specific properties
    this.attackRange = config.attackRange;
    this.attackDuration = config.attackCooldown;
    
    // Animation properties
    this.isAttacking = false;
    this.attackCooldown = 0;
    this.currentDirection = "down"; // Default direction
    
    // Sprite paths
    this.walkSpritePath = "../assets/sprites/enemies/floor1/dagger_goblin/walk.png";
    this.attackSpritePath = "../assets/sprites/enemies/floor1/dagger_goblin/slash.png";
    
    // Initialize with walking sprite and proper animation
    this.setSprite(this.walkSpritePath);
    
    // Set initial walking animation for down direction
    const initialWalkFrames = this.getWalkFrames(this.currentDirection);
    this.setAnimation(initialWalkFrames[0], initialWalkFrames[1], true, 100);
    
    console.log(`GoblinDagger created with ${this.sheetCols} columns, direction: ${this.currentDirection}`);
  }

  // Override moveTo for aggressive chase behavior with sprite animation
  moveTo(targetPosition) {
    if (this.state === "dead") return;

    // Always chase the player aggressively
    const direction = targetPosition.minus(this.position);
    const distance = direction.magnitude();

    if (distance <= this.attackRange && this.attackCooldown <= 0) {
      // Attack if in range and not on cooldown
      this.attack(this.target);
    } else {
      // Chase the player
      const previousState = this.state;
      const previousDirection = this.currentDirection;
      
      this.state = "chasing";
      this.velocity = direction.normalize().times(this.movementSpeed);
      
      // Update direction based on movement
      this.updateDirectionFromMovement();
      
      const newPosition = this.position.plus(this.velocity);
      this.moveToPosition(newPosition);
      
      // Update animation if state or direction changed
      if (previousState !== this.state || previousDirection !== this.currentDirection) {
        this.updateAnimation();
      }
    }
  }

  // Update current direction based on velocity
  updateDirectionFromMovement() {
    const v = this.velocity;
    if (v.x !== 0 || v.y !== 0) {
      const newDirection =
        Math.abs(v.y) > Math.abs(v.x)
          ? v.y > 0 ? "down" : "up"
          : v.x > 0 ? "right" : "left";
      
      if (newDirection !== this.currentDirection) {
        this.currentDirection = newDirection;
        // Only update animation if direction actually changed
        this.updateAnimation();
      }
    }
  }

  // Attack method
  attack(target) {
    if (this.state === "dead" || this.isAttacking) return;

    // Set state to attacking
    this.state = "attacking";
    this.isAttacking = true;
    this.attackCooldown = this.attackDuration;
    this.velocity = new Vec(0, 0); // Stop moving during attack
    
    // Update animation to attack sprite
    this.updateAnimation();
    
    console.log(`Goblin dagger attacking in direction: ${this.currentDirection}`);
  }

  // Get attack frame ranges based on direction (same as player dagger)
  getAttackFrames(direction) {
    const frameRanges = {
      up: [0, 5],      // slash.png, row 0, 6 frames
      left: [6, 11],   // slash.png, row 1, 6 frames  
      down: [12, 17],  // slash.png, row 2, 6 frames
      right: [18, 23], // slash.png, row 3, 6 frames
    };
    return frameRanges[direction] || frameRanges.down;
  }

  // Get walking frame ranges based on direction
  getWalkFrames(direction) {
    const frameRanges = {
      up: [0, 8],      // walk.png, row 0, frames 0-8
      left: [9, 17],   // walk.png, row 1, frames 9-17  
      down: [18, 26],  // walk.png, row 2, frames 18-26
      right: [27, 35], // walk.png, row 3, frames 27-35
    };
    return frameRanges[direction] || frameRanges.down;
  }

  updateAnimation() {
    // Update sprite and animation based on current state
    console.log(`GoblinDagger updateAnimation: state=${this.state}, direction=${this.currentDirection}`);
    
    switch (this.state) {
      case "chasing":
      case "idle":
        // Use walking animation for chasing and idle states
        this.sheetCols = 9; // Walk sprites have 9 columns
        this.setSprite(this.walkSpritePath);
        
        const walkFrames = this.getWalkFrames(this.currentDirection);
        this.setAnimation(walkFrames[0], walkFrames[1], true, 100);
        console.log(`Set walking animation: frames ${walkFrames[0]}-${walkFrames[1]} for direction ${this.currentDirection}`);
        break;
        
      case "attacking":
        // Use attack animation for attacking state
        this.sheetCols = 6; // Attack sprites have 6 columns
        this.setSprite(this.attackSpritePath);
        
        const attackFrames = this.getAttackFrames(this.currentDirection);
        this.setAnimation(attackFrames[0], attackFrames[1], false, 100);
        console.log(`Set attack animation: frames ${attackFrames[0]}-${attackFrames[1]}, repeat=false`);
        break;
        
      case "dead":
        // Keep current sprite when dead (could add death animation later)
        break;
        
      default:
        // Fallback to walking animation
        this.sheetCols = 9;
        this.setSprite(this.walkSpritePath);
        const defaultFrames = this.getWalkFrames(this.currentDirection);
        this.setAnimation(defaultFrames[0], defaultFrames[1], true, 100);
        console.log(`Fallback to walking animation: frames ${defaultFrames[0]}-${defaultFrames[1]}`);
    }
  }

  // Override update to handle attack completion and state transitions
  update(deltaTime) {
    super.update(deltaTime);
    
    // Handle attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }
    
    // Check if attack animation is complete
    if (this.isAttacking && this.frame >= this.maxFrame) {
      this.isAttacking = false;
      
      // Transition back to chasing state (will be updated by moveTo next frame)
      this.state = "chasing";
      this.updateAnimation();
    }
  }

  // Override draw method to handle sprite scaling for better visibility
  draw(ctx) {
    // Custom sprite rendering with scaling for enemies
    if (this.spriteImage && this.spriteRect) {
      // Get scaling factor from enemy constants
      const config = ENEMY_CONSTANTS.GOBLIN_DAGGER;
      const scaleFactor = config.spriteScale || 1.0;

      // Calculate scaled dimensions
      const scaledWidth = this.width * scaleFactor;
      const scaledHeight = this.height * scaleFactor;

      // Center the scaled sprite on the original position
      const offsetX = (scaledWidth - this.width) / 2;
      const offsetY = (scaledHeight - this.height) / 2;

      ctx.drawImage(
        this.spriteImage,
        this.spriteRect.x * this.spriteRect.width,
        this.spriteRect.y * this.spriteRect.height,
        this.spriteRect.width,
        this.spriteRect.height,
        this.position.x - offsetX,
        this.position.y - offsetY,
        scaledWidth,
        scaledHeight
      );
    } else if (this.spriteImage) {
      // Fallback for sprites without spriteRect
      ctx.drawImage(
        this.spriteImage,
        this.position.x,
        this.position.y,
        this.width,
        this.height
      );
    } else {
      // Fallback colored rectangle
      ctx.fillStyle = this.color;
      ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

    // Call parent draw method for health bar and hitbox debugging
    // But skip the sprite drawing part since we handled it above
    if (variables.showHitboxes) {
      const hitbox = this.getHitboxBounds();
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
    }

    // Draw health bar
    const healthBarWidth = this.width;
    const healthBarHeight = 6;
    const healthBarY = this.position.y - healthBarHeight - 4;
    const healthBarX = this.position.x;
    const healthPercentage = this.health / this.maxHealth;

    ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

    // Draw current health (green)
    ctx.fillStyle = "rgba(0, 255, 0, 0.8)";
    ctx.fillRect(
      healthBarX,
      healthBarY,
      healthBarWidth * healthPercentage,
      healthBarHeight
    );

    // Draw border
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
  }
}
