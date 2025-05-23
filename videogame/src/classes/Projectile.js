import { Vec } from "./Vec.js";

export class Projectile {
  constructor(position, target, speed, damage, radius = 5) {
    this.position = position;
    this.radius = radius;
    this.speed = speed;
    this.damage = damage;

    // Calculate direction to target
    // Handle both Vec objects and objects with position property
    const targetPosition = target instanceof Vec ? target : target.position;
    const direction = targetPosition.minus(position);
    this.velocity = direction.normalize().times(speed);

    // Projectile state
    this.isActive = true;
    this.hasHit = false;
  }

  update(deltaTime, entities) {
    if (!this.isActive) return;

    // Move projectile
    this.position = this.position.plus(this.velocity.times(deltaTime / 1000));

    // Check collision with all entities
    if (entities) {
      // Convert single entity to array if needed
      const entityArray = Array.isArray(entities) ? entities : [entities];
      entityArray.forEach((entity) => {
        if (this.checkCollision(entity)) {
          this.handleCollision(entity);
        }
      });
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
    if (!this.isActive || this.hasHit || entity.state === "dead") return false;

    // Use hitbox for collision
    const hitbox = entity.getHitboxBounds
      ? entity.getHitboxBounds()
      : {
          x: entity.position.x,
          y: entity.position.y,
          width: entity.width,
          height: entity.height,
        };
    // Treat projectile as a small box for collision
    const projBox = {
      x: this.position.x - this.radius,
      y: this.position.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2,
    };
    return (
      projBox.x < hitbox.x + hitbox.width &&
      projBox.x + projBox.width > hitbox.x &&
      projBox.y < hitbox.y + hitbox.height &&
      projBox.y + projBox.height > hitbox.y
    );
  }

  handleCollision(entity) {
    if (this.hasHit) return;

    this.hasHit = true;
    this.isActive = false;

    // Apply damage to entity
    entity.takeDamage(this.damage);

    // TODO: Add hit effect/particles here
  }
}
