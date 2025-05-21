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
    this.hasHit = false;
  }

  update(deltaTime, player) {
    if (!this.isActive) return;

    // Move projectile
    this.position = this.position.plus(this.velocity.times(deltaTime / 1000));

    // Check collision with player
    if (player && this.checkCollision(player)) {
      this.handleCollision(player);
    }

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
    if (!this.isActive || this.hasHit) return false;

    const distance = this.position.minus(entity.position).magnitude();
    return distance < this.radius + entity.width / 2;
  }

  handleCollision(player) {
    if (this.hasHit) return;

    this.hasHit = true;
    this.isActive = false;

    // Apply damage to player
    player.takeDamage(this.damage);

    // TODO: Add hit effect/particles here
  }
}
