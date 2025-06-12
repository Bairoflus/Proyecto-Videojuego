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
  SPRITE_SCALING_CONSTANTS,
} from "../../constants/gameConstants.js";
import { completeRun } from "../../utils/api.js";
import { weaponUpgradeManager } from "../../utils/weaponUpgradeManager.js";

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
    this.weaponType = "melee"; // Changed from specific weapon to category
    this.isAttacking = false;
    this.attackCooldown = 0;
    this.projectiles = [];
    this.hasCreatedProjectile = false;
    this.hasAppliedMeleeDamage = false;

    // NEW: Weapon progression using weaponUpgradeManager
    this.meleeLevel = 1;
    this.rangedLevel = 1;
    this.maxWeaponLevel = 15;

    // Player stats
    this.health = PLAYER_CONSTANTS.MAX_HEALTH;
    this.maxHealth = PLAYER_CONSTANTS.MAX_HEALTH;
    this.stamina = PLAYER_CONSTANTS.MAX_STAMINA;
    this.maxStamina = PLAYER_CONSTANTS.MAX_STAMINA;
    this.staminaRegenRate = PLAYER_CONSTANTS.STAMINA_REGEN_RATE;
    this.staminaRegenDelay = PLAYER_CONSTANTS.STAMINA_REGEN_DELAY;
    this.staminaRegenCooldown = 0;

    // NEW v3.0: Movement speed multiplier for permanent upgrades
    this.speedMultiplier = 1.0; // Default speed (no bonus)

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

    // Define sprite paths for different weapons - CORRECTED PATHS
    this.weaponSprites = {
      melee: {
        walk: "/assets/sprites/player/dagger/walk.png",
        attack: "/assets/sprites/player/dagger/slash.png",
      },
      ranged: {
        walk: "/assets/sprites/player/bow/walk.png",
        attack: "/assets/sprites/player/bow/attack.png",
      },
      magic: {
        walk: "/assets/sprites/player/lightsaber/walk.png",
        attack: "/assets/sprites/player/lightsaber/attack.png",
      },
    };

    // Default weapon sprite configuration - CORRECTED PATHS
    this.defaultWeaponConfig = {
      melee: {
        spritePath: "/assets/sprites/player/dagger/walk.png",
        columns: 9,
        animationSpeed: 0.15,
      },
      ranged: {
        spritePath: "/assets/sprites/player/bow/walk.png",
        columns: 8,
        animationSpeed: 0.12,
      },
      magic: {
        spritePath: "/assets/sprites/player/lightsaber/walk.png",
        columns: 6,
        animationSpeed: 0.18,
      },
    };

    // NEW: Load current weapon levels from weaponUpgradeManager
    this.loadCurrentWeaponLevels();
  }

  /**
   * Load current weapon levels from weaponUpgradeManager
   */
  loadCurrentWeaponLevels() {
    try {
      // Check if weaponUpgradeManager exists and has the required method
      if (
        typeof window !== "undefined" &&
        window.weaponUpgradeManager &&
        typeof window.weaponUpgradeManager.getWeaponLevels === "function"
      ) {
        const currentLevels = window.weaponUpgradeManager.getWeaponLevels();
        this.meleeLevel = currentLevels.melee || 1;
        this.rangedLevel = currentLevels.ranged || 1;

        // Always log weapon level loading for debugging persistence issues
        console.log("Weapon levels loaded from manager:", {
          melee: this.meleeLevel,
          ranged: this.rangedLevel,
          source: "weaponUpgradeManager",
        });

        // Update weapon sprite to match current level
        this.updateWeaponSprite();
      } else {
        // Use default levels if manager not available
        this.meleeLevel = 1;
        this.rangedLevel = 1;
        console.log("Using default weapon levels (manager not available):", {
          melee: this.meleeLevel,
          ranged: this.rangedLevel,
          source: "default",
        });
      }
    } catch (error) {
      console.error("Error loading weapon levels from manager:", error);
      // Silently fall back to defaults to prevent spam
      this.meleeLevel = 1;
      this.rangedLevel = 1;
    }
  }

  /**
   * NEW: Force reload weapon levels from weaponUpgradeManager
   * This should be called after weaponUpgradeManager is initialized/loaded
   */
  forceReloadWeaponLevels() {
    console.log("Force reloading weapon levels from manager...");
    this.loadCurrentWeaponLevels();
  }

  /**
   * Sync weapon levels with weaponUpgradeManager
   */
  syncWeaponLevels() {
    try {
      if (
        typeof window !== "undefined" &&
        window.weaponUpgradeManager &&
        typeof window.weaponUpgradeManager.getWeaponLevels === "function"
      ) {
        const currentLevels = window.weaponUpgradeManager.getWeaponLevels();
        this.meleeLevel = currentLevels.melee || 1;
        this.rangedLevel = currentLevels.ranged || 1;

        // Update sprite if weapon changed
        this.updateWeaponSprite();

        // Only log meaningful weapon upgrades
        // console.log('Weapon levels synchronized:', {
        //   melee: this.meleeLevel,
        //   ranged: this.rangedLevel
        // });
      }
    } catch (error) {
      // Silently handle errors to prevent console spam
    }
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
    // CRITICAL FIX: Prevent damage if player is already dead
    if (this.state === "dead") {
      console.log("Damage blocked - Player already dead");
      return;
    }

    if (this.isInvulnerable) return;

    this.health = Math.max(0, this.health - amount);
    this.isInvulnerable = true;
    this.invulnerabilityTimer = this.invulnerabilityDuration;

    // Play player hurt sound effect
    if (window.game && window.game.audioManager) {
      window.game.audioManager.playPlayerHurtSFX();
    }

    // Log player health after taking damage
    console.log("Player health:", this.health);

    // TODO: Add damage feedback (screen flash, sound, etc.)

    if (this.health <= 0) {
      this.die();
    }
  }

  async die() {
    // CRITICAL FIX: Prevent multiple death processing
    if (this.state === "dead") {
      console.log("Death blocked - Player already processing death");
      return;
    }

    console.log("PLAYER DEATH - Processing...");
    this.state = "dead";

    // Complete current run in backend with death data
    try {
      const currentRunId = localStorage.getItem("currentRunId");

      if (currentRunId && window.game) {
        console.log("Completing run for player death...");

        // Get run statistics from game instance
        const runStats = window.game.getRunStats();

        const completionData = {
          goldCollected: runStats.goldCollected,
          goldSpent: runStats.goldSpent,
          totalKills: runStats.totalKills,
          deathCause: "enemy_damage", // Player died from enemy damage
        };

        console.log("Death completion data:", completionData);
        const result = await completeRun(currentRunId, completionData);
        console.log("Run completed for death:", result);

        // Clear the current run ID since run is now complete
        localStorage.removeItem("currentRunId");

        // FIXED: Let FloorGenerator.resetToInitialState() handle new run creation
        // This centralizes all run management logic in one place
        console.log(
          "Run completed - FloorGenerator will create new run during reset"
        );
      } else {
        console.log(
          "No current run ID found or game instance missing - playing in test mode"
        );
      }
    } catch (error) {
      console.error("Failed to complete run on death:", error);
    }

    // Trigger complete game reset through the global game instance
    if (window.game && typeof window.game.resetGameAfterDeath === "function") {
      // Small delay to show death state before reset
      setTimeout(async () => {
        try {
          await window.game.resetGameAfterDeath();
          console.log("Game reset completed successfully");
        } catch (error) {
          console.error("Error during game reset:", error);
        }
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

    // CRITICAL FIX: Reset death state to allow damage again
    this.state = "alive"; // or undefined, but not "dead"

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
    this.weaponType = "melee";
    this.setWeapon("melee");

    // Reset direction
    this.currentDirection = "down";
    this.previousDirection = "down";

    console.log("Player reset complete:");
    console.log(`  - State: ${this.state} (was dead, now alive)`);
    console.log(`  - Health: ${this.health}/${this.maxHealth}`);
    console.log(`  - Invulnerable: ${this.isInvulnerable}`);
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
    if (type === "melee" || type === "ranged") {
      console.log(`Switching weapon to ${type}`);
      this.weaponType = type;

      // Update sprite sheet based on weapon type
      const spritePath = this.getWeaponSpritePath();

      // Set correct sheetCols for walk sprites (all walk sprites have 9 columns)
      this.sheetCols = 9;

      this.setSprite(spritePath);

      // Update walking animation frames based on weapon
      this.updateWalkingFrames(type);

      // Reset to current direction animation (walking or idle)
      this.resetToCurrentDirectionAnimation();

      console.log(
        `Weapon switched to ${type} with sprite: ${spritePath} (${this.sheetCols} columns)`
      );
    } else {
      console.warn(
        `Invalid weapon type: ${type}. Valid types are 'melee' and 'ranged'`
      );
    }
  }

  /**
   * Get the sprite path for the current weapon
   * @returns {string} The sprite path
   */
  getWeaponSpritePath() {
    const currentWeapon = this.getCurrentWeapon();
    const weaponSpritePaths = {
      dagger: "/assets/sprites/player/dagger/walk.png",
      katana: "/assets/sprites/player/katana/walk.png",
      lightsaber: "/assets/sprites/player/lightsaber/walk.png",
      slingshot: "/assets/sprites/player/slingshot/walk.png",
      bow: "/assets/sprites/player/bow/walk.png",
      crossbow: "/assets/sprites/player/crossbow/walk.png",
    };

    return weaponSpritePaths[currentWeapon] || weaponSpritePaths.dagger;
  }

  /**
   * Update walking animation frames based on weapon type
   * This method can be extended to support different walking animations per weapon
   * @param {string} weaponType - The weapon type
   */
  updateWalkingFrames(weaponType) {
    // For now, all weapons use the same walking frames
    // This can be expanded later if different weapons have different walking animations
    console.log(`Walking frames updated for weapon: ${weaponType}`);
  }

  /**
   * Reset animation to current direction (walking if moving, idle if stationary)
   */
  resetToCurrentDirectionAnimation() {
    const isMoving =
      this.velocity && (this.velocity.x !== 0 || this.velocity.y !== 0);

    if (isMoving) {
      // Set walking animation
      const anim = playerMovement[this.currentDirection];
      this.setAnimation(
        anim.frames[0],
        anim.frames[1],
        anim.repeat,
        anim.duration
      );
      this.frame = anim.frames[0];
    } else {
      // Set idle animation (first frame of current direction)
      const anim = playerMovement[this.currentDirection];
      this.setAnimation(anim.frames[0], anim.frames[0], false, anim.duration);
      this.frame = anim.frames[0];
    }

    // Update sprite rectangle
    this.spriteRect.x = this.frame % this.sheetCols;
    this.spriteRect.y = Math.floor(this.frame / this.sheetCols);
  }

  /**
   * Raycast to find nearest wall in given direction with specified maximum distance
   * @param {Vec} startPos - Starting position for the raycast
   * @param {Vec} direction - Normalized direction vector
   * @param {number} maxDistance - Maximum distance to check
   * @returns {number} Distance to wall or maxDistance if no wall found
   */
  raycastToWall(startPos, direction, maxDistance) {
    const RAYCAST_STEP_SIZE = 5; // Step size for the raycast
    let currentDistance = 0;

    // Step through the direction until we hit a wall or reach max distance
    while (currentDistance < maxDistance) {
      const rayPosition = startPos.plus(direction.times(currentDistance));

      // Create a small test object at the ray position
      const testObject = {
        position: rayPosition,
        width: 4,
        height: 4,
        getHitboxBounds: () => ({
          x: rayPosition.x,
          y: rayPosition.y,
          width: 4,
          height: 4,
        }),
      };

      // Check if this position collides with a wall
      if (this.currentRoom.checkWallCollision(testObject)) {
        // Remove excessive wall detection logging to reduce console spam
        // Only log wall detection in debug mode if needed
        // if (currentDistance % 100 === 0) {
        //   console.log(
        //     `Wall detected at distance ${Math.round(
        //       currentDistance
        //     )} (direction: ${this.currentDirection})`
        //   );
        // }
        return currentDistance;
      }

      currentDistance += RAYCAST_STEP_SIZE;
    }

    // No wall found within max distance
    return maxDistance;
  }

  // ENHANCED ATTACK: Melee attack with line-of-sight wall detection (FIXED)
  attack() {
    const weaponInfo = this.getWeaponInfo();
    const staminaCost = weaponInfo.staminaCost;

    if (this.stamina < staminaCost) {
      console.log(
        `Not enough stamina to attack with ${
          this.weaponType
        } (need ${staminaCost}, have ${Math.floor(this.stamina)})`
      );
      return;
    }

    if (!this.isAttacking && this.attackCooldown <= 0) {
      this.isAttacking = true;
      this.hasCreatedProjectile = false; // Reset projectile creation flag
      this.hasAppliedMeleeDamage = false; // Reset melee damage flag
      this.attackCooldown = weaponInfo.cooldown;

      // Consume stamina for attacks
      this.stamina -= staminaCost;
      this.staminaRegenCooldown = this.staminaRegenDelay;

      console.log(
        `Player attacking with ${this.weaponType} (${weaponInfo.category})`
      );

      // Handle melee weapon attacks immediately
      if (this.isMeleeWeapon()) {
        this.performMeleeAttack();
      }

      // Store current frame and direction before attacking
      this.preAttackFrame = this.frame;
      this.preAttackDirection = this.currentDirection;
      this.preAttackMinFrame = this.minFrame;
      this.preAttackMaxFrame = this.maxFrame;

      // Store current sprite path and sheetCols to restore later
      this.preAttackSpritePath =
        this.spriteImage && this.spriteImage.src
          ? this.spriteImage.src
          : this.getWeaponSpritePath();
      this.preAttackSheetCols = this.sheetCols;

      // Switch to attack sprite sheet and update sheetCols for attack animations
      const attackSpritePath = weaponInfo.attackSpritePath;
      const currentWeapon = this.getCurrentWeapon();

      // Set correct sheetCols for attack sprites based on weapon type
      if (this.isRangedWeapon()) {
        if (currentWeapon === "crossbow") {
          this.sheetCols = 8; // Crossbow attack sprites have 8 columns
        } else {
          this.sheetCols = 13; // Slingshot/bow attack sprites have 13 columns
        }
      } else {
        this.sheetCols = 6; // All melee attack sprites have 6 columns
      }

      this.setSprite(attackSpritePath);

      // Set attack animation
      const attackFrames = getAttackFrames(
        currentWeapon,
        this.currentDirection
      );
      this.setAnimation(
        attackFrames[0],
        attackFrames[1],
        playerAttack.repeat,
        playerAttack.duration
      );
      this.frame = this.minFrame;

      // Update sprite rect to match the starting frame position
      if (this.spriteRect) {
        this.spriteRect.x = this.frame % this.sheetCols;
        this.spriteRect.y = Math.floor(this.frame / this.sheetCols);
      }
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

  /**
   * Perform melee attack with enhanced line-of-sight detection
   */
  performMeleeAttack() {
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
          const damage = this.getWeaponDamage();
          enemy.takeDamage(damage);
          enemiesHit++;
          console.log(
            `${this.getCurrentWeapon()} hit ${enemy.type} for ${damage} damage`
          );
        }
      });

      console.log(
        enemiesHit === 0
          ? `${this.getCurrentWeapon()} attack missed all enemies`
          : `${this.getCurrentWeapon()} attack hit ${enemiesHit} enemies`
      );
    } else {
      console.warn("No current room or enemies found for melee attack");
    }

    this.hasAppliedMeleeDamage = true;
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
      // During dash: try movement in X and Y separately
      const dashVelocity = this.dashDirection.times(this.dashSpeed * deltaTime);

      // Try movement in X direction using simple collision test
      const newPositionX = this.position.plus(new Vec(dashVelocity.x, 0));
      const tempCollisionTestX = {
        position: newPositionX,
        width: this.width,
        height: this.height,
        getHitboxBounds: () => ({
          x: newPositionX.x + this.hitbox.offsetX,
          y: this.position.y + this.hitbox.offsetY,
          width: this.hitbox.width,
          height: this.hitbox.height,
        }),
      };

      // Try movement in Y direction using simple collision test
      const newPositionY = this.position.plus(new Vec(0, dashVelocity.y));
      const tempCollisionTestY = {
        position: newPositionY,
        width: this.width,
        height: this.height,
        getHitboxBounds: () => ({
          x: this.position.x + this.hitbox.offsetX,
          y: newPositionY.y + this.hitbox.offsetY,
          width: this.hitbox.width,
          height: this.hitbox.height,
        }),
      };

      // Check collisions separately
      const canMoveX =
        !this.currentRoom?.checkWallCollision(tempCollisionTestX);
      const canMoveY =
        !this.currentRoom?.checkWallCollision(tempCollisionTestY);

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
        // Create projectile at the middle of the attack animation for ranged weapons
        if (
          this.isRangedWeapon() &&
          !this.hasCreatedProjectile &&
          this.frame === Math.floor((this.minFrame + this.maxFrame) / 2)
        ) {
          const weaponInfo = this.getWeaponInfo();
          const projectileSpeed = weaponInfo.projectileSpeed;
          const projectileDamage = this.getWeaponDamage(); // Use weapon damage calculation with shop bonuses

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

          // Note: Stamina consumption is now handled in the attack() method
          // Only log essential projectile events, not every creation
          // console.log(
          //   `${weaponInfo.type} projectile created (direction: ${this.currentDirection}, damage: ${projectileDamage})`
          // );
        }

        // Apply melee damage is now handled in the attack() method

        if (this.frame >= this.maxFrame) {
          this.isAttacking = false;
          this.hasCreatedProjectile = false; // Reset the flag
          this.hasAppliedMeleeDamage = false; // Reset the flag

          // Restore walking sprite sheet and sheetCols
          // FIX: Validate sprite path before restoring
          const spritePath =
            this.preAttackSpritePath || this.getWeaponSpritePath();
          this.setSprite(spritePath);
          this.sheetCols = this.preAttackSheetCols || 9; // Restore original sheetCols

          // Return to the exact frame and direction we were in before the attack
          // FIX: Validate direction before accessing playerMovement
          const direction =
            this.preAttackDirection || this.currentDirection || "down";
          const anim = playerMovement[direction];
          if (anim) {
            this.minFrame = this.preAttackMinFrame || anim.frames[0];
            this.maxFrame = this.preAttackMaxFrame || anim.frames[1];
            this.frame = this.preAttackFrame || anim.frames[0];
            this.repeat = anim.repeat;
            this.frameDuration = anim.duration;
            this.spriteRect.x = this.frame % this.sheetCols;
            this.spriteRect.y = Math.floor(this.frame / this.sheetCols);
          } else {
            console.warn(
              `Invalid direction for animation restore: ${direction}, using fallback`
            );
            // Fallback to current direction
            const fallbackAnim = playerMovement["down"];
            this.setAnimation(
              fallbackAnim.frames[0],
              fallbackAnim.frames[1],
              fallbackAnim.repeat,
              fallbackAnim.duration
            );
          }
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
      const tempCollisionTestX = {
        position: newPositionX,
        width: this.width,
        height: this.height,
        getHitboxBounds: () => ({
          x: newPositionX.x + this.hitbox.offsetX,
          y: this.position.y + this.hitbox.offsetY,
          width: this.hitbox.width,
          height: this.hitbox.height,
        }),
      };

      // Try movement in Y direction
      const newPositionY = this.position.plus(
        new Vec(0, this.velocity.y * deltaTime)
      );
      const tempCollisionTestY = {
        position: newPositionY,
        width: this.width,
        height: this.height,
        getHitboxBounds: () => ({
          x: this.position.x + this.hitbox.offsetX,
          y: newPositionY.y + this.hitbox.offsetY,
          width: this.hitbox.width,
          height: this.hitbox.height,
        }),
      };

      // Check collisions separately
      const canMoveX =
        !this.currentRoom?.checkWallCollision(tempCollisionTestX);
      const canMoveY =
        !this.currentRoom?.checkWallCollision(tempCollisionTestY);

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

  /**
   * Get current weapon information
   * @returns {Object} Weapon information including type, sprite path, and capabilities
   */
  getWeaponInfo() {
    const currentWeapon = this.getCurrentWeapon();

    const weaponInfo = {
      // Melee weapons
      dagger: {
        type: "dagger",
        category: "melee",
        spritePath: "/assets/sprites/player/dagger/walk.png",
        attackSpritePath: "/assets/sprites/player/dagger/slash.png",
        range: PLAYER_CONSTANTS.DAGGER_ATTACK_RANGE,
        damage: PLAYER_CONSTANTS.DAGGER_ATTACK_DAMAGE,
        staminaCost: PLAYER_CONSTANTS.DAGGER_STAMINA_COST,
        cooldown: playerAttack.cooldown,
        description: "Basic melee weapon (Level 1-5)",
      },
      katana: {
        type: "katana",
        category: "melee",
        spritePath: "/assets/sprites/player/katana/walk.png",
        attackSpritePath: "/assets/sprites/player/katana/slash.png",
        range: PLAYER_CONSTANTS.DAGGER_ATTACK_RANGE * 1.2, // Slightly longer range
        damage: PLAYER_CONSTANTS.DAGGER_ATTACK_DAMAGE * 1.5, // More damage
        staminaCost: PLAYER_CONSTANTS.DAGGER_STAMINA_COST,
        cooldown: playerAttack.cooldown,
        description: "Enhanced melee weapon (Level 6-10)",
      },
      lightsaber: {
        type: "lightsaber",
        category: "melee",
        spritePath: "/assets/sprites/player/lightsaber/walk.png",
        attackSpritePath: "/assets/sprites/player/lightsaber/slash.png",
        range: PLAYER_CONSTANTS.DAGGER_ATTACK_RANGE * 1.4, // Longest melee range
        damage: PLAYER_CONSTANTS.DAGGER_ATTACK_DAMAGE * 2, // Double damage
        staminaCost: PLAYER_CONSTANTS.DAGGER_STAMINA_COST * 0.8, // Less stamina cost
        cooldown: playerAttack.cooldown * 0.8, // Faster attacks
        description: "Ultimate melee weapon (Level 11-15)",
      },
      // Ranged weapons
      slingshot: {
        type: "slingshot",
        category: "ranged",
        spritePath: "/assets/sprites/player/slingshot/walk.png",
        attackSpritePath: "/assets/sprites/player/slingshot/shoot.png",
        range: 200, // Projectile range
        damage: PLAYER_CONSTANTS.SLINGSHOT_DAMAGE,
        staminaCost: PLAYER_CONSTANTS.SLINGSHOT_STAMINA_COST,
        cooldown: playerAttack.cooldown,
        projectileSpeed: PLAYER_CONSTANTS.SLINGSHOT_PROJECTILE_SPEED,
        description: "Basic ranged weapon (Level 1-5)",
      },
      bow: {
        type: "bow",
        category: "ranged",
        spritePath: "/assets/sprites/player/bow/walk.png",
        attackSpritePath: "/assets/sprites/player/bow/shoot.png",
        range: 250, // Longer projectile range
        damage: PLAYER_CONSTANTS.SLINGSHOT_DAMAGE * 1.5, // More damage
        staminaCost: PLAYER_CONSTANTS.SLINGSHOT_STAMINA_COST,
        cooldown: playerAttack.cooldown,
        projectileSpeed: PLAYER_CONSTANTS.SLINGSHOT_PROJECTILE_SPEED * 1.2, // Faster projectiles
        description: "Enhanced ranged weapon (Level 6-10)",
      },
      crossbow: {
        type: "crossbow",
        category: "ranged",
        spritePath: "/assets/sprites/player/crossbow/walk.png",
        attackSpritePath: "/assets/sprites/player/crossbow/shoot.png",
        range: 300, // Longest projectile range
        damage: PLAYER_CONSTANTS.SLINGSHOT_DAMAGE * 2, // Double damage
        staminaCost: PLAYER_CONSTANTS.SLINGSHOT_STAMINA_COST * 0.8, // Less stamina cost
        cooldown: playerAttack.cooldown * 0.7, // Faster attacks
        projectileSpeed: PLAYER_CONSTANTS.SLINGSHOT_PROJECTILE_SPEED * 1.5, // Fastest projectiles
        description: "Ultimate ranged weapon (Level 11-15)",
      },
    };

    return weaponInfo[currentWeapon] || weaponInfo.dagger;
  }

  /**
   * Check if the current weapon is a melee weapon
   * @returns {boolean} True if current weapon is melee
   */
  isMeleeWeapon() {
    return this.weaponType === "melee";
  }

  /**
   * Check if the current weapon is a ranged weapon
   * @returns {boolean} True if current weapon is ranged
   */
  isRangedWeapon() {
    return this.weaponType === "ranged";
  }

  /**
   * Get weapon damage including bonuses
   * @returns {number} Total weapon damage
   */
  getWeaponDamage() {
    const weaponInfo = this.getWeaponInfo();
    const bonus = this.isMeleeWeapon()
      ? this.meleeDamageBonus
      : this.rangedDamageBonus;
    return weaponInfo.damage + bonus;
  }

  // Updated draw method with sprite scaling for consistent character size
  draw(ctx) {
    // Custom sprite rendering with scaling compensation
    if (this.spriteImage && this.spriteRect) {
      // Get the current weapon and animation state to determine scaling factor
      const currentWeapon = this.getCurrentWeapon();
      const animationState = this.isAttacking ? "attack" : "walk";
      const weaponScaling =
        SPRITE_SCALING_CONSTANTS.WEAPON_SCALE_FACTORS[currentWeapon];
      const scaleFactor = weaponScaling
        ? weaponScaling[animationState] || 1.0
        : 1.0;

      // Calculate scaled dimensions while maintaining character proportions
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

    // Draw hitbox for debugging (from GameObject.draw)
    if (variables.showHitboxes) {
      const hitboxBounds = this.getHitboxBounds();
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        hitboxBounds.x,
        hitboxBounds.y,
        hitboxBounds.width,
        hitboxBounds.height
      );
    }

    // Draw projectiles
    this.projectiles.forEach((projectile) => projectile.draw(ctx));

    if (this.isMeleeWeapon() && this.isAttacking && variables.showHitboxes) {
      const playerCenter = new Vec(
        this.position.x + this.width / 2,
        this.position.y + this.height / 2
      );
      const attackDirection = this.getAttackDirection();
      const weaponInfo = this.getWeaponInfo();
      const attackArea = this.calculateAttackArea(
        playerCenter,
        attackDirection,
        weaponInfo.range,
        DAGGER_ATTACK_WIDTH // Keep using same width for all melee weapons
      );

      const isLimited =
        this.raycastToWall(playerCenter, attackDirection, weaponInfo.range) <
        weaponInfo.range;
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
      let dashDir = null;
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
        if (currentVelocity.magnitude() > 0) {
          dashDir = currentVelocity.normalize();
        }
      }

      if (!dashDir) {
        switch (this.previousDirection) {
          case "up":
            dashDir = new Vec(0, -1);
            break;
          case "down":
            dashDir = new Vec(0, 1);
            break;
          case "left":
            dashDir = new Vec(-1, 0);
            break;
          case "right":
            dashDir = new Vec(1, 0);
            break;
          default:
            dashDir = null;
        }
      }
      // Solo dash si hay movimiento
      if (dashDir) {
        this.dashDirection = dashDir;
        this.dashTime = this.dashDuration;
        this.stamina -= DASH_STAMINA_COST;
        this.staminaCooldown = this.staminaRegenDelay;
        this.dashCooldownTime = this.dashCooldown;
        this.isInvulnerable = true;
        this.invulnerabilityTimer = this.dashDuration;

        // Play dash sound effect
        if (window.game && window.game.audioManager) {
          window.game.audioManager.playPlayerDashSFX();
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

    // NEW v3.0: Apply movement speed multiplier from permanent upgrades
    const baseSpeed = variables.playerSpeed;
    const finalSpeed = baseSpeed * (this.speedMultiplier || 1.0);

    this.velocity = this.velocity.normalize().times(finalSpeed);
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

  /**
   * Get the current specific weapon based on weapon type and level
   * @param {string} weaponType - "melee" or "ranged"
   * @returns {string} The specific weapon name
   */
  getCurrentWeapon(weaponType = this.weaponType) {
    if (weaponType === "melee") {
      return this.getCurrentMeleeWeapon();
    } else if (weaponType === "ranged") {
      return this.getCurrentRangedWeapon();
    }
    return "dagger"; // fallback
  }

  /**
   * Get current melee weapon based on level
   * @returns {string} Current melee weapon
   */
  getCurrentMeleeWeapon() {
    if (this.meleeLevel >= 11) {
      return "lightsaber";
    } else if (this.meleeLevel >= 6) {
      return "katana";
    } else {
      return "dagger";
    }
  }

  /**
   * Get current ranged weapon based on level
   * @returns {string} Current ranged weapon
   */
  getCurrentRangedWeapon() {
    if (this.rangedLevel >= 11) {
      return "crossbow";
    } else if (this.rangedLevel >= 6) {
      return "bow";
    } else {
      return "slingshot";
    }
  }

  /**
   * NEW: Upgrade melee weapon level using weaponUpgradeManager
   */
  async upgradeMeleeWeapon() {
    try {
      const result = await weaponUpgradeManager.upgradeWeapon("melee");

      if (result.success) {
        const oldWeapon = this.getCurrentMeleeWeapon();
        this.meleeLevel = result.newLevel;
        const newWeapon = this.getCurrentMeleeWeapon();

        console.log(
          `Melee weapon upgraded to level ${this.meleeLevel}! ${oldWeapon} → ${newWeapon}`
        );

        // If currently using melee weapon, update sprite
        if (this.weaponType === "melee") {
          this.updateWeaponSprite();
        }

        return true;
      } else {
        console.log(`Cannot upgrade melee weapon: ${result.message}`);
        return false;
      }
    } catch (error) {
      console.error("Failed to upgrade melee weapon:", error);
      return false;
    }
  }

  /**
   * NEW: Upgrade ranged weapon level using weaponUpgradeManager
   */
  async upgradeRangedWeapon() {
    try {
      const result = await weaponUpgradeManager.upgradeWeapon("ranged");

      if (result.success) {
        const oldWeapon = this.getCurrentRangedWeapon();
        this.rangedLevel = result.newLevel;
        const newWeapon = this.getCurrentRangedWeapon();

        console.log(
          `Ranged weapon upgraded to level ${this.rangedLevel}! ${oldWeapon} → ${newWeapon}`
        );

        // If currently using ranged weapon, update sprite
        if (this.weaponType === "ranged") {
          this.updateWeaponSprite();
        }

        return true;
      } else {
        console.log(`Cannot upgrade ranged weapon: ${result.message}`);
        return false;
      }
    } catch (error) {
      console.error("Failed to upgrade ranged weapon:", error);
      return false;
    }
  }

  /**
   * Update weapon sprite to current weapon without changing weapon type
   */
  updateWeaponSprite() {
    const spritePath = this.getWeaponSpritePath();

    // Set correct sheetCols for walk sprites (all walk sprites have 9 columns)
    this.sheetCols = 9;

    this.setSprite(spritePath);
    this.resetToCurrentDirectionAnimation();

    const currentWeapon = this.getCurrentWeapon();
    // Only log essential weapon changes, not every sprite update
    // console.log(
    //   `Weapon sprite updated to ${currentWeapon} (${this.weaponType} level ${
    //     this.weaponType === "melee" ? this.meleeLevel : this.rangedLevel
    //   }) - ${this.sheetCols} columns`
    // );
  }

  /**
   * Get current weapon level for the specified weapon type
   * @param {string} weaponType - "melee" or "ranged"
   * @returns {number} Current weapon level
   */
  getWeaponLevel(weaponType = this.weaponType) {
    return weaponType === "melee" ? this.meleeLevel : this.rangedLevel;
  }

  /**
   * Get weapon status information for UI display
   * @returns {Object} Weapon status including levels, current weapons, and upgrade availability
   */
  getWeaponStatus() {
    return {
      currentWeaponType: this.weaponType,
      currentWeapon: this.getCurrentWeapon(),
      meleeLevel: this.meleeLevel,
      rangedLevel: this.rangedLevel,
      currentMeleeWeapon: this.getCurrentMeleeWeapon(),
      currentRangedWeapon: this.getCurrentRangedWeapon(),
      maxLevel: this.maxWeaponLevel,
      canUpgradeMelee: this.meleeLevel < this.maxWeaponLevel,
      canUpgradeRanged: this.rangedLevel < this.maxWeaponLevel,
      nextMeleeWeapon:
        this.meleeLevel < this.maxWeaponLevel
          ? this.getNextMeleeWeapon()
          : null,
      nextRangedWeapon:
        this.rangedLevel < this.maxWeaponLevel
          ? this.getNextRangedWeapon()
          : null,
    };
  }

  /**
   * Get the next melee weapon that will be unlocked at the next tier
   * @returns {string|null} Next melee weapon or null if at max level
   */
  getNextMeleeWeapon() {
    if (this.meleeLevel >= this.maxWeaponLevel) return null;
    if (this.meleeLevel < 6) return "katana";
    if (this.meleeLevel < 11) return "lightsaber";
    return null;
  }

  /**
   * Get the next ranged weapon that will be unlocked at the next tier
   * @returns {string|null} Next ranged weapon or null if at max level
   */
  getNextRangedWeapon() {
    if (this.rangedLevel >= this.maxWeaponLevel) return null;
    if (this.rangedLevel < 6) return "bow";
    if (this.rangedLevel < 11) return "crossbow";
    return null;
  }

  /**
   * Switch to melee weapon and update sprite
   */
  switchToMeleeWeapon() {
    this.setWeapon("melee");
  }

  /**
   * Switch to ranged weapon and update sprite
   */
  switchToRangedWeapon() {
    this.setWeapon("ranged");
  }

  /**
   * NEW: Apply permanent upgrade to player
   * @param {Object} upgrade - Upgrade data from database
   * @param {string} upgrade.upgrade_type - Type of upgrade
   * @param {number} upgrade.level - Level of the upgrade
   */
  applyUpgrade(upgrade) {
    const { upgrade_type, level } = upgrade;

    // Get upgrade values from constants
    const PERMANENT_UPGRADES = {
      health_max: { value: 15 },
      stamina_max: { value: 20 },
      movement_speed: { value: 0.1 },
    };

    const upgradeInfo = PERMANENT_UPGRADES[upgrade_type];
    if (!upgradeInfo) {
      console.warn(`Unknown permanent upgrade type: ${upgrade_type}`);
      return;
    }

    const totalBonus = upgradeInfo.value * level;

    switch (upgrade_type) {
      case "health_max":
        const oldMaxHealth = this.maxHealth;
        this.maxHealth += totalBonus;
        // Increase current health to maintain health percentage
        const healthPercentage = this.health / oldMaxHealth;
        this.health = Math.floor(this.maxHealth * healthPercentage);
        console.log(
          `Permanent health upgrade applied: +${totalBonus} (level ${level}). New max health: ${this.maxHealth}`
        );
        break;

      case "stamina_max":
        const oldMaxStamina = this.maxStamina;
        this.maxStamina += totalBonus;
        // Increase current stamina to maintain stamina percentage
        const staminaPercentage = this.stamina / oldMaxStamina;
        this.stamina = Math.floor(this.maxStamina * staminaPercentage);
        console.log(
          `Permanent stamina upgrade applied: +${totalBonus} (level ${level}). New max stamina: ${this.maxStamina}`
        );
        break;

      case "movement_speed":
        // Apply movement speed boost (multiplicative)
        const speedMultiplier = 1 + upgradeInfo.value * level;
        // Note: This would need to be applied to the movement logic in setVelocity()
        console.log(
          `Permanent movement speed upgrade applied: +${
            upgradeInfo.value * level * 100
          }% (level ${level})`
        );
        // TODO: Implement movement speed boost in setVelocity method
        break;

      default:
        console.warn(`Unhandled permanent upgrade type: ${upgrade_type}`);
    }
  }
}
