/**
 * Base enemy class
 * Provides common functionality for all enemy types including movement,
 * health management, collision detection, and basic AI behavior
 */
import { AnimatedObject } from "./AnimatedObject.js";
import { Vec } from "../../utils/Vec.js";
import { variables } from "../../config.js";
import { log } from "../../utils/Logger.js";

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
    maxHealth
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
    return (
      this.position.x !== originalPosition.x ||
      this.position.y !== originalPosition.y
    );
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

    // EVENT-DRIVEN UPDATE: Update room state when enemy dies
    if (window.game && window.game.floorGenerator && this.currentRoom) {
      window.game.floorGenerator.updateRoomState(
        window.game.floorGenerator.getCurrentRoomIndex(),
        this.currentRoom
      );
      log.verbose("Room state updated due to enemy death");
    }

    // TODO: Add death animation and effects
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
    if (this.state === "dead") return;

    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }

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
  }
}
