/**
 * Player character class
 * Handles player movement, combat, dash mechanics, weapon switching,
 * health management, and input processing
 */
import { AnimatedObject } from "./AnimatedObject.js";
import { Vec } from "../../utils/Vec.js";
import { Rect } from "../../utils/Rect.js";
import { Projectile } from "./Projectile.js";
import {
  variables,
  playerMovement,
  playerAttack,
  getAttackFrames,
} from "../../config.js";
import { log } from "../../utils/Logger.js";
import {
  PLAYER_CONSTANTS,
  PHYSICS_CONSTANTS,
} from "../../constants/gameConstants.js";

// Constants for Player class
const DASH_STAMINA_COST = PLAYER_CONSTANTS.DAGGER_STAMINA_COST; // Reuse for dash
const RAYCAST_STEP_SIZE = PLAYER_CONSTANTS.RAYCAST_STEP_SIZE;
const DAGGER_ATTACK_RANGE = PLAYER_CONSTANTS.DAGGER_ATTACK_RANGE;
const DAGGER_ATTACK_WIDTH = PLAYER_CONSTANTS.DAGGER_ATTACK_WIDTH;
const DAGGER_ATTACK_DAMAGE = PLAYER_CONSTANTS.DAGGER_ATTACK_DAMAGE;

export class Player extends AnimatedObject {
  constructor(position, width, height, color, sheetCols = 13) {
    super(position, width, height, color, "player", sheetCols);

    // Movement properties
    this.velocity = new Vec(0, 0);
    this.keys = [];
    this.previousDirection = "down";
    this.currentDirection = "down";

    // Dash properties
    this.dashDuration = PLAYER_CONSTANTS.DASH_DURATION;
    this.dashSpeed = variables.playerSpeed * PLAYER_CONSTANTS.DASH_MULTIPLIER;
    this.dashTime = 0;
    this.dashCooldown = 0;
    this.dashCooldownTime = 0;
    this.dashDirection = new Vec(0, 0);

    // Combat properties
    this.weaponType = "dagger";
    this.isAttacking = false;
    this.attackCooldown = 0;
    this.projectiles = [];
    this.hasCreatedProjectile = false;
    this.hasAppliedMeleeDamage = false;

    // Player stats
    this.health = PLAYER_CONSTANTS.MAX_HEALTH;
    this.maxHealth = PLAYER_CONSTANTS.MAX_HEALTH;
    this.stamina = PLAYER_CONSTANTS.MAX_STAMINA;
    this.maxStamina = PLAYER_CONSTANTS.MAX_STAMINA;
    this.staminaRegenRate = PLAYER_CONSTANTS.STAMINA_REGEN_RATE;
    this.staminaRegenDelay = PLAYER_CONSTANTS.STAMINA_REGEN_DELAY;
    this.staminaRegenCooldown = 0;

    // Gold and shop system
    this.gold = 0;
    this.meleeDamageBonus = 0;
    this.rangedDamageBonus = 0;

    // Invulnerability
    this.isInvulnerable = false;
    this.invulnerabilityDuration = PLAYER_CONSTANTS.INVULNERABILITY_DURATION;
    this.invulnerabilityTimer = 0;

    // Hitbox configuration
    this.hitbox = {
      width: width * PHYSICS_CONSTANTS.PLAYER_HITBOX_SCALE,
      height: height * PHYSICS_CONSTANTS.PLAYER_HITBOX_SCALE,
      offsetX: width * PHYSICS_CONSTANTS.PLAYER_HITBOX_OFFSET_X,
      offsetY: height * PHYSICS_CONSTANTS.PLAYER_HITBOX_OFFSET_Y,
    };
  }

  setCurrentRoom(room) {
    this.currentRoom = room;

    // Clear any active projectiles when changing rooms to prevent cross-room damage
    if (this.projectiles.length > 0) {
      console.log(
        `Clearing ${this.projectiles.length} active projectiles during room transition`
      );
      this.projectiles = [];
    }
  }

