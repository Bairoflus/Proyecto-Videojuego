/**
 * Base class for melee enemy types
 * Extends Enemy with close-range combat behavior
 * Provides simple chase-and-attack behavior for melee enemies
 */
import { Enemy } from "./Enemy.js";
import { Vec } from "../../utils/Vec.js";
import { Rect } from "../../utils/Rect.js";
import { variables } from "../../config.js";

export class MeleeEnemy extends Enemy {
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
    range = 50,
    attackRange = { width: 32, height: 32 }, // New attack range parameter
    enemyTypeName // Optional name for the enemy type
  ) {
    super(
      position,
      width,
      height,
      color,
      sheetCols,
      type,
      movementSpeed,
      baseDamage,
      maxHealth,
      range, // Pass range to parent
      0, // No projectile range for melee
      0, // No projectile damage for melee
      (enemyTypeName = "null")
    );

    // Melee-specific properties
    this.attackRange = range; // Detection/chase range
    this.attackAreaSize = attackRange; // Attack rectangle dimensions
    this.lastAttackTime = 0;
    this.attackCooldown = 1000; // 1 second cooldown
    this.hasAppliedDamage = false; // Prevent multi-hit per attack
  }

  // Override moveTo for simple chase behavior
  moveTo(targetPosition) {
    if (this.state === "dead") return;

    const direction = targetPosition.minus(this.position);
    const distance = direction.magnitude();

    if (distance > this.attackRange) {
      this.state = "chasing";
      this.velocity = direction.normalize().times(this.movementSpeed);

      // Use parent's safe movement method
      const newPosition = this.position.plus(this.velocity);
      this.moveToPosition(newPosition);
    } else {
      this.state = "attacking";
      this.velocity = new Vec(0, 0);
    }
  }

  /**
   * Calculate attack area rectangle based on enemy's facing direction
   * Similar to player's attack system but adapted for enemies
   * @returns {Rect} The attack area rectangle
   */
  calculateAttackArea() {
    const centerX = this.position.x + this.width / 2;
    const centerY = this.position.y + this.height / 2;
    
    // Determine direction based on movement or target direction
    let attackDirection = this.currentDirection || this.getAttackDirection();
    
    let attackRect;
    
    switch (attackDirection) {
      case "right":
        attackRect = new Rect(
          centerX,
          centerY - this.attackAreaSize.height / 2,
          this.attackAreaSize.width,
          this.attackAreaSize.height
        );
        break;
      case "left":
        attackRect = new Rect(
          centerX - this.attackAreaSize.width,
          centerY - this.attackAreaSize.height / 2,
          this.attackAreaSize.width,
          this.attackAreaSize.height
        );
        break;
      case "down":
        attackRect = new Rect(
          centerX - this.attackAreaSize.width / 2,
          centerY,
          this.attackAreaSize.width,
          this.attackAreaSize.height
        );
        break;
      case "up":
        attackRect = new Rect(
          centerX - this.attackAreaSize.width / 2,
          centerY - this.attackAreaSize.height,
          this.attackAreaSize.width,
          this.attackAreaSize.height
        );
        break;
      default:
        // Default to right direction
        attackRect = new Rect(
          centerX,
          centerY - this.attackAreaSize.height / 2,
          this.attackAreaSize.width,
          this.attackAreaSize.height
        );
    }
    
    return attackRect;
  }

  /**
   * Determine attack direction based on velocity or target position
   * @returns {string} Direction string: "up", "down", "left", "right"
   */
  getAttackDirection() {
    if (this.velocity.x > 0) return "right";
    if (this.velocity.x < 0) return "left";
    if (this.velocity.y > 0) return "down";
    if (this.velocity.y < 0) return "up";
    
    // Default direction if no movement
    return "right";
  }

  /**
   * Apply attack damage to target if within attack area
   * @param {Entity} target - The target to potentially damage
   * @returns {boolean} True if damage was applied
   */
  applyAttackDamage(target) {
    if (!target || target.state === "dead") return false;
    
    const currentTime = Date.now();
    
    // Check attack cooldown
    if (currentTime - this.lastAttackTime < this.attackCooldown) {
      return false;
    }
    
    // Check if already applied damage this attack cycle
    if (this.hasAppliedDamage) return false;
    
    const attackArea = this.calculateAttackArea();
    const targetRect = new Rect(target.position.x, target.position.y, target.width, target.height);
    
    // Check rectangle intersection
    if (attackArea.intersects(targetRect)) {
      target.takeDamage(this.baseDamage);
      this.lastAttackTime = currentTime;
      this.hasAppliedDamage = true;
      
      // Reset damage flag after a short delay to allow for next attack
      setTimeout(() => {
        this.hasAppliedDamage = false;
      }, 200);
      
      return true;
    }
    
    return false;
  }

  /**
   * Draw attack area for debugging purposes
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  drawAttackArea(ctx) {
    if (!variables.showHitboxes) return;
    
    const attackArea = this.calculateAttackArea();
    
    ctx.save();
    ctx.strokeStyle = "rgba(255, 0, 0, 0.7)";
    ctx.lineWidth = 2;
    ctx.strokeRect(attackArea.x, attackArea.y, attackArea.width, attackArea.height);
    ctx.restore();
  }
}
