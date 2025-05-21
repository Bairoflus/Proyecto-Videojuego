import { AnimatedObject } from "./AnimatedObject.js";
import { Vec } from "./Vec.js";
import { variables } from "../config.js";

export class Enemy extends AnimatedObject {
  constructor(position, width, height, color, sheetCols, type) {
    super(position, width, height, color, "enemy", sheetCols);

    // Core stats
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.movementSpeed = variables.playerSpeed * 0.7;
    this.baseDamage = 10;
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
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.state = "dead";
  }

  moveTo(targetPosition) {
    if (this.state === "dead") return;

    const direction = targetPosition.minus(this.position);
    const distance = direction.length();

    if (distance > this.attackRange) {
      this.state = "chasing";
      this.velocity = direction.normalize().times(this.movementSpeed);
      this.position = this.position.plus(this.velocity);
    } else {
      this.state = "attacking";
      this.velocity = new Vec(0, 0);
    }
  }

  attack(target) {
    if (this.state === "dead" || this.attackCooldown > 0) return;

    const distance = target.position.minus(this.position).length();
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

    // Health bar
    const healthBarWidth = 50;
    const healthBarHeight = 5;
    const healthPercentage = this.health / this.maxHealth;

    ctx.fillStyle = "red";
    ctx.fillRect(
      this.position.x + (this.width - healthBarWidth) / 2,
      this.position.y - 10,
      healthBarWidth,
      healthBarHeight
    );

    ctx.fillStyle = "green";
    ctx.fillRect(
      this.position.x + (this.width - healthBarWidth) / 2,
      this.position.y - 10,
      healthBarWidth * healthPercentage,
      healthBarHeight
    );
  }
}