  takeDamage(amount) {
    if (this.isInvulnerable) return;

    this.health = Math.max(0, this.health - amount);
    this.isInvulnerable = true;
    this.invulnerabilityTimer = this.invulnerabilityDuration;

    // Log player health after taking damage
    console.log("Player health:", this.health);

    // TODO: Add damage feedback (screen flash, sound, etc.)

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    console.log("Player died! Initiating game reset...");

    // Trigger complete game reset through the global game instance
    if (window.game && typeof window.game.resetGameAfterDeath === "function") {
      // Small delay to show death state before reset
      setTimeout(() => {
        window.game.resetGameAfterDeath();
      }, 1000); // 1 second delay
    } else {
      console.error("Cannot reset game: Game instance not found");
    }
  }

  /**
   * Adds gold to player's total
   * @param {number} amount - Amount of gold to add
   * @returns {number} New gold total
   */
  addGold(amount) {
    if (amount > 0) {
      this.gold += amount;
      log.info(`Player collected ${amount} gold. Total: ${this.gold}`);
    }
    return this.gold;
  }

  /**
   * Gets current gold amount
   * @returns {number} Current gold
   */
  getGold() {
    return this.gold;
  }

  /**
   * Resets gold to zero (called on death)
   */
  resetGold() {
    this.gold = 0;
    log.debug("Player gold reset to 0");
  }

  // DEATH RESET: Restore player to initial state
  resetToInitialState(startPosition) {
    console.log("=== PLAYER RESET TO INITIAL STATE ===");

    // Reset health and stamina
    this.health = this.maxHealth;
    this.stamina = this.maxStamina;
    this.isInvulnerable = false;
    this.invulnerabilityTimer = 0;

    // Reset gold and shop upgrades
    this.gold = 0;
    this.meleeDamageBonus = 0;
    this.rangedDamageBonus = 0;

    // Reset position if provided
    if (startPosition) {
      this.position = new Vec(startPosition.x, startPosition.y);
    }

    // Reset movement and attack state
    this.velocity = new Vec(0, 0);
    this.keys = [];
    this.isAttacking = false;
    this.attackCooldown = 0;
    this.hasCreatedProjectile = false;
    this.hasAppliedMeleeDamage = false;

    // Reset dash state
    this.dashTime = 0;
    this.dashCooldownTime = 0;
    this.dashDirection = new Vec(0, 0);

    // Clear all projectiles
    this.projectiles = [];

    // Reset weapon to default
    this.weaponType = "dagger";
    this.setWeapon("dagger");

    // Reset direction
    this.currentDirection = "down";
    this.previousDirection = "down";

    console.log("Player reset complete:");
    console.log(`  - Health: ${this.health}/${this.maxHealth}`);
    console.log(
      `  - Position: (${Math.round(this.position.x)}, ${Math.round(
        this.position.y
      )})`
    );
    console.log(`  - Weapon: ${this.weaponType}`);
    console.log(`  - Projectiles cleared: ${this.projectiles.length === 0}`);
  }

  // Get current player state for debugging
  getPlayerState() {
    return {
      health: this.health,
      maxHealth: this.maxHealth,
      gold: this.gold,
      position: {
        x: Math.round(this.position.x),
        y: Math.round(this.position.y),
      },
      weapon: this.weaponType,
      isAttacking: this.isAttacking,
      attackCooldown: Math.round(this.attackCooldown),
      activeProjectiles: this.projectiles.length,
      isDead: this.health <= 0,
    };
  }

  setWeapon(type) {
    if (type === "dagger" || type === "slingshot") {
      console.log(`Switching weapon to ${type}`);
      this.weaponType = type;
      // Update sprite sheet based on weapon type
      const spritePath =
        type === "dagger"
          ? "../assets/sprites/dagger-sprite-sheet.png"
          : "../assets/sprites/slingshot-sprite-sheet.png";
      this.setSprite(spritePath, new Rect(0, 0, 64, 64));

      // Reset to idle animation in current direction
      const anim = playerMovement[this.currentDirection];
      this.setAnimation(anim.frames[0], anim.frames[0], false, anim.duration);
      this.frame = anim.frames[0];
      this.spriteRect.x = this.frame % this.sheetCols;
      this.spriteRect.y = Math.floor(this.frame / this.sheetCols);
    }
  }

