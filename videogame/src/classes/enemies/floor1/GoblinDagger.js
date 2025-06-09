/**
 * Goblin Dagger enemy class
 * Melee enemy type that attacks at close range
 * Found commonly on floor 1
 */
import { Enemy } from "../../entities/Enemy.js";
import { Vec } from "../../../utils/Vec.js";
import { ENEMY_CONSTANTS } from "../../../constants/gameConstants.js";
import { variables } from "../../../config.js";
import { boxOverlap } from "../../../draw.js";

export class GoblinDagger extends Enemy {
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
      config.health,
      config.attackRange, // detection range
      { width: config.attackRange, height: config.attackRange }, // attack area dimensions
      "goblin" // enemyTypeName for backend mapping
    );

    // Set specific properties
    this.attackDuration = config.attackCooldown;

    // Animation properties
    this.isAttacking = false;
    this.currentDirection = "down"; // Default direction

    // Sprite scaling configuration - per animation type
    this.spriteScaling = {
      walk: 1.0, // Dagger goblins look fine at normal size when walking
      attack: 1.0, // Dagger goblins look fine at normal size when attacking
    };

    // Sprite paths
    this.walkSpritePath =
      "/assets/sprites/enemies/floor1/dagger_goblin/walk.png";
    this.attackSpritePath =
      "/assets/sprites/enemies/floor1/dagger_goblin/slash.png";

    // Initialize with walking sprite and proper animation
    this.setSprite(this.walkSpritePath);

    // Set initial walking animation for down direction
    const initialWalkFrames = this.getWalkFrames(this.currentDirection);
    this.setAnimation(initialWalkFrames[0], initialWalkFrames[1], true, 100);

    // console.log(
    //   `GoblinDagger created with ${this.sheetCols} columns, direction: ${this.currentDirection}`
    // );
  }

  // Override moveTo for aggressive chase behavior with sprite animation
  moveTo(player) {
    if (this.state === "dead") return;

    // Check if hitboxes are overlapping
    if (!boxOverlap(this, player)) {
      // Chase the player until hitboxes overlap
      const previousState = this.state;
      const previousDirection = this.currentDirection;

      this.state = "chasing";

      // Calculate direction from enemy's hitbox center to player's hitbox center
      const enemyHitbox = this.getHitboxBounds();
      const playerHitbox = player.getHitboxBounds();
      const enemyCenter = new Vec(
        enemyHitbox.x + enemyHitbox.width / 2,
        enemyHitbox.y + enemyHitbox.height / 2
      );
      const playerCenter = new Vec(
        playerHitbox.x + playerHitbox.width / 2,
        playerHitbox.y + playerHitbox.height / 2
      );

      const direction = playerCenter.minus(enemyCenter);
      this.velocity = direction.normalize().times(this.movementSpeed);

      // Update direction based on movement
      this.updateDirectionFromMovement();

      const newPosition = this.position.plus(this.velocity);
      this.moveToPosition(newPosition);

      // Update animation if state or direction changed
      if (
        previousState !== this.state ||
        previousDirection !== this.currentDirection
      ) {
        this.updateAnimation();
      }
    } else {
      // Stop moving when hitboxes overlap - ready to attack
      this.velocity = new Vec(0, 0);
      if (this.state !== "attacking") {
        this.state = "attacking"; // Ready to attack when hitboxes overlap
      }
    }
  }

  // Update current direction based on velocity
  updateDirectionFromMovement() {
    const v = this.velocity;
    if (v.x !== 0 || v.y !== 0) {
      const newDirection =
        Math.abs(v.y) > Math.abs(v.x)
          ? v.y > 0
            ? "down"
            : "up"
          : v.x > 0
          ? "right"
          : "left";

      if (newDirection !== this.currentDirection) {
        this.currentDirection = newDirection;
        // Only update animation if direction actually changed
        this.updateAnimation();
      }
    }
  }

  // Attack method - applies damage directly to target
  attack(target) {
    if (this.state === "dead" || this.isAttacking) return;

    // Set state to attacking
    this.state = "attacking";
    this.isAttacking = true;
    this.velocity = new Vec(0, 0); // Stop moving during attack

    // Apply damage directly to target
    target.takeDamage(this.baseDamage);

    // Update animation to attack sprite
    this.updateAnimation();

    // console.log(
    //   `Goblin dagger attacking in direction: ${this.currentDirection}, damage applied: ${this.baseDamage}`
    // );
  }

  // Get attack frame ranges based on direction (same as player dagger)
  getAttackFrames(direction) {
    const frameRanges = {
      up: [0, 5], // slash.png, row 0, 6 frames
      left: [6, 11], // slash.png, row 1, 6 frames
      down: [12, 17], // slash.png, row 2, 6 frames
      right: [18, 23], // slash.png, row 3, 6 frames
    };
    return frameRanges[direction] || frameRanges.down;
  }

  // Get walking frame ranges based on direction
  getWalkFrames(direction) {
    const frameRanges = {
      up: [0, 8], // walk.png, row 0, frames 0-8
      left: [9, 17], // walk.png, row 1, frames 9-17
      down: [18, 26], // walk.png, row 2, frames 18-26
      right: [27, 35], // walk.png, row 3, frames 27-35
    };
    return frameRanges[direction] || frameRanges.down;
  }

  updateAnimation() {
    // Update sprite and animation based on current state
    // console.log(
    //   `GoblinDagger updateAnimation: state=${this.state}, direction=${this.currentDirection}`
    // );

    switch (this.state) {
      case "chasing":
      case "idle":
        // Use walking animation for chasing and idle states
        this.sheetCols = 9; // Walk sprites have 9 columns
        this.setSprite(this.walkSpritePath);

        const walkFrames = this.getWalkFrames(this.currentDirection);
        this.setAnimation(walkFrames[0], walkFrames[1], true, 100);
        // console.log(
        //   `Set walking animation: frames ${walkFrames[0]}-${walkFrames[1]} for direction ${this.currentDirection}`
        // );
        break;

      case "attacking":
        // Use attack animation for attacking state
        this.sheetCols = 6; // Attack sprites have 6 columns
        this.setSprite(this.attackSpritePath);

        const attackFrames = this.getAttackFrames(this.currentDirection);
        this.setAnimation(attackFrames[0], attackFrames[1], false, 100);
        // console.log(
        //   `Set attack animation: frames ${attackFrames[0]}-${attackFrames[1]}, repeat=false`
        // );
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
      // console.log(
      //   `Fallback to walking animation: frames ${defaultFrames[0]}-${defaultFrames[1]}`
      // );
    }
  }

  // Override update to handle attack completion and state transitions
  update(deltaTime) {
    super.update(deltaTime);

    // Check if attack animation is complete
    // Since frame is now properly clamped at maxFrame, check for completion
    if (this.isAttacking && this.frame >= this.maxFrame && this.totalTime >= this.frameDuration) {
      this.isAttacking = false;

      // Transition back to chasing state (will be updated by moveTo next frame)
      this.state = "chasing";
      this.updateAnimation();
    }
  }

  // Override draw method to handle sprite scaling for better visibility
  draw(ctx) {
    // Custom sprite rendering with proper per-animation scaling
    if (this.spriteImage && this.spriteRect) {
      // Determine current animation type for scaling
      const animationType = this.state === "attacking" ? "attack" : "walk";
      const scaleFactor = this.spriteScaling[animationType] || 1.0;

      // Calculate frame dimensions and scaled draw dimensions
      const frameWidth = this.spriteRect.width;
      const frameHeight = this.spriteRect.height;
      const drawWidth = frameWidth * scaleFactor;
      const drawHeight = frameHeight * scaleFactor;

      // Center the sprite on the goblin's position
      const drawX = this.position.x + (this.width - drawWidth) / 2;
      const drawY = this.position.y + (this.height - drawHeight) / 2;

      ctx.drawImage(
        this.spriteImage,
        this.spriteRect.x * this.spriteRect.width, // sx - source x (no scaling)
        this.spriteRect.y * this.spriteRect.height, // sy - source y (no scaling)
        this.spriteRect.width, // sw - source width (no scaling)
        this.spriteRect.height, // sh - source height (no scaling)
        drawX, // dx - destination x (centered)
        drawY, // dy - destination y (centered)
        drawWidth, // dw - destination width (scaled)
        drawHeight // dh - destination height (scaled)
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
