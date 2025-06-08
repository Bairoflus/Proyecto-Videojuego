/**
 * Rectangle class
 * Represents rectangular areas for collision detection, sprite regions, and boundaries
 */
export class Rect {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  /**
   * Check if this rectangle intersects with another rectangle
   * @param {Rect} other - The other rectangle to check intersection with
   * @returns {boolean} True if rectangles intersect, false otherwise
   */
  intersects(other) {
    return !(
      this.x + this.width <= other.x ||
      other.x + other.width <= this.x ||
      this.y + this.height <= other.y ||
      other.y + other.height <= this.y
    );
  }

  /**
   * Check if this rectangle contains a point
   * @param {number} x - X coordinate of the point
   * @param {number} y - Y coordinate of the point
   * @returns {boolean} True if point is inside rectangle
   */
  contains(x, y) {
    return (
      x >= this.x &&
      x <= this.x + this.width &&
      y >= this.y &&
      y <= this.y + this.height
    );
  }

  /**
   * Get the center point of the rectangle
   * @returns {Object} Object with x and y properties
   */
  getCenter() {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
    };
  }

  /**
   * Create a copy of this rectangle
   * @returns {Rect} A new Rect instance with the same properties
   */
  copy() {
    return new Rect(this.x, this.y, this.width, this.height);
  }
}