  // LINE OF SIGHT: Raycast to detect walls between player and target
  raycastToWall(startPos, direction, maxDistance) {
    if (!this.currentRoom) return maxDistance;

    let currentDistance = 0;
    const normalizedDirection = direction.normalize();

    // Step through the ray in small increments
    while (currentDistance < maxDistance) {
      const currentPos = startPos.plus(
        normalizedDirection.times(currentDistance)
      );

      // Create a small test object for collision detection
      const testObject = {
        position: currentPos,
        width: 4,
        height: 4,
        getHitboxBounds: () => ({
          x: currentPos.x - 2,
          y: currentPos.y - 2,
          width: 4,
          height: 4,
        }),
      };

      // Check if this position collides with a wall
      if (this.currentRoom.checkWallCollision(testObject)) {
        console.log(
          `Wall detected at distance ${Math.round(
            currentDistance
          )} (direction: ${this.currentDirection})`
        );
        return currentDistance;
      }

      currentDistance += RAYCAST_STEP_SIZE;
    }

    // No wall found within max distance
    return maxDistance;
  }

  // ENHANCED ATTACK: Melee attack with line-of-sight wall detection
  attack() {
    const staminaCost =
      this.weaponType === "dagger"
        ? PLAYER_CONSTANTS.DAGGER_STAMINA_COST
        : PLAYER_CONSTANTS.SLINGSHOT_STAMINA_COST;

    if (this.stamina < staminaCost) {
      console.log("Not enough stamina to attack");
      return;
    }

    if (!this.isAttacking && this.attackCooldown <= 0) {
      this.isAttacking = true;
      this.hasCreatedProjectile = false; // Reset projectile creation flag
      this.hasAppliedMeleeDamage = false; // Reset melee damage flag
      this.attackCooldown = playerAttack.cooldown;

      if (this.weaponType === "dagger") {
        this.stamina -= staminaCost;
        this.staminaRegenCooldown = this.staminaRegenDelay;
      }

      console.log(`Player attacking with ${this.weaponType}`);

      if (this.weaponType === "dagger") {
        const playerCenter = new Vec(
          this.position.x + this.width / 2,
          this.position.y + this.height / 2
        );
        const attackDirection = this.getAttackDirection();
        const attackArea = this.calculateAttackArea(
          playerCenter,
          attackDirection,
          DAGGER_ATTACK_RANGE,
          DAGGER_ATTACK_WIDTH
        );

        if (this.currentRoom && this.currentRoom.objects.enemies) {
          const enemies = this.currentRoom.objects.enemies.filter(
            (enemy) => enemy.state !== "dead"
          );
          let enemiesHit = 0;

          enemies.forEach((enemy) => {
            const enemyHitbox = enemy.getHitboxBounds();

            if (
              attackArea.x < enemyHitbox.x + enemyHitbox.width &&
              attackArea.x + attackArea.width > enemyHitbox.x &&
              attackArea.y < enemyHitbox.y + enemyHitbox.height &&
              attackArea.y + attackArea.height > enemyHitbox.y
            ) {
              enemy.takeDamage(DAGGER_ATTACK_DAMAGE + this.meleeDamageBonus);
              enemiesHit++;
            }
          });

          console.log(
            enemiesHit === 0
              ? "Dagger attack missed all enemies"
              : `Dagger attack hit ${enemiesHit} enemies`
          );
        } else {
          console.warn("No current room or enemies found for dagger attack");
        }

        this.hasAppliedMeleeDamage = true;
      }

      // Store current frame and direction before attacking
      this.preAttackFrame = this.frame;
      this.preAttackDirection = this.currentDirection;
      this.preAttackMinFrame = this.minFrame;
      this.preAttackMaxFrame = this.maxFrame;
      const attackFrames = getAttackFrames(
        this.weaponType,
        this.currentDirection
      );
      this.setAnimation(
        attackFrames[0],
        attackFrames[1],
        playerAttack.repeat,
        playerAttack.duration
      );
      this.frame = this.minFrame;
    } else {
      console.log(
        this.isAttacking
          ? "Attack blocked: Already attacking"
          : `Attack blocked: Cooldown remaining ${Math.round(
              this.attackCooldown
            )}ms`
      );
    }
  }

