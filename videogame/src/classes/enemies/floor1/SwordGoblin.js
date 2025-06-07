/**
 * Sword Goblin enemy class
 * Stronger melee enemy type that attacks at close range with a sword
 * Slightly slower but deals more damage than Goblin Dagger
 * Found commonly on floor 1
 */
import { MeleeEnemy } from "../../entities/MeleeEnemy.js";
import { Vec } from "../../../utils/Vec.js";
import { Rect } from "../../../utils/Rect.js";
import { ENEMY_CONSTANTS, SPRITE_SCALING_CONSTANTS } from "../../../constants/gameConstants.js";
import { variables } from "../../../config.js";

export class SwordGoblin extends MeleeEnemy {
  constructor(position) {
    const config = ENEMY_CONSTANTS.SWORD_GOBLIN;

    super(
      position,
      config.size.width,
      config.size.height,
      "darkred", // color (temporary, will be replaced by sprite)
      9, // sheetCols for walk sprites (sword_goblin has same layout as other goblins)
      "sword_goblin", // type
      config.speed,
      config.damage,
      config.health,
      config.attackRange, // detection range
      { width: config.attackRange, height: config.attackRange } // attack area dimensions
    );

    // Set specific properties
    this.attackDuration = config.attackCooldown;

    // Animation properties
    this.isAttacking = false;
    this.currentDirection = "down"; // Default direction
    this.attackTarget = null; // Store target for damage application

    // Constant draw dimensions for consistent on-screen size (64×64 like DaggerGoblin)
    this.drawW = SPRITE_SCALING_CONSTANTS.BASE_CHARACTER_SIZE;
    this.drawH = SPRITE_SCALING_CONSTANTS.BASE_CHARACTER_SIZE;

    // Sprite scaling configuration - per animation type
    this.spriteScaling = {
      walk: 1.0, // Sword goblins look fine at normal size when walking
      attack: 1.05, // Very slight scale up to compensate for padding without making goblin too big
    };

    // Sprite paths for sword goblin (using absolute paths)
    this.walkSpritePath =
      "/assets/sprites/enemies/floor1/sword_goblin/walk.png";
    this.attackSpritePath =
      "/assets/sprites/enemies/floor1/sword_goblin/slash.png";

    // Initialize with walking sprite and proper animation (like DaggerGoblin)
    this.setSprite(this.walkSpritePath);

    // Set initial walking animation for down direction
    const initialWalkFrames = this.getWalkFrames(this.currentDirection);
    this.setAnimation(initialWalkFrames[0], initialWalkFrames[1], true, 100);
  }

