/**
 * Base enemy class
 * Provides common functionality for all enemy types including movement,
 * health management, collision detection, and basic AI behavior
 */
import { AnimatedObject } from "./AnimatedObject.js";
import { Vec } from "../../utils/Vec.js";
import { variables } from "../../config.js";
import { log } from "../../utils/Logger.js";
import { registerEnemyKill } from "../../utils/api.js";
import { enemyMappingService } from "../../utils/enemyMapping.js";

export class Enemy extends AnimatedObject {
  constructor(
    position,
    width,
    height,
    color,
    sheetCols,
    type,
    movementSpeed,
    baseDamage,
    maxHealth,
    enemyTypeName = null // Add enemy type name for backend mapping
  ) {
    super(position, width, height, color, "enemy", sheetCols);

    // Core stats
    this.maxHealth = maxHealth;
    this.health = this.maxHealth;
    this.movementSpeed = movementSpeed;
    this.baseDamage = baseDamage;
    this.attackRange = 50;
    this.attackCooldown = 0;
    this.attackDuration = 500;

    // State
    this.state = "idle"; // idle, chasing, attacking, dead
    this.target = null;
    this.velocity = new Vec(0, 0);
    this.type = type;
    this.enemyTypeName = enemyTypeName || type; // Backend mapping name
    this.currentDirection = "down";
    this.isAttacking = false;

    // Reference to current room for collision detection
    this.currentRoom = null;
  }

  // Set the current room reference for collision detection
  setCurrentRoom(room) {
    this.currentRoom = room;
  }

  // Safe movement method that respects wall collisions
  moveToPosition(newPosition) {
    if (this.state === "dead" || !this.currentRoom) {
      return false;
    }

    const originalPosition = new Vec(this.position.x, this.position.y);
    let collisionDetected = false;

    // Try movement in X direction only
    const newPositionX = new Vec(newPosition.x, this.position.y);
    this.position = newPositionX;

    if (this.currentRoom.checkWallCollision(this)) {
      // Revert X movement if it collides
      this.position.x = originalPosition.x;
      collisionDetected = true;
    }

    // Try movement in Y direction only
    const newPositionY = new Vec(this.position.x, newPosition.y);
    this.position = newPositionY;

    if (this.currentRoom.checkWallCollision(this)) {
      // Revert Y movement if it collides
      this.position.y = originalPosition.y;
      collisionDetected = true;
    }

    // Return true if we moved at all
    return this.position.x !== originalPosition.x || this.position.y !== originalPosition.y;
  }

  takeDamage(amount) {
    if (this.state === "dead") return;

    this.health = Math.max(0, this.health - amount);
    log.verbose(`${this.type} health:`, this.health);

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.state = "dead";
    log.debug(`${this.type} died`);
    
    // Track kill in global game statistics
    if (window.game && typeof window.game.trackKill === 'function') {
        window.game.trackKill();
    }

    // Register enemy kill with backend (non-blocking)
    this.registerKill().catch(error => {
      console.error('Failed to register enemy kill:', error);
    });

    // EVENT-DRIVEN UPDATE: Update room state when enemy dies
    if (this.currentRoom) {
      log.verbose("Updating room after enemy death");
      
      // Update the room state in floor generator
      if (window.game && window.game.floorGenerator) {
        window.game.floorGenerator.updateRoomState(undefined, this.currentRoom);
        log.verbose("Room state updated due to enemy death");
      }

      // FIX: Check if this was the last enemy in boss room to activate transition zone immediately
      const aliveEnemies = this.currentRoom.objects.enemies.filter(e => e.state !== 'dead');
      if (this.currentRoom.roomType === 'boss' && aliveEnemies.length === 0) {
        console.log('BOSS DEFEATED! Transition zone activated immediately');
        
        // Mark room as immediately available for transition
        this.currentRoom.bossDefeated = true;
        console.log(`Boss room marked as defeated (bossDefeated = true)`);
        
        // Notify game that boss room is cleared
        if (window.game) {
          console.log('Boss room cleared - player can now transition to next floor');
          // Set a flag that boss was just defeated for immediate feedback
          window.game.bossJustDefeated = true;
          
          // FIX: Show permanent upgrade popup immediately when boss is defeated (ONLY ONCE)
          if (window.game.permanentUpgradePopup && !window.game.bossUpgradeShown) {
            console.log('Showing permanent upgrade popup after boss defeat');
            window.game.permanentUpgradePopup.show();
            window.game.gameState = "upgradeSelection";
            window.game.bossUpgradeShown = true; // Mark as shown to prevent multiple displays
          }
        }
      }
    }
    
    // TODO: Add death animation and effects
  }