  update(deltaTime) {
    if (this.isInvulnerable) {
      this.invulnerabilityTimer -= deltaTime;
      if (this.invulnerabilityTimer <= 0) {
        this.isInvulnerable = false;
      }
    }
    // Reduce cooldown time
    if (this.dashCooldownTime > 0) this.dashCooldownTime -= deltaTime;

    if (this.dashTime > 0) {
      // Durante dash: intentar movimiento en X e Y por separado
      const dashVelocity = this.dashDirection.times(this.dashSpeed * deltaTime);

      // Try movement in X direction
      const newPositionX = this.position.plus(new Vec(dashVelocity.x, 0));
      const tempPlayerX = new Player(
        newPositionX,
        this.width,
        this.height,
        this.color,
        this.sheetCols
      );

      // Try movement in Y direction
      const newPositionY = this.position.plus(new Vec(0, dashVelocity.y));
      const tempPlayerY = new Player(
        newPositionY,
        this.width,
        this.height,
        this.color,
        this.sheetCols
      );

      // Check collisions separately
      const canMoveX = !this.currentRoom?.checkWallCollision(tempPlayerX);
      const canMoveY = !this.currentRoom?.checkWallCollision(tempPlayerY);

      // Apply movement based on collisions
      if (canMoveX) {
        this.position.x = newPositionX.x;
      }
      if (canMoveY) {
        this.position.y = newPositionY.y;
      }

      this.dashTime -= deltaTime;
    } else {
      // Normal movement
      // Update invulnerability timer
      if (this.attackCooldown > 0) {
        this.attackCooldown -= deltaTime;
      }

      // Handle attack animation and projectile creation
      if (this.isAttacking) {
        // Create projectile at the middle of the attack animation
        if (
          this.weaponType === "slingshot" &&
          !this.hasCreatedProjectile &&
          this.frame === Math.floor((this.minFrame + this.maxFrame) / 2)
        ) {
          const projectileSpeed = PLAYER_CONSTANTS.SLINGSHOT_PROJECTILE_SPEED;
          const projectileDamage =
            PLAYER_CONSTANTS.SLINGSHOT_DAMAGE + this.rangedDamageBonus; // Add shop bonus

          // Calculate spawn position at the center of the player
          const spawnPos = new Vec(
            this.position.x + this.width / 2,
            this.position.y + this.height / 2
          );

          // Create a target position based on player's direction
          let targetPos = new Vec(spawnPos.x, spawnPos.y);
          switch (this.currentDirection) {
            case "up":
              targetPos.y -= 100;
              break;
            case "down":
              targetPos.y += 100;
              break;
            case "left":
              targetPos.x -= 100;
              break;
            case "right":
              targetPos.x += 100;
              break;
          }

          // Create a temporary target object for the projectile
          const target = { position: targetPos };

          const projectile = new Projectile(
            spawnPos,
            target,
            projectileSpeed,
            projectileDamage
          );
          projectile.setCurrentRoom(this.currentRoom); // Set room reference for wall collision
          this.projectiles.push(projectile);
          this.hasCreatedProjectile = true; // Mark that we've created the projectile

          this.stamina -= PLAYER_CONSTANTS.SLINGSHOT_STAMINA_COST;
          this.staminaRegenCooldown = this.staminaRegenDelay;

          console.log(
            `Slingshot projectile created (direction: ${this.currentDirection}, damage: ${projectileDamage})`
          );
        }

        // Apply melee damage is now handled in the attack() method

        if (this.frame >= this.maxFrame) {
          this.isAttacking = false;
          this.hasCreatedProjectile = false; // Reset the flag
          this.hasAppliedMeleeDamage = false; // Reset the flag
          // Return to the exact frame and direction we were in before the attack
          const anim = playerMovement[this.preAttackDirection];
          this.minFrame = this.preAttackMinFrame;
          this.maxFrame = this.preAttackMaxFrame;
          this.frame = this.preAttackFrame;
          this.repeat = anim.repeat;
          this.frameDuration = anim.duration;
          this.spriteRect.x = this.frame % this.sheetCols;
          this.spriteRect.y = Math.floor(this.frame / this.sheetCols);
        }
      }

      // Update projectiles with current room's enemies
      this.projectiles = this.projectiles.filter((projectile) => {
        // Ensure projectile has room reference for wall collision detection
        if (!projectile.currentRoom && this.currentRoom) {
          projectile.setCurrentRoom(this.currentRoom);
        }

        // Get current room's alive enemies
        const roomEnemies =
          this.currentRoom && this.currentRoom.objects.enemies
            ? this.currentRoom.objects.enemies.filter(
                (enemy) => enemy.state !== "dead"
              )
            : [];

        projectile.update(deltaTime, roomEnemies);
        return projectile.isActive;
      });

      if (this.staminaRegenCooldown > 0) {
        this.staminaRegenCooldown -= deltaTime;
      } else {
        this.stamina = Math.min(
          this.maxStamina,
          this.stamina + (this.staminaRegenRate * deltaTime) / 1000
        );
      }

      this.setVelocity();

      // Try movement in X direction
      const newPositionX = this.position.plus(
        new Vec(this.velocity.x * deltaTime, 0)
      );
      const tempPlayerX = new Player(
        newPositionX,
        this.width,
        this.height,
        this.color,
        this.sheetCols
      );

      // Try movement in Y direction
      const newPositionY = this.position.plus(
        new Vec(0, this.velocity.y * deltaTime)
      );
      const tempPlayerY = new Player(
        newPositionY,
        this.width,
        this.height,
        this.color,
        this.sheetCols
      );

      // Check collisions separately
      const canMoveX = !this.currentRoom?.checkWallCollision(tempPlayerX);
      const canMoveY = !this.currentRoom?.checkWallCollision(tempPlayerY);

      // Apply movement based on collisions
      if (canMoveX) {
        this.position.x = newPositionX.x;
      }
      if (canMoveY) {
        this.position.y = newPositionY.y;
      }
    }

    this.constrainToCanvas();
    // Only update movement animation if not attacking
    if (!this.isAttacking) {
      this.setMovementAnimation();
    }
    this.updateFrame(deltaTime);
  }

