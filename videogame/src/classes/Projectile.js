import { Vec } from "./Vec.js";

export class Projectile {
  constructor(position, target, speed, damage, radius = 5) {
    this.position = position;
    this.radius = radius;
    this.speed = speed;
    this.damage = damage;

    // Calculate direction to target
    const direction = target.position.minus(position);
    this.velocity = direction.normalize().times(speed);

    // Projectile state
    this.isActive = true;
  }

  update(deltaTime) {
    if (!this.isActive) return;

    // Move projectile
    this.position = this.position.plus(this.velocity.times(deltaTime / 1000));

    // Check if projectile is out of bounds
    if (
      this.position.x < 0 ||
      this.position.x > 800 ||
      this.position.y < 0 ||
      this.position.y > 600
    ) {
      this.isActive = false;
    }
  }

  draw(ctx) {
    if (!this.isActive) return;

    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.closePath();
  }

  checkCollision(entity) {
    if (!this.isActive) return false;

    const distance = this.position.minus(entity.position).length();
    return distance < this.radius + entity.width / 2;
  }
}
