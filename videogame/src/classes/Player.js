import { AnimatedObject } from "./AnimatedObject.js";
import { Vec } from "./Vec.js";
import { Rect } from "./Rect.js";
import { Projectile } from "./Projectile.js";
import {
  variables,
  playerMovement,
  playerAttack,
  getAttackFrames,
} from "../config.js";

// Attack range constants
const DAGGER_ATTACK_RANGE = 30;
const DAGGER_ATTACK_WIDTH = 20;
const DAGGER_ATTACK_DAMAGE = 10;

export class Player extends AnimatedObject {
  constructor(position, width, height, color, sheetCols) {
    super(position, width, height, color, "player", sheetCols);
    this.velocity = new Vec(0, 0);
    this.keys = [];
    this.previousDirection = "down";
    this.currentDirection = "down";
    // ——— DASH PROPERTIES ———
    this.dashDuration = 100; // ms que dura el dash
    this.dashSpeed = variables.playerSpeed * 3; // velocidad durante dash
    this.dashTime = 0; // tiempo restante de dash
    this.dashCooldown = 0; // ms de cooldown entre dashes
    this.dashCooldownTime = 0; // timer de cooldown
    this.dashDirection = new Vec(0, 0); // dirección fijada al dash
    this.weaponType = "dagger"; // Default weapon
    this.isAttacking = false;
    this.attackCooldown = 0;
    this.projectiles = []; // Array to store active projectiles
    this.hasCreatedProjectile = false; // Flag to track if projectile was created
    this.hasAppliedMeleeDamage = false; // Flag to track if melee damage was applied

    // Player stats
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.isInvulnerable = false;
    this.invulnerabilityDuration = 1000; // 1 second of invulnerability after taking damage
    this.invulnerabilityTimer = 0;

    // Customize hitbox to better match player's feet
    this.hitbox = {
      width: width * 0.6,
      height: height * 0.6,
      offsetX: width * 0.2,  // Center horizontally (20% margin on each side)
      offsetY: height * 0.3  // Move hitbox down (30% margin at top, 10% at bottom)
    };
  }

  setCurrentRoom(room) {
    this.currentRoom = room;
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
    // TODO: Implement death logic
    console.log("Player died!");
  }

  setWeapon(type) {
    if (type === "dagger" || type === "slingshot") {
      this.weaponType = type;
      // Update sprite sheet based on weapon type
      const spritePath = type === "dagger" 
        ? "./assets/sprites/dagger-sprite-sheet.png" 
        : "./assets/sprites/slingshot-sprite-sheet.png";
      this.setSprite(spritePath, new Rect(0, 0, 64, 64));
      
      // Reset to idle animation in current direction
      const anim = playerMovement[this.currentDirection];
      this.setAnimation(anim.frames[0], anim.frames[0], false, anim.duration);
      this.frame = anim.frames[0];
      this.spriteRect.x = this.frame % this.sheetCols;
      this.spriteRect.y = Math.floor(this.frame / this.sheetCols);
    }
  }