  // Extracted helper method to calculate attack direction based on current direction
  getAttackDirection() {
    switch (this.currentDirection) {
      case "right":
        return new Vec(1, 0);
      case "left":
        return new Vec(-1, 0);
      case "up":
        return new Vec(0, -1);
      case "down":
      default:
        return new Vec(0, 1);
    }
  }

  // Extracted helper method to calculate attack area
  calculateAttackArea(
    playerCenter,
    attackDirection,
    baseAttackRange,
    attackWidth
  ) {
    const actualAttackRange = this.raycastToWall(
      playerCenter,
      attackDirection,
      baseAttackRange
    );

    let attackArea = {
      x: playerCenter.x,
      y: playerCenter.y,
      width: attackWidth,
      height: attackWidth,
    };

    switch (this.currentDirection) {
      case "right":
        attackArea.x = playerCenter.x;
        attackArea.y = playerCenter.y - attackWidth / 2;
        attackArea.width = actualAttackRange;
        break;
      case "left":
        attackArea.x = playerCenter.x - actualAttackRange;
        attackArea.y = playerCenter.y - attackWidth / 2;
        attackArea.width = actualAttackRange;
        break;
      case "up":
        attackArea.width = attackWidth;
        attackArea.height = actualAttackRange;
        attackArea.x = playerCenter.x - attackWidth / 2;
        attackArea.y = playerCenter.y - actualAttackRange;
        break;
      case "down":
        attackArea.width = attackWidth;
        attackArea.height = actualAttackRange;
        attackArea.x = playerCenter.x - attackWidth / 2;
        attackArea.y = playerCenter.y;
        break;
    }

    return attackArea;
  }