  /**
   * Register enemy kill with backend system
   * @returns {Promise<boolean>} Success status
   */
  async registerKill() {
    try {
      // Get required data from localStorage and game state
      const userId = localStorage.getItem('currentUserId');
      const runId = localStorage.getItem('currentRunId');
      const testMode = localStorage.getItem('testMode') === 'true';
      
      // Validate required data exists
      if (!userId || !runId) {
        if (testMode) {
          // Don't log anything in test mode to reduce console spam
          return false;
        } else {
          console.log('Kill tracking: Requires active session (use gameSessionDebug.fix())');
          return false;
        }
      }

      // Get current room ID and floor from floor generator
      const roomId = window.game?.floorGenerator?.getCurrentRoomId();
      const floor = window.game?.floorGenerator?.getCurrentFloor();
      
      if (!roomId) {
        console.warn('Kill registration skipped: Could not determine current room ID');
        return false;
      }

      // ✅ MAPEO INTELIGENTE V2 - CONSERVADOR
      let enemyType = 'common'; // Por defecto para melee
      
      // RANGED ENEMIES → 'rare'
      if (this.enemyTypeName === 'goblin_archer' || 
          this.enemyTypeName === 'GoblinArcher' ||
          this.enemyTypeName === 'mage_goblin' ||
          this.enemyTypeName === 'MageGoblin' ||
          this.enemyTypeName === 'great_bow_goblin' ||
          this.enemyTypeName === 'GreatBowGoblin' ||
          this.enemyTypeName.toLowerCase().includes('archer') ||
          this.enemyTypeName.toLowerCase().includes('mage') ||
          this.enemyTypeName.toLowerCase().includes('bow') ||
          this.enemyTypeName.toLowerCase().includes('ranged')) {
        enemyType = 'rare';
      }
      
      // MELEE ENEMIES → 'common' (already default, but explicit for clarity)
      if (this.enemyTypeName === 'goblin_dagger' || 
          this.enemyTypeName === 'GoblinDagger' ||
          this.enemyTypeName === 'sword_goblin' ||
          this.enemyTypeName === 'SwordGoblin' ||
          this.enemyTypeName === 'goblin' ||
          this.enemyTypeName.toLowerCase().includes('melee') ||
          this.enemyTypeName.toLowerCase().includes('dagger') ||
          this.enemyTypeName.toLowerCase().includes('sword')) {
        enemyType = 'common';
      }

      // Prepare kill data in the format the backend expects
      const killData = {
        userId: parseInt(userId),
        enemyType: enemyType, // Send 'common' or 'rare' instead of numeric ID
        roomId: roomId,
        floor: floor || 1
      };

      console.log(`Registering enemy kill:`, {
        enemyTypeName: this.enemyTypeName,
        mappedTo: enemyType,
        roomId: roomId,
        floor: floor,
        userId: parseInt(userId)
      });

      // Call backend API to register kill
      const result = await registerEnemyKill(runId, killData);
      
      console.log('Enemy kill registered successfully:', result);
      return true;

    } catch (error) {
      console.error('Failed to register enemy kill:', error);
      // Don't throw error to prevent game disruption
      return false;
    }
  }

  moveTo(targetPosition) {
    if (this.state === "dead") return;

    const direction = targetPosition.minus(this.position);
    const distance = direction.magnitude();

    if (distance > this.attackRange) {
      this.state = "chasing";
      this.velocity = direction.normalize().times(this.movementSpeed);

      // Calculate new position and use safe movement
      const newPosition = this.position.plus(this.velocity);
      this.moveToPosition(newPosition);
    } else {
      this.state = "attacking";
      this.velocity = new Vec(0, 0);
    }
  }

  attack(target) {
    if (this.state === "dead" || this.attackCooldown > 0) return;

    // Calculate target hitbox center position
    const targetHitbox = target.getHitboxBounds();
    const targetCenter = new Vec(
      targetHitbox.x + targetHitbox.width / 2,
      targetHitbox.y + targetHitbox.height / 2
    );

    const distance = targetCenter.minus(this.position).magnitude();
    if (distance <= this.attackRange) {
      this.isAttacking = true;
      this.attackCooldown = this.attackDuration;
      target.takeDamage(this.baseDamage);
    }
  }

  update(deltaTime) {
    if (this.state === "dead") {
      // Even dead enemies need to update their projectiles
      this.updateProjectiles(deltaTime, null);
      return;
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }

    // Update projectiles if this enemy has them
    this.updateProjectiles(deltaTime, window.game?.player);

    this.updateAnimation();
    this.constrainToCanvas();
  }

  updateAnimation() {
    // To be implemented by specific enemy types
  }

  constrainToCanvas() {
    const w = variables.canvasWidth;
    const h = variables.canvasHeight;
    if (this.position.y < 0) this.position.y = 0;
    else if (this.position.y + this.height > h)
      this.position.y = h - this.height;
    if (this.position.x < 0) this.position.x = 0;
    else if (this.position.x + this.width > w) this.position.x = w - this.width;
  }