  attack() {
    if (!this.isAttacking && this.attackCooldown <= 0) {
      this.isAttacking = true;
      this.hasCreatedProjectile = false; // Reset projectile creation flag
      this.hasAppliedMeleeDamage = false; // Reset melee damage flag
      this.attackCooldown = playerAttack.cooldown;

      // Apply melee damage immediately for dagger attacks
      if (this.weaponType === "dagger") {
        // Using constants defined at the top of the file
        const attackRange = DAGGER_ATTACK_RANGE;
        const attackWidth = DAGGER_ATTACK_WIDTH;
        const attackDamage = DAGGER_ATTACK_DAMAGE;

        // Calculate player center position
        const playerCenterX = this.position.x + this.width / 2;
        const playerCenterY = this.position.y + this.height / 2;

        // Define attack area based on direction
        let attackArea = {
          x: playerCenterX,
          y: playerCenterY,
          width: attackRange,
          height: attackWidth,
        };

        // Position attack area based on direction
        switch (this.currentDirection) {
          case "right":
            attackArea.x = playerCenterX;
            attackArea.y = playerCenterY - attackWidth / 2;
            break;
          case "left":
            attackArea.x = playerCenterX - attackRange;
            attackArea.y = playerCenterY - attackWidth / 2;
            break;
          case "up":
            attackArea.width = attackWidth;
            attackArea.height = attackRange;
            attackArea.x = playerCenterX - attackWidth / 2;
            attackArea.y = playerCenterY - attackRange;
            break;
          case "down":
            attackArea.width = attackWidth;
            attackArea.height = attackRange;
            attackArea.x = playerCenterX - attackWidth / 2;
            attackArea.y = playerCenterY;
            break;
        }

        // Get all enemies and check for collision with attack area
        const enemies = window.game.enemies;
        enemies.forEach((enemy) => {
          // Get enemy hitbox in world coordinates
          const enemyHitbox = enemy.getHitboxBounds();

          // Check collision between attack area and enemy hitbox
          if (
            attackArea.x < enemyHitbox.x + enemyHitbox.width &&
            attackArea.x + attackArea.width > enemyHitbox.x &&
            attackArea.y < enemyHitbox.y + enemyHitbox.height &&
            attackArea.y + attackArea.height > enemyHitbox.y
          ) {
            enemy.takeDamage(attackDamage);
          }
        });
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
          const projectileSpeed = 300;
          const projectileDamage = 15;

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
          this.projectiles.push(projectile);
          this.hasCreatedProjectile = true; // Mark that we've created the projectile
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

      // Update projectiles
      this.projectiles = this.projectiles.filter((projectile) => {
        projectile.update(deltaTime, window.game.enemies);
        return projectile.isActive;
      });

      this.setVelocity();
      
      // Try movement in X direction
      const newPositionX = this.position.plus(new Vec(this.velocity.x * deltaTime, 0));
      const tempPlayerX = new Player(
        newPositionX,
        this.width,
        this.height,
        this.color,
        this.sheetCols
      );

      // Try movement in Y direction
      const newPositionY = this.position.plus(new Vec(0, this.velocity.y * deltaTime));
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

  draw(ctx) {
    super.draw(ctx);
    // Draw projectiles
    this.projectiles.forEach((projectile) => projectile.draw(ctx));

    // Draw attack range visualization for melee attacks (dagger)
    if (this.weaponType === "dagger") {
      const attackRange = DAGGER_ATTACK_RANGE;
      const attackWidth = DAGGER_ATTACK_WIDTH;

      // Calculate player center position
      const playerCenterX = this.position.x + this.width / 2;
      const playerCenterY = this.position.y + this.height / 2;

      // Define attack area based on direction
      let attackArea = {
        x: playerCenterX,
        y: playerCenterY,
        width: attackRange,
        height: attackWidth,
      };

      // Position attack area based on direction
      switch (this.currentDirection) {
        case "right":
          attackArea.x = playerCenterX;
          attackArea.y = playerCenterY - attackWidth / 2;
          break;
        case "left":
          attackArea.x = playerCenterX - attackRange;
          attackArea.y = playerCenterY - attackWidth / 2;
          break;
        case "up":
          attackArea.width = attackWidth;
          attackArea.height = attackRange;
          attackArea.x = playerCenterX - attackWidth / 2;
          attackArea.y = playerCenterY - attackRange;
          break;
        case "down":
          attackArea.width = attackWidth;
          attackArea.height = attackRange;
          attackArea.x = playerCenterX - attackWidth / 2;
          attackArea.y = playerCenterY;
          break;
      }

      // Draw the attack area
      ctx.strokeStyle = "rgba(255, 0, 0, 0.7)";
      ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
      ctx.lineWidth = 2;
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
}