  // Updated attack method to use helper methods
  attack() {
    const staminaCost = this.weaponType === "dagger" ? 8 : 12;

    if (this.stamina < staminaCost) {
      console.log("Not enough stamina to attack");
      return;
    }

    if (!this.isAttacking && this.attackCooldown <= 0) {
      this.isAttacking = true;
      this.hasCreatedProjectile = false; // Reset projectile creation flag
      this.hasAppliedMeleeDamage = false; // Reset melee damage flag
      this.attackCooldown = playerAttack.cooldown;

      if (this.weaponType === "dagger") {
        this.stamina -= staminaCost;
        this.staminaRegenCooldown = this.staminaRegenDelay;
      }

      console.log(`Player attacking with ${this.weaponType}`);

      if (this.weaponType === "dagger") {
        const playerCenter = new Vec(
          this.position.x + this.width / 2,
          this.position.y + this.height / 2
        );
        const attackDirection = this.getAttackDirection();
        const attackArea = this.calculateAttackArea(
          playerCenter,
          attackDirection,
          DAGGER_ATTACK_RANGE,
          DAGGER_ATTACK_WIDTH
        );

        if (this.currentRoom && this.currentRoom.objects.enemies) {
          const enemies = this.currentRoom.objects.enemies.filter(
            (enemy) => enemy.state !== "dead"
          );
          let enemiesHit = 0;

          enemies.forEach((enemy) => {
            const enemyHitbox = enemy.getHitboxBounds();

            if (
              attackArea.x < enemyHitbox.x + enemyHitbox.width &&
              attackArea.x + attackArea.width > enemyHitbox.x &&
              attackArea.y < enemyHitbox.y + enemyHitbox.height &&
              attackArea.y + attackArea.height > enemyHitbox.y
            ) {
              enemy.takeDamage(DAGGER_ATTACK_DAMAGE + this.meleeDamageBonus);
              enemiesHit++;
            }
          });

          console.log(
            enemiesHit === 0
              ? "Dagger attack missed all enemies"
              : `Dagger attack hit ${enemiesHit} enemies`
          );
        } else {
          console.warn("No current room or enemies found for dagger attack");
        }

        this.hasAppliedMeleeDamage = true;
      }

      // Store current frame and direction before attacking
      this.preAttackFrame = this.frame;
      this.preAttackDirection = this.currentDirection;
      this.preAttackMinFrame = this.minFrame;
      this.preAttackMaxFrame = this.maxFrame;
      const attackFrames = getAttackFrames(
        this.weaponType,
        this.currentDirection
      );
      this.setAnimation(
        attackFrames[0],
        attackFrames[1],
        playerAttack.repeat,
        playerAttack.duration
      );
      this.frame = this.minFrame;
    } else {
      console.log(
        this.isAttacking
          ? "Attack blocked: Already attacking"
          : `Attack blocked: Cooldown remaining ${Math.round(
              this.attackCooldown
            )}ms`
      );
    }
  }

