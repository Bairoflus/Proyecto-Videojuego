/**
 * 2D Vector class
 * Provides vector math operations for position, velocity, and direction calculations
 * Used throughout the game for movement and physics
 */
export class Vec {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  plus(other) {
    return new Vec(this.x + other.x, this.y + other.y);
  }

  minus(other) {
    return new Vec(this.x - other.x, this.y - other.y);
  }

  times(scalar) {
    return new Vec(this.x * scalar, this.y * scalar);
  }

  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize() {
    const mag = this.magnitude();
    if (mag === 0) return new Vec(0, 0);
    return this.times(1 / mag);
  }
}