  draw(ctx) {
    super.draw(ctx);

    // Draw hitbox if enabled
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
    ctx.fillStyle = "rgba(0, 255, 0, 0.8)"; // Semi-transparent green
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
    
    // Draw projectiles if they exist
    if (this.projectiles) {
      this.projectiles.forEach(projectile => {
        if (projectile.isActive) {
          // Draw projectile as a simple circle
          ctx.fillStyle = "red";
          ctx.beginPath();
          ctx.arc(projectile.position.x, projectile.position.y, projectile.radius, 0, 2 * Math.PI);
          ctx.fill();
          
          // Add a white border
          ctx.strokeStyle = "white";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });
    }
  }

  /**
   * Initialize projectile system for ranged enemies
   */
  initializeProjectiles() {
    if (!this.projectiles) {
      this.projectiles = [];
      this.projectileSpeed = this.projectileSpeed || 300;
    }
  }

  /**
   * Fire a projectile towards the target
   * @param {Player} target - The target to fire at
   */
  fireProjectile(target) {
    if (this.state === "dead" || !target) return;

    // Initialize projectiles array if not exists
    this.initializeProjectiles();

    // Calculate target hitbox center position
    const targetHitbox = target.getHitboxBounds();
    const targetCenter = new Vec(
      targetHitbox.x + targetHitbox.width / 2,
      targetHitbox.y + targetHitbox.height / 2
    );

    // Calculate projectile starting position (center of enemy)
    const startPosition = new Vec(
      this.position.x + this.width / 2,
      this.position.y + this.height / 2
    );

    // Calculate direction vector
    const direction = targetCenter.minus(startPosition).normalize();

    // Create projectile object
    const projectile = {
      position: new Vec(startPosition.x, startPosition.y),
      velocity: direction.times(this.projectileSpeed),
      damage: this.baseDamage,
      radius: 5,
      isActive: true,
      lifetime: 5000, // 5 seconds max lifetime
      timeAlive: 0
    };

    this.projectiles.push(projectile);
    console.log(`${this.type} fired projectile towards player`);
  }

  /**
   * Update all projectiles - handles movement, collision, and cleanup
   * @param {number} deltaTime - Time since last update
   * @param {Player} player - Player object for collision detection
   */
  updateProjectiles(deltaTime, player) {
    if (!this.projectiles) return;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      
      if (!projectile.isActive) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Update position
      projectile.position = projectile.position.plus(
        projectile.velocity.times(deltaTime / 1000)
      );

      // Update lifetime
      projectile.timeAlive += deltaTime;
      if (projectile.timeAlive >= projectile.lifetime) {
        projectile.isActive = false;
        continue;
      }

      // Check bounds
      if (
        projectile.position.x < 0 ||
        projectile.position.x > variables.canvasWidth ||
        projectile.position.y < 0 ||
        projectile.position.y > variables.canvasHeight
      ) {
        projectile.isActive = false;
        continue;
      }

      // Check wall collision
      if (this.currentRoom) {
        const tempProjectile = {
          position: projectile.position,
          width: projectile.radius * 2,
          height: projectile.radius * 2,
          getHitboxBounds: () => ({
            x: projectile.position.x - projectile.radius,
            y: projectile.position.y - projectile.radius,
            width: projectile.radius * 2,
            height: projectile.radius * 2
          })
        };

        if (this.currentRoom.checkWallCollision(tempProjectile)) {
          projectile.isActive = false;
          continue;
        }
      }

      // Check player collision
      if (player && player.health > 0) {
        const playerHitbox = player.getHitboxBounds();
        const projectileHitbox = {
          x: projectile.position.x - projectile.radius,
          y: projectile.position.y - projectile.radius,
          width: projectile.radius * 2,
          height: projectile.radius * 2
        };

        if (this.checkProjectilePlayerCollision(projectileHitbox, playerHitbox)) {
          // Hit player
          player.takeDamage(projectile.damage);
          projectile.isActive = false;
          console.log(`${this.type} projectile hit player for ${projectile.damage} damage`);
        }
      }
    }

    // Clean up inactive projectiles
    this.projectiles = this.projectiles.filter(p => p.isActive);
  }

  /**
   * Check collision between projectile and player
   * @param {Object} projectileHitbox - Projectile hitbox bounds
   * @param {Object} playerHitbox - Player hitbox bounds
   * @returns {boolean} True if collision detected
   */
  checkProjectilePlayerCollision(projectileHitbox, playerHitbox) {
    return (
      projectileHitbox.x < playerHitbox.x + playerHitbox.width &&
      projectileHitbox.x + projectileHitbox.width > playerHitbox.x &&
      projectileHitbox.y < playerHitbox.y + playerHitbox.height &&
      projectileHitbox.y + projectileHitbox.height > playerHitbox.y
    );
  }
}
