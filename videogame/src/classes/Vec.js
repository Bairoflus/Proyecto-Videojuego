// Vec.js: Vector 2D con operaciones básicas
export class Vec {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  plus(o) {
    return new Vec(this.x + o.x, this.y + o.y);
  }
  minus(o) {
    return new Vec(this.x - o.x, this.y - o.y);
  }
  times(s) {
    return new Vec(this.x * s, this.y * s);
  }
  magnitude() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }
  normalize() {
    const m = this.magnitude();
    return m === 0 ? new Vec(0, 0) : new Vec(this.x / m, this.y / m);
  }
}