  // Updated draw method to use helper methods
  draw(ctx) {
    super.draw(ctx);
    this.projectiles.forEach((projectile) => projectile.draw(ctx));

    if (
      this.weaponType === "dagger" &&
      this.isAttacking &&
      variables.showHitboxes
    ) {
      const playerCenter = new Vec(
        this.position.x + this.width / 2,
        this.position.y + this.height / 2
      );
      const attackDirection = this.getAttackDirection();
      const attackArea = this.calculateAttackArea(
        playerCenter,
        attackDirection,
        DAGGER_ATTACK_RANGE,
        DAGGER_ATTACK_WIDTH
      );

      const isLimited =
        this.raycastToWall(playerCenter, attackDirection, DAGGER_ATTACK_RANGE) <
        DAGGER_ATTACK_RANGE;
      const pulseIntensity = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;

      ctx.strokeStyle = isLimited
        ? `rgba(255, 165, 0, ${pulseIntensity})`
        : `rgba(255, 0, 0, ${pulseIntensity})`;
      ctx.fillStyle = isLimited
        ? `rgba(255, 165, 0, ${pulseIntensity * 0.3})`
        : `rgba(255, 0, 0, ${pulseIntensity * 0.3})`;

      ctx.lineWidth = 3;
      ctx.fillRect(
        attackArea.x,
        attackArea.y,
        attackArea.width,
        attackArea.height
      );
      ctx.strokeRect(
        attackArea.x,
        attackArea.y,
        attackArea.width,
        attackArea.height
      );
    }
  }

  // startDash: start the dash if cooldown is over
  startDash() {
    if (this.stamina < DASH_STAMINA_COST) {
      console.log("Not enough stamina to dash");
      return;
    }
    // Solo permitir dash si no está en cooldown y no está atacando
    if (this.dashCooldownTime <= 0 && this.dashTime <= 0 && !this.isAttacking) {
      // Solo permitir dash si hay teclas presionadas
      if (this.keys.length > 0) {
        // Usar la dirección de las teclas actualmente presionadas
        const currentVelocity = new Vec(0, 0);
        for (const key of this.keys) {
          const move = playerMovement[key];
          if (move && move.axis) {
            currentVelocity[move.axis] += move.direction;
          }
        }

        // Solo dash si hay movimiento
        if (currentVelocity.magnitude() > 0) {
          this.dashDirection = currentVelocity.normalize();
          this.dashTime = this.dashDuration;
          this.stamina -= DASH_STAMINA_COST;
          this.staminaCooldown = this.staminaRegenDelay;
          this.dashCooldownTime = this.dashCooldown;
          this.isInvulnerable = true;
          this.invulnerabilityTimer = this.dashDuration;
        }
      }
    }
  }

  // constrainToCanvas: keep the player inside the canvas
  constrainToCanvas() {
    const w = variables.canvasWidth;

    const h = variables.canvasHeight;
    if (this.position.y < 0) this.position.y = 0;
    else if (this.position.y + this.height > h)
      this.position.y = h - this.height;
    if (this.position.x < 0) this.position.x = 0;
    else if (this.position.x + this.width > w) this.position.x = w - this.width;
  }

  setVelocity() {
    this.velocity = new Vec(0, 0);
    for (const key of this.keys) {
      const move = playerMovement[key];
      if (move && move.axis) {
        this.velocity[move.axis] += move.direction;
      }
    }
    this.velocity = this.velocity.normalize().times(variables.playerSpeed);
  }

  setMovementAnimation() {
    const v = this.velocity;
    // Only update direction if we're actually moving
    if (v.x !== 0 || v.y !== 0) {
      const newDirection =
        Math.abs(v.y) > Math.abs(v.x)
          ? v.y > 0
            ? "down"
            : v.y < 0
            ? "up"
            : this.currentDirection
          : v.x > 0
          ? "right"
          : v.x < 0
          ? "left"
          : this.currentDirection;

      if (newDirection !== this.currentDirection) {
        this.currentDirection = newDirection;
        const anim = playerMovement[this.currentDirection];
        this.setAnimation(...anim.frames, anim.repeat, anim.duration);
        this.frame = this.minFrame;
        this.previousDirection = this.currentDirection;
      }
    } else {
      // When not moving, keep the current direction and set to first frame
      const anim = playerMovement[this.currentDirection];
      this.setAnimation(anim.frames[0], anim.frames[0], false, anim.duration);
      this.frame = anim.frames[0];
      this.spriteRect.x = this.frame % this.sheetCols;
      this.spriteRect.y = Math.floor(this.frame / this.sheetCols);
    }
  }