  // Get attack frame ranges based on direction (6 columns for slash sprite)
  moveTo(targetPosition) {
    if (this.state === "dead") return;

    // Calculate direction from enemy's hitbox center to target position
    const enemyHitbox = this.getHitboxBounds();
    const enemyCenter = new Vec(
      enemyHitbox.x + enemyHitbox.width / 2,
      enemyHitbox.y + enemyHitbox.height / 2
    );

    // Always chase the player aggressively
    const direction = targetPosition.minus(enemyCenter);
    const distance = direction.magnitude();

    // Just move toward the target - attack will be called separately by Room.js
    if (distance > this.attackRange) {
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
      if (
        previousState !== this.state ||
        previousDirection !== this.currentDirection
      ) {
        this.updateAnimation();
      }
    } else {
      // Stop moving when in attack range - actual attack will be handled by Room.js
      this.velocity = new Vec(0, 0);
      if (this.state !== "attacking") {
        this.state = "idle"; // Set to idle, will change to attacking when attack() is called
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

  // Attack method - now uses shared parent attack system
  attack(target) {
    if (this.state === "dead" || this.isAttacking) return;

    // Set state to attacking
    this.state = "attacking";
    this.isAttacking = true;
    this.velocity = new Vec(0, 0); // Stop moving during attack
    this.attackTarget = target; // Store target for damage application

    // Update animation to attack sprite
    this.updateAnimation();
  }

  // Get proper frame range based on direction and current sprite layout
  getFrameRange(direction, layoutCols) {
    const directionMap = {
      up: 0,
      left: 1,
      down: 2,
      right: 3
    };
    
    const row = directionMap[direction] || 2; // Default to down
    const startFrame = row * layoutCols;
    const endFrame = startFrame + layoutCols - 1;
    
    return [startFrame, endFrame];
  }

  // Get attack frame ranges based on direction (6 columns for slash sprite)
  getAttackFrames(direction) {
    return this.getFrameRange(direction, 6);
  }

  // Get walk frame ranges based on direction (9 columns for walk sprite)
  getWalkFrames(direction) {
    return this.getFrameRange(direction, 9);
  }

  // Update sprite sheet dimensions and force recalculation
  updateSpriteSheet(newSheetCols, spritePath) {
    console.log(`[SwordGoblin] Updating sprite sheet: ${newSheetCols} cols, path: ${spritePath}`);
    
    // Update sheet columns first (critical for proper frame calculations)
    this.sheetCols = newSheetCols;
    
    // Set the new sprite which will trigger dimension recalculation
    this.setSprite(spritePath);
    
    // Force recalculation of frame dimensions based on new sheet layout
    if (this.spriteImage) {
      this.frameW = this.spriteImage.width / this.sheetCols;
      this.frameH = this.spriteImage.height / 4; // 4 rows for all our sprites
      console.log(`[SwordGoblin] Frame dimensions: ${this.frameW}x${this.frameH}, Draw size: ${this.drawW}x${this.drawH}`);
    }
  }

  // Update animation based on current state with proper sprite sheet dimension handling
  updateAnimation() {
    switch (this.state) {
      case "chasing":
      case "idle":
        // Use walking animation for chasing and idle states
        this.updateSpriteSheet(9, this.walkSpritePath); // Walk sprites: 9×4 layout

        const walkFrames = this.getWalkFrames(this.currentDirection);
        this.setAnimation(walkFrames[0], walkFrames[1], true, 100);
        break;

      case "attacking":
        // Use attack animation for attacking state
        this.updateSpriteSheet(6, this.attackSpritePath); // Attack sprites: 6×4 layout

        const attackFrames = this.getAttackFrames(this.currentDirection);
        this.setAnimation(attackFrames[0], attackFrames[1], false, 100);
        break;

      case "dead":
        // Keep current sprite when dead (could add death animation later)
        break;

      default:
        // Fallback to walking animation
        this.updateSpriteSheet(9, this.walkSpritePath);
        const defaultFrames = this.getWalkFrames(this.currentDirection);
        this.setAnimation(defaultFrames[0], defaultFrames[1], true, 100);
    }
  }

  // Override update to handle attack completion and state transitions with proper damage timing
  update(deltaTime, player) {
    super.update(deltaTime, player);

    // Handle damage application during attack animation using shared system
    if (this.isAttacking && this.attackTarget && !this.hasAppliedDamage) {
      // Apply damage at the middle of the attack animation (around frame 3 for 6-frame attack)
      const middleFrame = Math.floor(this.maxFrame / 2);
      if (this.frame >= middleFrame) {
        // Use shared attack system from parent class
        this.applyAttackDamage(this.attackTarget);
      }
    }

    // Check if attack animation is complete
    if (this.isAttacking && this.frame >= this.maxFrame) {
      this.isAttacking = false;
      this.attackTarget = null;

      // Transition back to chasing state (will be updated by moveTo next frame)
      this.state = "chasing";
      this.updateAnimation();
    }
  }

  // Override draw method to handle sprite scaling for better visibility
  draw(ctx) {
    if (this.state === "dead") return;

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

    // Draw hitbox if debugging is enabled
    if (variables.showHitboxes) {
      const hitbox = this.getHitboxBounds();
      ctx.strokeStyle = "darkred";
      ctx.lineWidth = 2;
      ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
    }

    // Draw attack area for debugging
    this.drawAttackArea(ctx);

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
