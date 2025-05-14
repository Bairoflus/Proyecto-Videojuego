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
    const mag = this.magnitude();
    return mag === 0 ? new Vec(0, 0) : new Vec(this.x / mag, this.y / mag);
  }
}