  // Get attack status information for debugging
  getAttackStatus() {
    const roomEnemyCount =
      this.currentRoom && this.currentRoom.objects.enemies
        ? this.currentRoom.objects.enemies.filter(
            (enemy) => enemy.state !== "dead"
          ).length
        : 0;

    return {
      isAttacking: this.isAttacking,
      attackCooldown: Math.round(this.attackCooldown),
      weaponType: this.weaponType,
      canAttack: !this.isAttacking && this.attackCooldown <= 0,
      activeProjectiles: this.projectiles.length,
      roomEnemies: roomEnemyCount,
    };
  }

  // Validation method for testing the attack system
  validateAttackSystem() {
    console.log("=== OPTIMIZED ATTACK SYSTEM VALIDATION ===");

    const status = this.getAttackStatus();
    console.log("Current Status:", status);

    // Check room and enemies
    if (!this.currentRoom) {
      console.error("No current room set");
      return false;
    }

    if (!this.currentRoom.objects.enemies) {
      console.error("No enemies array in current room");
      return false;
    }

    const aliveEnemies = this.currentRoom.objects.enemies.filter(
      (enemy) => enemy.state !== "dead"
    );
    console.log(
      `Enemies: ${aliveEnemies.length} alive, ${this.currentRoom.objects.enemies.length} total`
    );

    // Check attack constants with new line-of-sight system
    console.log("OPTIMIZED Dagger Config:", {
      baseRange: DAGGER_ATTACK_RANGE,
      width: DAGGER_ATTACK_WIDTH,
      damage: DAGGER_ATTACK_DAMAGE,
      enhancements: [
        "Range extended by 2.5x (30 → 75)",
        "Wall collision detection (raycast)",
        "Line-of-sight verification",
      ],
    });

    // Test raycast functionality
    if (this.currentRoom) {
      const playerCenter = new Vec(
        this.position.x + this.width / 2,
        this.position.y + this.height / 2
      );
      const testDirection = new Vec(1, 0); // Test right direction
      const raycastResult = this.raycastToWall(
        playerCenter,
        testDirection,
        DAGGER_ATTACK_RANGE
      );

      console.log("Line-of-Sight Test:", {
        playerPosition: `(${Math.round(playerCenter.x)}, ${Math.round(
          playerCenter.y
        )})`,
        testDirection: "right",
        maxRange: DAGGER_ATTACK_RANGE,
        actualRange: Math.round(raycastResult),
        wallDetected: raycastResult < DAGGER_ATTACK_RANGE,
      });
    }

    // Check weapon and cooldown
    console.log("Weapon:", this.weaponType);
    console.log("Cooldown:", playerAttack.cooldown + "ms");

    // Validate projectile wall collision system
    console.log("Projectile Wall Collision:", {
      playerProjectiles: this.projectiles.length,
      roomReferenceSet: this.projectiles.every((p) => p.currentRoom !== null),
      feature: "Projectiles stop when hitting walls",
    });

    // Performance optimizations info
    console.log("Performance Optimizations:", {
      roomStateUpdates: "Event-driven only (enemy death, transitions)",
      raycastStepSize: "4px increments",
      lineOfSightTolerance: "5px",
      noPerFrameUpdates: "Room state not updated every frame",
    });

    if (aliveEnemies.length > 0) {
      console.log("Optimized attack system ready for testing");
      console.log("NEW: Line-of-sight melee + optimized state updates");
      console.log("Visual: Orange attack area when limited by walls");
    } else {
      console.log("No alive enemies to test with");
    }

    return true;
  }
}
