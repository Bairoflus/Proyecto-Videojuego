/**
 * Mage Goblin enemy class
 * Ranged spellcaster enemy that uses magic bolt projectiles
 * Slower but deals more damage with longer cooldowns
 */
import { RangedEnemy } from "../../entities/RangedEnemy.js";
import { ENEMY_CONSTANTS } from "../../../constants/gameConstants.js";
import { Vec } from "../../../utils/Vec.js";
import { variables } from "../../../config.js";
import { Projectile } from "../../entities/Projectile.js";

export class MageGoblin extends RangedEnemy {
  constructor(position) {
    const config = ENEMY_CONSTANTS.MAGE_GOBLIN;

    super(
      position,
      config.size.width,
      config.size.height,
      "purple", // color (temporary, will be replaced by sprite)
      9, // sheetCols for walk sprites (mage_goblin has same layout as player)
      "mage_goblin", // type
      config.speed,
      config.damage,
      config.health,
      "magic_bolt", // projectile type - mages use magic bolts
      config.attackRange || 150, // range parameter
      config.projectileRange || 250, // projectileRange parameter
      config.projectileSpeed || 250 // projectileSpeed - configurable speed for this enemy type
    );

    // Set specific properties
    this.attackRange = config.attackRange;
    this.attackDuration = config.attackCooldown;
    this.retreatDistance = config.retreatDistance;

    // Animation properties
    this.isCasting = false;
    this.attackCooldown = 0;
    this.currentDirection = "down"; // Default direction
    this.hasCreatedProjectile = false; // Track if projectile was created during cast
    this.currentTarget = null; // Store target for projectile creation

    // Sprite scaling configuration - per animation type
    this.spriteScaling = {
      walk: 1.0, // Mage goblins walk animation at normal size
      spellcast: 1.0, // Spellcast animation at normal size
    };

    // Sprite paths
    this.walkSpritePath =
      "/assets/sprites/enemies/floor1/mage_goblin/walk.png";
    this.spellcastSpritePath =
      "/assets/sprites/enemies/floor1/mage_goblin/spellcast.png";

    // Initialize with walking sprite and proper animation
    this.setSprite(this.walkSpritePath);

    // Set initial walking animation for down direction
    const initialWalkFrames = this.getWalkFrames(this.currentDirection);
    this.setAnimation(initialWalkFrames[0], initialWalkFrames[1], true, 100);
  }

  // Override moveTo for retreat/advance behavior with sprite animation
  moveTo(targetPosition) {
    if (this.state === "dead" || this.isCasting) return;

    // Calculate direction from enemy's hitbox center to target position
    const enemyHitbox = this.getHitboxBounds();
    const enemyCenter = new Vec(
      enemyHitbox.x + enemyHitbox.width / 2,
      enemyHitbox.y + enemyHitbox.height / 2
    );

    const direction = targetPosition.minus(enemyCenter);
    const distance = direction.magnitude();

    const previousState = this.state;
    const previousDirection = this.currentDirection;

    if (distance < this.retreatDistance) {
      // Move away if too close
      this.state = "retreating";
      const retreatDirection = enemyCenter.minus(targetPosition);
      this.velocity = retreatDirection.normalize().times(this.movementSpeed);
      
      // Update direction based on movement
      this.updateDirectionFromMovement();

      const newPosition = this.position.plus(this.velocity);
      this.moveToPosition(newPosition);
    } else if (distance > this.attackRange) {
      // Move closer if too far
      this.state = "chasing";
      this.velocity = direction.normalize().times(this.movementSpeed);
      
      // Update direction based on movement
      this.updateDirectionFromMovement();

      const newPosition = this.position.plus(this.velocity);
      this.moveToPosition(newPosition);
    } else {
      // Stay in range and cast spells
      this.velocity = new Vec(0, 0);
      if (this.state !== "attacking") {
        this.state = "idle"; // Set to idle, will change to attacking when attack() is called
      }
    }

    // Update animation if state or direction changed
    if (
      previousState !== this.state ||
      previousDirection !== this.currentDirection
    ) {
      this.updateAnimation();
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
      }
    }
  }

  attack(target) {
    if (this.state === "dead" || this.isCasting || this.attackCooldown > 0) return;

    // Calculate target hitbox center position
    const targetHitbox = target.getHitboxBounds();
    const targetCenter = new Vec(
      targetHitbox.x + targetHitbox.width / 2,
      targetHitbox.y + targetHitbox.height / 2
    );

    // Calculate direction from mage center to target center for aiming
    const mageHitbox = this.getHitboxBounds();
    const mageCenter = new Vec(
      mageHitbox.x + mageHitbox.width / 2,
      mageHitbox.y + mageHitbox.height / 2
    );

    const aimDirection = targetCenter.minus(mageCenter);
    const distance = aimDirection.magnitude();
    
    if (distance <= this.attackRange) {
      // Set state to attacking
      this.state = "attacking";
      this.isCasting = true;
      this.attackCooldown = this.attackDuration;
      this.velocity = new Vec(0, 0); // Stop moving during casting
      this.hasCreatedProjectile = false; // Reset projectile creation flag

      // Update direction for spellcasting animation
      this.updateDirectionFromAiming(aimDirection);

      // Update animation to spellcast sprite
      this.updateAnimation();

      // Store target for projectile creation at middle frame
      this.currentTarget = target;
    }
  }

  // Update direction based on aiming direction (for spellcasting animation)
  updateDirectionFromAiming(aimDirection) {
    const newDirection =
      Math.abs(aimDirection.y) > Math.abs(aimDirection.x)
        ? aimDirection.y > 0
          ? "down"
          : "up"
        : aimDirection.x > 0
        ? "right"
        : "left";

    this.currentDirection = newDirection;
  }

  // Override fireProjectile to spawn from mage center
  fireProjectile(target) {
    if (this.state === "dead") return;

    // Calculate target hitbox center position
    const targetHitbox = target.getHitboxBounds();
    const targetCenter = new Vec(
      targetHitbox.x + targetHitbox.width / 2,
      targetHitbox.y + targetHitbox.height / 2
    );

    // Calculate mage center position for projectile spawn
    const mageHitbox = this.getHitboxBounds();
    const mageCenter = new Vec(
      mageHitbox.x + mageHitbox.width / 2,
      mageHitbox.y + mageHitbox.height / 2
    );

    const projectile = new Projectile(
      mageCenter,
      targetCenter,
      this.projectileSpeed,
      this.baseDamage, // Use enemy's base damage
      this.projectileType // Use inherited projectile type (magic_bolt)
    );
    
    // Set projectile travel distance limit
    if (this.projectileRange) {
      projectile.setMaxTravelDistance(this.projectileRange);
    }
    
    // Set room reference for wall collision detection
    projectile.setCurrentRoom(this.currentRoom);
    
    this.projectiles.push(projectile);
  }

  // Get spellcast frame ranges based on direction (mage_goblin spellcast.png has 7 columns)
  getSpellcastFrames(direction) {
    const frameRanges = {
      up: [0, 6], // spellcast.png, row 0, 7 frames (0-6)
      left: [7, 13], // spellcast.png, row 1, 7 frames (7-13)
      down: [14, 20], // spellcast.png, row 2, 7 frames (14-20)
      right: [21, 27], // spellcast.png, row 3, 7 frames (21-27)
    };
    return frameRanges[direction] || frameRanges.down;
  }

  // Get walking frame ranges based on direction (mage_goblin walk.png has 9 columns, same as player)
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
    switch (this.state) {
      case "chasing":
      case "retreating":
      case "idle":
        // Use walking animation for movement and idle states
        this.sheetCols = 9; // Walk sprites have 9 columns
        this.setSprite(this.walkSpritePath);

        const walkFrames = this.getWalkFrames(this.currentDirection);
        this.setAnimation(walkFrames[0], walkFrames[1], true, 100);
        break;

      case "attacking":
        // Use spellcast animation for attacking state
        this.sheetCols = 7; // Spellcast sprites have 7 columns
        this.setSprite(this.spellcastSpritePath);

        const spellcastFrames = this.getSpellcastFrames(this.currentDirection);
        this.setAnimation(spellcastFrames[0], spellcastFrames[1], false, 150); // Slower casting animation
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
    }
  }

  // Override update to handle spellcast completion and projectile timing
  update(deltaTime, player) {
    // Call parent update for projectiles and base functionality
    super.update(deltaTime, player);

    // Handle attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }

    // Handle spellcast animation and projectile creation at middle frame
    if (this.isCasting && this.currentTarget) {
      const spellcastFrames = this.getSpellcastFrames(this.currentDirection);
      const minFrame = spellcastFrames[0];
      const maxFrame = spellcastFrames[1];
      const middleFrame = Math.floor((minFrame + maxFrame) / 2);

      // Create projectile at middle frame if not already created
      if (this.frame === middleFrame && !this.hasCreatedProjectile) {
        this.fireProjectile(this.currentTarget);
        this.hasCreatedProjectile = true;
      }

      // Check if spellcast animation is complete
      if (this.frame >= maxFrame) {
        this.isCasting = false;
        this.hasCreatedProjectile = false;
        this.currentTarget = null;

        // Transition back to previous state (will be updated by moveTo next frame)
        this.state = "idle";
        this.updateAnimation();
      }
    }
  }

  // Override draw method to handle sprite scaling for better visibility
  draw(ctx) {
    // Draw projectiles first
    this.projectiles.forEach((projectile) => projectile.draw(ctx));

    if (this.state === "dead") return;

    // Custom sprite rendering with proper per-animation scaling
    if (this.spriteImage && this.spriteRect) {
      // Determine current animation type for scaling
      const animationType = this.state === "attacking" ? "spellcast" : "walk";
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

    // Call parent draw method for health bar and hitbox debugging (skip sprite part)
    if (variables.showHitboxes) {
      const hitbox = this.getHitboxBounds();
      ctx.strokeStyle = "purple";
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
